import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pagesの場合、リポジトリ名をbaseに設定
  // 例: https://username.github.io/pixel-cube-editor/
  // リポジトリ名が違う場合は変更してください
  base: '/pixel-cube-editor/',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // ソースマップを生成（デバッグ用）
    sourcemap: false,
    // チャンクサイズ警告の閾値
    chunkSizeWarningLimit: 1000
  }
});
