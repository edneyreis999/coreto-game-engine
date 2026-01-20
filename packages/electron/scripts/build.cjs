#!/usr/bin/env node
/* eslint-disable no-undef */

/**
 * Build Script for electron-builder
 *
 * This script properly invokes electron-builder for macOS packaging.
 * Run with: node scripts/build.cjs
 */

const { build } = require('electron-builder');
const path = require('path');
const fs = require('fs');

/**
 * Main build function
 */
async function main() {
  console.log('Starting electron-builder for macOS...');

  // Ensure core package is built
  const coreDistPath = path.join(__dirname, '../../core/dist');
  if (!fs.existsSync(coreDistPath)) {
    console.log('Core package not built, building it first...');
    const { execSync } = require('child_process');
    execSync('npx --yes pnpm@latest --filter @coreto/core build', {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit'
    });
  }

  // Copy core package dist files to electron out directory for packaging
  const localCoreDistPath = path.join(__dirname, '../out/core');
  if (!fs.existsSync(localCoreDistPath)) {
    console.log('Copying core package dist files for packaging...');
    fs.mkdirSync(localCoreDistPath, { recursive: true });
    const { execSync } = require('child_process');
    execSync(`cp -r ${coreDistPath}/* ${localCoreDistPath}/`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
  }

  // Inline configuration (same as electron-builder.config.js)
  const config = {
    $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
    appId: 'com.coreto.devportal',
    productName: 'Coreto Dev Portal',
    copyright: 'Copyright (c) 2025 Coreto Team',
    directories: {
      buildResources: 'assets',
      output: 'dist'
    },
    files: [
      'out/**/*',
      'package.json',
      '!**/.tsbuildinfo',
      '!**/*.d.ts.map',
      '!**/node_modules/@coreto/core/**'
    ],
    extraMetadata: {
      main: 'out/main/index.js'
    },
    asar: false,
    mac: {
      target: 'dmg',
      icon: 'assets/icon.icns',
      category: 'public.app-category.developer-tools',
      hardenedRuntime: true,
      gatekeeperAssess: false,
      entitlements: 'entitlements.mac.plist',
      entitlementsInherit: 'entitlements.mac.plist',
      provisioningProfile: null,
      artifactName: '${productName}-${version}-${arch}.${ext}',
      darkModeSupport: true
    },
    dmg: {
      contents: [
        { x: 130, y: 220 },
        { x: 410, y: 220, type: 'link', path: '/Applications' }
      ],
      window: { width: 540, height: 380 }
    },
    afterPack: './scripts/afterPack.cjs',
    afterSign: './scripts/afterSign.cjs',
    publish: null
  };

  try {
    await build({
      // Build targets
      mac: ['dmg'],
      x64: true,
      arm64: true,

      // Configuration (without spreading to avoid conflicts)
      config: config,
    });

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the build
main();
