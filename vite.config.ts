import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the built app works when served from a GitHub Pages
// project subpath (e.g. https://user.github.io/repo-name/) without needing
// to hard-code the repository name here.
export default defineConfig({
  base: './',
  plugins: [react()],
});
