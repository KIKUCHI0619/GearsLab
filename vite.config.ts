
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pagesのリポジトリ名配下での実行に対応するため相対パスを設定
  base: './',
  define: {
    // ビルド時に環境変数からAPIキーを注入します
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true
  },
  server: {
    historyApiFallback: true
  }
});
