import { defineConfig } from 'vite';

export default defineConfig({
    base: '/tjts/', // GitHub Pages project page base path
    build: {
        outDir: 'docs', // GitHub Pages supports '/' or '/docs' as source, NOT '/dist'
        assetsDir: 'assets',
    },
});
