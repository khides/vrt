# VRT (Visual Regression Testing) System

Figmaデザインと実装の乖離を検出・防止するためのVRTシステム。Apple.com風のReactコンポーネントをサンプルとして実装。

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| **フレームワーク** | React 19 + TypeScript |
| **ビルドツール** | Vite 5 |
| **スタイリング** | Tailwind CSS 4 |
| **アニメーション** | Framer Motion |
| **Storybook** | Storybook 8 |
| **VRT** | Playwright |
| **Figma比較** | Figma API + pixelmatch |

## セットアップ

```bash
# 依存関係インストール
pnpm install

# Playwrightブラウザインストール
pnpm exec playwright install chromium
```

## 開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# Storybook起動
pnpm storybook

# Storybookビルド
pnpm build-storybook
```

## VRTコマンド

```bash
# VRTテスト実行
pnpm test:vrt

# VRTベースライン更新（意図的な変更時）
pnpm test:vrt:update

# VRT UIモード
pnpm test:vrt:ui
```

## Figma比較

```bash
# Figma比較実行（Storybookサーバーが起動している必要あり）
pnpm design:compare
```

### 環境変数

| 変数名 | 説明 |
|--------|------|
| `FIGMA_ACCESS_TOKEN` | Figma Personal Access Token |
| `STORYBOOK_URL` | StorybookサーバーのURL（デフォルト: `http://localhost:6007`）|

### マッピング設定

`scripts/design-compare/figma-mapping.json` でFigmaフレームとStorybookストーリーの対応を設定:

```json
{
  "figmaFileId": "YOUR_FIGMA_FILE_ID",
  "mappings": [
    {
      "figmaNodeId": "123:456",
      "storyId": "layout-hero--snapshot-light",
      "viewport": { "width": 1440, "height": 900 },
      "description": "Hero Section Light Desktop"
    }
  ]
}
```

## ディレクトリ構成

```
vrt/
├── .github/
│   ├── workflows/           # CI/CDワークフロー
│   │   ├── ci.yml
│   │   ├── playwright-vrt.yml
│   │   ├── figma-compare.yml
│   │   └── design-review-reminder.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── .storybook/
├── src/
│   ├── components/
│   │   ├── ui/Button/
│   │   └── layout/
│   │       ├── Hero/
│   │       └── Navigation/
│   ├── hooks/
│   └── lib/
├── tests/vrt/
│   ├── playwright.config.ts
│   ├── visual.spec.ts
│   └── snapshots/
└── scripts/design-compare/
    ├── compare-figma.ts
    └── figma-mapping.json
```

## CI/CDパイプライン

PRでのワークフロー:

1. **CI**: Lint, Type Check, Storybook Build
2. **Playwright VRT**: ビジュアルリグレッションテスト
3. **Figma Compare**: Figmaとの自動比較
4. **Design Review Reminder**: デザイン確認リマインダー

### 必要なGitHub Secrets

| Secret名 | 説明 |
|----------|------|
| `FIGMA_ACCESS_TOKEN` | Figma Personal Access Token |

## コンポーネント

- **Button**: Apple風ボタン（primary/secondary/ghost/link）
- **Hero**: ヒーローセクション（アニメーション付き）
- **Navigation**: スクロール対応ナビゲーション

## 運用フロー

1. Issueテンプレート「デザイン実装」からIssue作成
2. FigmaのURLとNode IDを記載
3. 実装後、Storybookストーリーを作成
4. VRTベースラインを更新 (`pnpm test:vrt:update`)
5. PRを作成、CI/CDで自動検証
