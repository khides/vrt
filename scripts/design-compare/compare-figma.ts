import 'dotenv/config';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Mapping {
  figmaNodeId: string;
  storyId: string;
  viewport: { width: number; height: number };
  description: string;
  threshold?: number; // Custom threshold per mapping (default: 15)
}

interface CompareConfig {
  figmaFileId: string;
  mappings: Mapping[];
}

interface CompareResult {
  figmaNodeId: string;
  storyId: string;
  description: string;
  diffPercentage: number;
  threshold: number;
  passed: boolean;
  figmaImage?: string;
  storyImage?: string;
  diffImage?: string;
  error?: string;
}

const REPORTS_DIR = path.join(process.cwd(), 'reports', 'figma-diff');
const STORYBOOK_URL = process.env.STORYBOOK_URL || 'http://localhost:6007';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 2000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429) {
      console.log(`     ⏳ Rate limited, waiting ${delay / 1000}s before retry ${i + 1}/${retries}...`);
      await sleep(delay);
      delay *= 2; // Exponential backoff
      continue;
    }
    return response;
  }
  throw new Error('Max retries exceeded for rate limiting');
}

// Batch fetch all Figma images in a single API call
async function fetchAllFigmaImages(
  fileId: string,
  nodeIds: string[]
): Promise<Map<string, Buffer | null>> {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  const results = new Map<string, Buffer | null>();

  if (!token) {
    console.warn('⚠️  FIGMA_ACCESS_TOKEN not set. Skipping Figma image fetch.');
    nodeIds.forEach(id => results.set(id, null));
    return results;
  }

  try {
    // Batch all node IDs into a single API request
    const idsParam = nodeIds.map(id => encodeURIComponent(id)).join(',');
    const response = await fetchWithRetry(
      `https://api.figma.com/v1/images/${fileId}?ids=${idsParam}&format=png&scale=2`,
      { headers: { 'X-Figma-Token': token } }
    );

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Fetch each image URL
    for (const nodeId of nodeIds) {
      const imageUrl = data.images?.[nodeId];
      if (!imageUrl) {
        console.warn(`     ⚠️ No image URL for node ${nodeId}`);
        results.set(nodeId, null);
        continue;
      }

      try {
        const imageResponse = await fetch(imageUrl);
        results.set(nodeId, Buffer.from(await imageResponse.arrayBuffer()));
      } catch (err) {
        console.error(`     Failed to download image for ${nodeId}:`, err);
        results.set(nodeId, null);
      }
    }
  } catch (error) {
    console.error('Failed to fetch Figma images:', error);
    nodeIds.forEach(id => results.set(id, null));
  }

  return results;
}

function cropPNG(png: PNG, targetWidth: number, targetHeight: number): PNG {
  const cropped = new PNG({ width: targetWidth, height: targetHeight });
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const srcIdx = (png.width * y + x) << 2;
      const dstIdx = (targetWidth * y + x) << 2;
      cropped.data[dstIdx] = png.data[srcIdx];
      cropped.data[dstIdx + 1] = png.data[srcIdx + 1];
      cropped.data[dstIdx + 2] = png.data[srcIdx + 2];
      cropped.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }
  return cropped;
}

function calculateDiff(
  img1Buffer: Buffer,
  img2Buffer: Buffer
): { percentage: number; diffBuffer: Buffer } {
  const img1 = PNG.sync.read(img1Buffer);
  const img2 = PNG.sync.read(img2Buffer);

  // Crop images to match the smaller dimensions
  const width = Math.min(img1.width, img2.width);
  const height = Math.min(img1.height, img2.height);

  const img1Cropped = img1.width === width && img1.height === height ? img1 : cropPNG(img1, width, height);
  const img2Cropped = img2.width === width && img2.height === height ? img2 : cropPNG(img2, width, height);

  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    img1Cropped.data,
    img2Cropped.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  const totalPixels = width * height;
  const percentage = (numDiffPixels / totalPixels) * 100;

  return {
    percentage,
    diffBuffer: PNG.sync.write(diff),
  };
}

async function captureStoryScreenshot(
  storyId: string,
  viewport: { width: number; height: number }
): Promise<Buffer> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize(viewport);
  await page.goto(`${STORYBOOK_URL}/iframe.html?id=${storyId}&viewMode=story`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Wait for animations

  const screenshot = await page.screenshot({ type: 'png' });
  await browser.close();

  return screenshot;
}

function generateHtmlReport(results: CompareResult[]): string {
  const getDiffClass = (result: CompareResult): string => {
    if (!result.passed) return 'diff-high';
    if (result.diffPercentage >= result.threshold * 0.7) return 'diff-medium';
    return 'diff-low';
  };

  const getStatusEmoji = (result: CompareResult): string => {
    if (!result.passed) return '❌';
    if (result.diffPercentage >= result.threshold * 0.7) return '⚠️';
    return '✅';
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Figma vs Implementation Diff Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
      background: #f5f5f7;
      color: #1d1d1f;
      padding: 40px;
    }
    h1 {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 32px;
    }
    .summary {
      display: flex;
      gap: 16px;
      margin-bottom: 32px;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .summary-card h3 { font-size: 0.875rem; color: #86868b; margin-bottom: 8px; }
    .summary-card .value { font-size: 2rem; font-weight: 600; }
    .comparison {
      background: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .comparison-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .comparison-title { font-size: 1.25rem; font-weight: 600; }
    .comparison-diff {
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .diff-low { background: #d1fae5; color: #065f46; }
    .diff-medium { background: #fef3c7; color: #92400e; }
    .diff-high { background: #fee2e2; color: #991b1b; }
    .comparison-images {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }
    .comparison-images > div { text-align: center; }
    .comparison-images h4 {
      font-size: 0.875rem;
      color: #86868b;
      margin-bottom: 8px;
    }
    .comparison-images img {
      max-width: 100%;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
    }
    .error { color: #dc2626; font-style: italic; }
    .no-figma { color: #6b7280; font-style: italic; }
  </style>
</head>
<body>
  <h1>Figma Design Comparison Report</h1>

  <div class="summary">
    <div class="summary-card">
      <h3>Total Components</h3>
      <div class="value">${results.length}</div>
    </div>
    <div class="summary-card">
      <h3>Passed</h3>
      <div class="value" style="color: #059669">${results.filter(r => r.passed).length}</div>
    </div>
    <div class="summary-card">
      <h3>Failed</h3>
      <div class="value" style="color: #dc2626">${results.filter(r => !r.passed).length}</div>
    </div>
  </div>

  ${results.map(r => `
    <section class="comparison">
      <div class="comparison-header">
        <span class="comparison-title">${getStatusEmoji(r)} ${r.description}</span>
        <span class="comparison-diff ${getDiffClass(r)}">${r.diffPercentage.toFixed(2)}% (threshold: ${r.threshold}%)</span>
      </div>
      ${r.error ? `<p class="error">${r.error}</p>` : ''}
      ${!r.figmaImage ? '<p class="no-figma">Figma image not available (FIGMA_ACCESS_TOKEN not set)</p>' : ''}
      <div class="comparison-images">
        <div>
          <h4>Figma</h4>
          ${r.figmaImage ? `<img src="data:image/png;base64,${r.figmaImage}" alt="Figma design" />` : '<p>N/A</p>'}
        </div>
        <div>
          <h4>Implementation</h4>
          ${r.storyImage ? `<img src="data:image/png;base64,${r.storyImage}" alt="Implementation" />` : '<p>N/A</p>'}
        </div>
        <div>
          <h4>Diff</h4>
          ${r.diffImage ? `<img src="data:image/png;base64,${r.diffImage}" alt="Diff" />` : '<p>N/A</p>'}
        </div>
      </div>
    </section>
  `).join('')}
</body>
</html>`;
}

async function main() {
  console.log('🎨 Figma Design Comparison Tool\n');

  // Load config
  const configPath = path.join(__dirname, 'figma-mapping.json');
  if (!fs.existsSync(configPath)) {
    console.error('❌ figma-mapping.json not found');
    process.exit(1);
  }

  const config: CompareConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  // Check for specific story filter
  const storyFilter = process.argv.find(arg => arg.startsWith('--story='))?.split('=')[1];

  const mappings = storyFilter
    ? config.mappings.filter(m => m.storyId === storyFilter)
    : config.mappings;

  if (mappings.length === 0) {
    console.log('No mappings to compare.');
    process.exit(0);
  }

  console.log(`📋 Comparing ${mappings.length} component(s)...\n`);

  // Ensure reports directory exists
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  // Batch fetch all Figma images first (single API call)
  console.log('  📥 Fetching Figma images...');
  const nodeIds = mappings.map(m => m.figmaNodeId);
  const figmaImages = await fetchAllFigmaImages(config.figmaFileId, nodeIds);
  console.log('  ✓ Figma images fetched\n');

  const results: CompareResult[] = [];

  for (const mapping of mappings) {
    console.log(`  🔍 ${mapping.description}...`);

    try {
      // Capture Storybook screenshot
      const storyImage = await captureStoryScreenshot(mapping.storyId, mapping.viewport);

      // Get pre-fetched Figma image
      const figmaImage = figmaImages.get(mapping.figmaNodeId) ?? null;

      const threshold = mapping.threshold ?? 15;

      if (figmaImage) {
        // Calculate diff
        const { percentage, diffBuffer } = calculateDiff(figmaImage, storyImage);
        const passed = percentage < threshold;

        results.push({
          figmaNodeId: mapping.figmaNodeId,
          storyId: mapping.storyId,
          description: mapping.description,
          diffPercentage: percentage,
          threshold,
          passed,
          figmaImage: figmaImage.toString('base64'),
          storyImage: storyImage.toString('base64'),
          diffImage: diffBuffer.toString('base64'),
        });

        const status = passed ? '✅' : percentage < 15 ? '⚠️' : '❌';
        console.log(`     ${status} ${percentage.toFixed(2)}% diff (threshold: ${threshold}%)`);
      } else {
        // No Figma image, just record the story screenshot
        results.push({
          figmaNodeId: mapping.figmaNodeId,
          storyId: mapping.storyId,
          description: mapping.description,
          diffPercentage: 0,
          threshold,
          passed: true,
          storyImage: storyImage.toString('base64'),
        });
        console.log('     ⚪ Figma image not available');
      }
    } catch (error) {
      console.error(`     ❌ Error: ${error}`);
      const threshold = mapping.threshold ?? 15;
      results.push({
        figmaNodeId: mapping.figmaNodeId,
        storyId: mapping.storyId,
        description: mapping.description,
        diffPercentage: 100,
        threshold,
        passed: false,
        error: String(error),
      });
    }
  }

  // Generate reports
  const htmlReport = generateHtmlReport(results);
  fs.writeFileSync(path.join(REPORTS_DIR, 'report.html'), htmlReport);
  fs.writeFileSync(path.join(REPORTS_DIR, 'results.json'), JSON.stringify(results, null, 2));

  console.log(`\n📊 Report generated: ${path.join(REPORTS_DIR, 'report.html')}`);

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log(`\n📈 Summary:`);
  console.log(`   ✅ Passed: ${passedCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);

  // Exit with error if any failed
  if (failedCount > 0) {
    console.log('\n❌ Some components exceed their diff threshold.');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.description}: ${r.diffPercentage.toFixed(2)}% (threshold: ${r.threshold}%)`);
    });
    process.exit(1);
  }
}

main().catch(console.error);
