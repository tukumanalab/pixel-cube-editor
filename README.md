# Pixel Cube Editor

マインクラフト風のブロックデザイン用ドット絵エディター。6面すべてを16×16ピクセルで編集し、three.jsによるリアルタイム3Dプレビューで確認できます。

![Pixel Cube Editor](https://img.shields.io/badge/status-ready-brightgreen)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![Three.js](https://img.shields.io/badge/Three.js-3D-blue)

## 特徴

- **16×16ピクセルグリッド** - キューブの6面（上下前後左右）を個別に編集
- **リアルタイム3Dプレビュー** - three.jsで立方体をリアルタイムに表示
- **カラーパレット** - Minecraftカラーを含む24色のデフォルトパレット
- **元に戻す/やり直し** - 最大50ステップの編集履歴管理
- **面のコピー** - 一つの面のデザインを他の面にコピー
- **多様なエクスポート形式**
  - PNG画像（6面個別 or テクスチャアトラス）
  - PDFドキュメント（3Dプレビュー付き）
  - JSONデータ（インポート/エクスポート）

## 必要環境

- Node.js 16.x 以上
- npm または yarn

## インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# プロダクションビルド
npm run build

# プレビュー（ビルド後）
npm run preview
```

## GitHub Pagesへのデプロイ

### 自動デプロイ（推奨）

1. **GitHubリポジトリを作成**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/あなたのユーザー名/pixel-cube-editor.git
   git push -u origin main
   ```

2. **GitHub Pagesを有効化**
   - GitHubリポジトリの Settings > Pages へ移動
   - Source を "GitHub Actions" に設定
   - mainブランチにプッシュすると自動的にビルド＆デプロイされます

3. **リポジトリ名が違う場合**
   - `vite.config.js` の `base` をリポジトリ名に合わせて変更してください
   ```javascript
   base: '/あなたのリポジトリ名/',
   ```

4. **デプロイ完了**
   - `https://あなたのユーザー名.github.io/pixel-cube-editor/` でアクセス可能

### 手動デプロイ

```bash
# ビルド
npm run build

# gh-pages ブランチにデプロイ（gh-pagesパッケージを使う場合）
npm install -D gh-pages
npx gh-pages -d dist
```

## 使い方

### 基本操作

1. **色の選択**: カラーピッカーまたはパレットから色を選択
2. **描画**: 16×16グリッド上でクリック/ドラッグして描画
3. **面の切り替え**: Front/Back/Left/Right/Top/Bottomタブで編集する面を切り替え
4. **3Dプレビュー**: マウスドラッグで立方体を回転、スクロールでズーム

### キーボードショートカット

- `Ctrl+Z` / `Cmd+Z` - 元に戻す
- `Ctrl+Y` / `Cmd+Y` - やり直し
- `Ctrl+Shift+Z` / `Cmd+Shift+Z` - やり直し（代替）

### エクスポート

**エクスポート**ドロップダウンから形式を選択:

- **PNG画像 (全6面)** - 各面を個別のPNGファイルとしてエクスポート
- **PDFドキュメント** - 6面すべてを含むPDF（3Dプレビュー含めるか選択可能）
- **JSONデータ** - デザインデータをJSON形式で保存
- **テクスチャアトラス** - Minecraft形式の3×4テクスチャアトラス

### インポート

1. **JSONインポート**ボタンをクリック
2. 以前エクスポートしたJSONファイルを選択
3. デザインが復元されます

### 面のコピー

1. コピーしたい面に切り替え
2. **コピー**ボタンをクリック
3. ドロップダウンから貼り付け先の面を選択
4. **貼り付け**ボタンをクリック

## プロジェクト構造

```
pixel-cube-editor/
├── index.html              # メインHTML
├── package.json            # プロジェクト設定
├── css/
│   ├── main.css           # 全体レイアウト
│   ├── editor.css         # エディタースタイル
│   └── controls.css       # コントロールスタイル
├── js/
│   ├── main.js            # アプリエントリーポイント
│   ├── state/
│   │   ├── EditorState.js # 状態管理
│   │   └── History.js     # Undo/Redo
│   ├── editor/
│   │   ├── PixelGrid.js   # ピクセルグリッド
│   │   └── ColorPicker.js # カラーピッカー
│   ├── preview/
│   │   └── ThreePreview.js # three.js 3Dプレビュー
│   ├── export/
│   │   ├── ImageExporter.js # PNG エクスポート
│   │   ├── PDFExporter.js   # PDF エクスポート
│   │   └── DataExporter.js  # JSON インポート/エクスポート
│   └── utils/
│       ├── EventBus.js    # イベントバス
│       └── helpers.js     # ユーティリティ
└── assets/
```

## 技術スタック

- **Vanilla JavaScript (ES6+)** - フレームワークなし、純粋なJavaScript
- **Vite** - 高速な開発サーバーとビルドツール
- **Three.js** - 3Dレンダリング
- **jsPDF** - PDFエクスポート
- **HTML5 Canvas** - 2Dピクセルグリッド描画

## ブラウザ対応

- Chrome/Edge (最新版)
- Firefox (最新版)
- Safari (最新版)

## 開発

### デバッグ

開発サーバー起動後、ブラウザの開発者ツール (F12) でコンソールを確認できます。

### カスタマイズ

- **グリッドサイズ**: `js/editor/PixelGrid.js`の`cellSize`を変更
- **デフォルトパレット**: `js/editor/ColorPicker.js`の`palette`配列を編集
- **履歴上限**: `js/state/History.js`の`maxStates`を変更

## ライセンス

ISC

## 作者

Pixel Cube Editor - マインクラフトスタイルのブロックデザインツール

## 貢献

プルリクエストやイシューの報告を歓迎します。

## 今後の拡張予定

- [ ] バケツ塗りつぶしツール
- [ ] スポイトツール（色抽出）
- [ ] 対称モード（ミラー描画）
- [ ] レイヤーサポート
- [ ] アニメーションプレビュー
- [ ] 複数プロジェクト管理
- [ ] URL共有機能

---

**Enjoy creating your custom Minecraft blocks!** 🎮✨
