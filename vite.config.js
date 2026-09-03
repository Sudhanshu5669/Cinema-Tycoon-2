import { defineConfig } from 'vite';

export default defineConfig({
  // `public/` already holds the built sprite assets, which is Vite's default
  // static dir, so assets/player.png is served at /assets/player.png untouched.
  server: { host: true },
  build: { target: 'es2022' },
});
