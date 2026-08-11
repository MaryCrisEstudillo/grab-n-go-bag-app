import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * GitHub Pages serves a project site from `/<repo>/`, not from the root, so
 * every asset URL has to carry that prefix or the deployed page loads nothing.
 *
 * It's an env var rather than a constant because the same build has to work in
 * three places: `/` locally, `/grab-n-go-bag-app/` on Pages, and `/` again if
 * this ever moves to a host that serves from the root.
 */
const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
  },
  test: {
    // Only pure functions are unit-tested, so no DOM environment is needed.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
