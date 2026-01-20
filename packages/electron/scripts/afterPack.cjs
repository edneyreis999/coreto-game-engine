/* eslint-disable no-undef, no-unused-vars */
/**
 * afterPack Hook
 *
 * Executed after electron-builder packs the application.
 * This hook can be used for additional package processing.
 *
 * @param {Object} context - Build context provided by electron-builder
 * @param {string} context.electronPlatformName - Platform name (darwin, win32, linux)
 * @param {string} context.appOutDir - Output directory for the packaged app
 * @param {Object} context.arch - Architecture (x64, arm64)
 */

exports.default = async function (context) {
  const { electronPlatformName, appOutDir, arch } = context;

  // Only process macOS builds
  if (electronPlatformName !== 'darwin') {
    return;
  }

  console.log('Running afterPack hook for macOS...');

  // Verify @coreto/core package is included
  const fs = require('fs');
  const path = require('path');

  const corePackagePath = path.join(
    appOutDir,
    'Coreto Dev Portal.app',
    'Contents',
    'Resources',
    'app',
    'node_modules',
    '@coreto'
  );

  if (fs.existsSync(corePackagePath)) {
    console.log('✓ @coreto/core package found in packaged app');
  } else {
    console.warn('⚠ @coreto/core package not found in packaged app');
  }

  // Verify SQLite native module is packaged
  const sqlitePath = path.join(
    appOutDir,
    'Coreto Dev Portal.app',
    'Contents',
    'Resources',
    'app',
    'node_modules',
    'better-sqlite3'
  );

  if (fs.existsSync(sqlitePath)) {
    console.log('✓ better-sqlite3 native module found in packaged app');
  } else {
    console.warn('⚠ better-sqlite3 native module not found in packaged app');
  }

  console.log('afterPack hook completed');
};
