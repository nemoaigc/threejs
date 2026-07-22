import { defineConfig } from 'vite';

// base './' so the build works when opened from any path (like abeto's static deploy)
export default defineConfig({
  base: './',
  server: { host: true },
  assetsInclude: ['**/*.glb'],
});
