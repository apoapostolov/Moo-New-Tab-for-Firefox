/**
 * Vite Configuration for Moo (Firefox build)
 *
 * Moo is a Firefox-focused fork of Mue. The build produces a single
 * Firefox (Manifest V3) extension package under build/firefox.
 *
 * Build Process:
 * 1. Vite bundles the React app into /dist
 * 2. Assets are copied to dist/src/assets for proper path resolution
 * 3. A Firefox build is created in /build/firefox
 * 4. A distribution .zip file is generated for Firefox
 *
 * Build Commands:
 * - `bun run build` - Production build for Firefox
 * - `bun run dev` - Development server with HMR
 */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import fs from 'fs';
import ADMZip from 'adm-zip';
import * as pkg from './package.json';
import progress from 'vite-plugin-progress';

const isProd = process.env.NODE_ENV === 'production';

const prepareBuilds = () => ({
  name: 'prepareBuilds',
  buildStart() {
    this.mooBuildFailed = false;
  },
  buildEnd(error) {
    this.mooBuildFailed = Boolean(error);
  },
  closeBundle() {
    if (isProd && !this.mooBuildFailed) {
      console.log('📦 Building Firefox extension package...');

      // Ensure base directories exist
      fs.mkdirSync(path.resolve(__dirname, './build'), { recursive: true });
      fs.mkdirSync(path.resolve(__dirname, './dist'), { recursive: true });

      // Copy assets to dist for proper bundling
      const distAssetsPath = path.resolve(__dirname, './dist/src/assets');
      fs.mkdirSync(distAssetsPath, { recursive: true });
      fs.cpSync(path.resolve(__dirname, './src/assets'), distAssetsPath, { recursive: true });

      // Firefox Build
      console.log('🦊 Building Firefox extension...');
      const firefoxBuildPath = path.resolve(__dirname, './build/firefox');
      // Wipe the previous build so stale hashed bundles don't ship in the package.
      // Only the contents are removed; the directory itself can be held open by
      // another process, which makes rmdir fail with EBUSY on Windows.
      fs.mkdirSync(firefoxBuildPath, { recursive: true });
      for (const entry of fs.readdirSync(firefoxBuildPath)) {
        fs.rmSync(path.join(firefoxBuildPath, entry), { recursive: true, force: true });
      }

      // Copy manifest and background script
      fs.copyFileSync(
        path.resolve(__dirname, './manifest/firefox.json'),
        path.resolve(firefoxBuildPath, 'manifest.json'),
      );
      fs.copyFileSync(
        path.resolve(__dirname, './manifest/background.js'),
        path.resolve(firefoxBuildPath, 'background.js'),
      );
      fs.copyFileSync(
        path.resolve(__dirname, './manifest/calendar-alerts.js'),
        path.resolve(firefoxBuildPath, 'calendar-alerts.js'),
      );

      // Copy dist (bundled app)
      fs.cpSync(path.resolve(__dirname, './dist'), firefoxBuildPath, { recursive: true });

      // Copy extension icons (separate from bundled assets)
      fs.cpSync(
        path.resolve(__dirname, './src/assets/icons'),
        path.resolve(firefoxBuildPath, 'icons'),
        { recursive: true },
      );

      // Copy locales
      fs.cpSync(
        path.resolve(__dirname, './manifest/_locales'),
        path.resolve(firefoxBuildPath, '_locales'),
        { recursive: true },
      );

      // Copy LICENSE (BSD-3-Clause) for binary distribution compliance
      fs.copyFileSync(
        path.resolve(__dirname, './LICENSE'),
        path.resolve(firefoxBuildPath, 'LICENSE'),
      );

      // Create distribution zip
      console.log('📦 Creating distribution package...');
      const firefoxZip = new ADMZip();
      firefoxZip.addLocalFolder(firefoxBuildPath);
      firefoxZip.writeZip(path.resolve(__dirname, `./build/firefox-${pkg.version}.zip`));
      console.log(`✅ Firefox: firefox-${pkg.version}.zip`);

      console.log('✨ Build complete!');
    }
  },
});

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: { __APP_ENV__: JSON.stringify(env.APP_ENV) },
    plugins: [react(), prepareBuilds(), progress()],
    server: { open: true, hmr: { protocol: 'ws', host: 'localhost' } },
    build: {
      target: 'esnext', // Use modern JavaScript features
      minify: isProd ? 'esbuild' : false,
      sourcemap: !isProd,
      rollupOptions: {
        output: {
          manualChunks: undefined, // Let Vite handle chunking automatically to avoid circular dependency issues
        },
      },
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, './src'),
        i18n: path.resolve(__dirname, './src/i18n'),
        components: path.resolve(__dirname, './src/components'),
        contexts: path.resolve(__dirname, './src/contexts'),
        assets: path.resolve(__dirname, './src/assets'),
        config: path.resolve(__dirname, './src/config'),
        features: path.resolve(__dirname, './src/features'),
        lib: path.resolve(__dirname, './src/lib'),
        scss: path.resolve(__dirname, './src/scss'),
        translations: path.resolve(__dirname, './src/i18n/locales'),
        utils: path.resolve(__dirname, './src/utils'),
      },
    },
    css: { preprocessorOptions: { scss: { api: 'modern-compiler' } } },
  };
});
