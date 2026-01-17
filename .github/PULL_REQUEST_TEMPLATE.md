## 概要

<!-- 変更内容の簡潔な説明 -->

## 関連Issue

<!-- closes #123 -->

---

## Design Verification（UI変更がある場合）

### Figma参照
- [ ] Figma URL: <!-- https://www.figma.com/file/... -->

### デザイン適合チェック
- [ ] カラーがデザイントークンと一致
- [ ] タイポグラフィがFigma仕様と一致
- [ ] スペーシング・レイアウトが一致
- [ ] レスポンシブ動作を確認（mobile/tablet/desktop）
- [ ] アクセシビリティ確認（キーボード操作、スクリーンリーダー）

### Storybook & VRT
- [ ] Storybook storyを作成/更新
- [ ] VRTベースラインを確認（`pnpm test:vrt`）
- [ ] 必要に応じてベースラインを更新（`pnpm test:vrt:update`）

### Figma比較（該当する場合）
- [ ] Figmaマッピングを更新（`scripts/design-compare/figma-mapping.json`）
- [ ] Figma比較を実行（`pnpm design:compare`）

---

## スクリーンショット（任意）

<!--
Desktop:
![desktop](url)

Mobile:
![mobile](url)
-->

---

## テスト

- [ ] ローカルでビルドが通る（`pnpm build`）
- [ ] Lintエラーなし（`pnpm lint`）
- [ ] VRTテストが通る（`pnpm test:vrt`）
