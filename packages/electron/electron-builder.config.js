/**
 * electron-builder Configuration
 *
 * Packaging configuration for Coreto Dev Portal macOS application.
 * Produces a signed DMG installer with proper code signing for distribution.
 *
 * @see https://www.electron.build/configuration/configuration
 */

export default {
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
  asarUnpack: [
    'node_modules/better-sqlite3/**'
  ],
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
    window: { width: 540, height: 380 },
    background: null,
    format: 'UDZO',
    backgroundColor: '#ffffff'
  },
  afterPack: './scripts/afterPack.cjs',
  afterSign: './scripts/afterSign.cjs',
  publish: null
};
