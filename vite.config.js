import { defineConfig } from 'vite';
// import devtools from 'solid-devtools/vite';

export default defineConfig({
  plugins: [],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    lib: {
      entry: './src/Presto.js',
      name: 'Presto',
      formats: ['umd'],
      fileName: () => 'presto.js',
    },
  },
});
