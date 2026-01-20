/* eslint-disable no-undef, no-unused-vars */
/**
 * afterSign Hook
 *
 * Executed after electron-builder signs the application.
 * This hook handles notarization for macOS distribution.
 *
 * NOTARIZATION (for production):
 * - Required for macOS 10.15+ when distributing outside App Store
 * - Requires Apple Developer account
 * - Requires app-specific password from appleid.apple.com
 *
 * Environment variables for CI/CD:
 * - APPLE_ID: Your Apple ID email
 * - APPLE_ID_PASSWORD: App-specific password from appleid.apple.com
 * - APPLE_TEAM_ID: Your Apple Developer Team ID
 *
 * @param {Object} context - Build context provided by electron-builder
 */

exports.default = async function (context) {
  const { electronPlatformName, appOutDir } = context;

  // Only process macOS builds
  if (electronPlatformName !== 'darwin') {
    return;
  }

  console.log('Running afterSign hook for macOS...');

  // Check if notarization credentials are available
  const hasAppleId = process.env.APPLE_ID && process.env.APPLE_ID_PASSWORD;
  const hasTeamId = process.env.APPLE_TEAM_ID;

  if (!hasAppleId) {
    console.log('⚠ Apple ID credentials not found - skipping notarization');
    console.log('For development builds, ad-hoc signing is sufficient');
    console.log('For distribution, set APPLE_ID and APPLE_ID_PASSWORD environment variables');
    return;
  }

  if (!hasTeamId) {
    console.log('⚠ Apple Team ID not found - skipping notarization');
    console.log('Set APPLE_TEAM_ID environment variable for production builds');
    return;
  }

  // Import notarize tool only if credentials are available
  const { notarize } = require('@electron/notarize');

  const appId = 'com.coreto.devportal';
  const appPath = `${appOutDir}/Coreto Dev Portal.app`;

  console.log(`Notarizing app: ${appPath}`);
  console.log(`Apple ID: ${process.env.APPLE_ID}`);
  console.log(`Team ID: ${process.env.APPLE_TEAM_ID}`);

  try {
    await notarize({
      tool: 'notarytool',
      appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });
    console.log('✓ Notarization successful');
  } catch (error) {
    console.error('✗ Notarization failed:', error);
    throw error;
  }
};

/**
 * NOTE: For production notarization, install the notarization package:
 *
 *   npx --yes pnpm@latest add -D @electron/notarize --filter @coreto/electron
 *
 * Development builds use ad-hoc signing and don't require notarization.
 */
