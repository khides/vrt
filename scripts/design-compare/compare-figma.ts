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
  figmaImage?: string;
  storyImage?: string;
  diffImage?: string;
  error?: string;
}

const REPORTS_DIR = path.join(process.cwd(), 'reports', 'figma-diff');
const STORYBOOK_URL = process.env.STORYBOOK_URL || 'http://localhost:6007';

async function fetchFigmaImage(fileId: string, nodeId: string): Promise<Buffer | null> {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    console.warn('⚠️  FIGMA_ACCESS_TOKEN not set. Skipping Figma image fetch.');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.figma.com/v1/images/${fileId}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`,
      { headers: { 'X-Figma-Token': token } }
    );

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const imageUrl = data.images?.[nodeId];

    if (!imageUrl) {
      throw new Error(`No image URL returned for node ${nodeId}`);
    }

    const imageResponse = await fetch(imageUrl);
    return Buffer.from(await imageResponse.arrayBuffer());
  } catch (error) {
    console.error(`Failed to fetch Figma image for ${nodeId}:`, error);
    return null;
  }
}

function calculateDiff(
  img1Buffer: Buffer,
  img2Buffer: Buffer
): { percentage: number; diffBuffer: Buffer } {
  const img1 = PNG.sync.read(img1Buffer);
  const img2 = PNG.sync.read(img2Buffer);

  // Resize images to match if needed
  const width = Math.min(img1.width, img2.width);
  const height = Math.min(img1.height, img2.height);

  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
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
  const getDiffClass = (percentage: number): string => {
    if (percentage >= 15) return 'diff-high';
    if (percentage >= 5) return 'diff-medium';
    return 'diff-low';
  };

  const getStatusEmoji = (percentage: number): string => {
    if (percentage >= 15) return '❌';
    if (percentage >= 5) return '⚠️';
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
      <h3>Passed (< 5%)</h3>
      <div class="value" style="color: #059669">${results.filter(r => r.diffPercentage < 5).length}</div>
    </div>
    <div class="summary-card">
      <h3>Warning (5-15%)</h3>
      <div class="value" style="color: #d97706">${results.filter(r => r.diffPercentage >= 5 && r.diffPercentage < 15).length}</div>
    </div>
    <div class="summary-card">
      <h3>Failed (≥ 15%)</h3>
      <div class="value" style="color: #dc2626">${results.filter(r => r.diffPercentage >= 15).length}</div>
    </div>
  </div>

  ${results.map(r => `
    <section class="comparison">
      <div class="comparison-header">
        <span class="comparison-title">${getStatusEmoji(r.diffPercentage)} ${r.description}</span>
        <span class="comparison-diff ${getDiffClass(r.diffPercentage)}">${r.diffPercentage.toFixed(2)}% diff</span>
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

  const results: CompareResult[] = [];

  for (const mapping of mappings) {
    console.log(`  🔍 ${mapping.description}...`);

    try {
      // Capture Storybook screenshot
      const storyImage = await captureStoryScreenshot(mapping.storyId, mapping.viewport);

      // Fetch Figma image
      const figmaImage = await fetchFigmaImage(config.figmaFileId, mapping.figmaNodeId);

      if (figmaImage) {
        // Calculate diff
        const { percentage, diffBuffer } = calculateDiff(figmaImage, storyImage);

        results.push({
          ...mapping,
          diffPercentage: percentage,
          figmaImage: figmaImage.toString('base64'),
          storyImage: storyImage.toString('base64'),
          diffImage: diffBuffer.toString('base64'),
        });

        const status = percentage < 5 ? '✅' : percentage < 15 ? '⚠️' : '❌';
        console.log(`     ${status} ${percentage.toFixed(2)}% diff`);
      } else {
        // No Figma image, just record the story screenshot
        results.push({
          ...mapping,
          diffPercentage: 0,
          storyImage: storyImage.toString('base64'),
        });
        console.log('     ⚪ Figma image not available');
      }
    } catch (error) {
      console.error(`     ❌ Error: ${error}`);
      results.push({
        ...mapping,
        diffPercentage: 100,
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
  const passed = results.filter(r => r.diffPercentage < 5).length;
  const warnings = results.filter(r => r.diffPercentage >= 5 && r.diffPercentage < 15).length;
  const failed = results.filter(r => r.diffPercentage >= 15).length;

  console.log(`\n📈 Summary:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ⚠️  Warnings: ${warnings}`);
  console.log(`   ❌ Failed: ${failed}`);

  // Exit with error if any failed
  if (failed > 0) {
    console.log('\n❌ Some components have significant visual differences from Figma.');
    process.exit(1);
  }
}

main().catch(console.error);
