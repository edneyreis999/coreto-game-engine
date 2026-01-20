# macOS Packaging with electron-builder

This directory contains the configuration and scripts for packaging the Coreto Dev Portal as a distributable macOS DMG installer.

## Quick Start

### Development Build (Ad-hoc Signing)

```bash
# Build and package for macOS (no certificate required)
npx --yes pnpm@latest run dist:mac --filter @coreto/electron
```

The DMG file will be created in `dist/Coreto-Dev-Portal-0.1.0-*.dmg`.

### Production Build (Code Signing & Notarization)

Production builds require an Apple Developer certificate and notarization for distribution outside the App Store.

#### 1. Get Apple Developer Certificate

- Join the [Apple Developer Program](https://developer.apple.com/programs/)
- Create a "Developer ID Application" certificate in Xcode:
  - Xcode → Preferences → Accounts → Your Apple ID → Manage Certificates
  - Click "+" → "Developer ID Application"

#### 2. Generate App-Specific Password

- Visit [appleid.apple.com](https://appleid.apple.com)
- Sign in with your Apple ID
- Go to "Security" → "App-Specific Passwords"
- Generate a password for electron-builder

#### 3. Set Environment Variables

```bash
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="your-app-specific-password"
export APPLE_TEAM_ID="your-team-id"  # Found in Apple Developer account
```

For CI/CD, add these as secrets in your CI configuration.

#### 4. Build and Package

```bash
npx --yes pnpm@latest run dist:mac --filter @coreto/electron
```

## Configuration Files

- `electron-builder.config.json` - Main packaging configuration
- `entitlements.mac.plist` - macOS sandboxing entitlements
- `scripts/afterPack.js` - Post-packaging verification
- `scripts/afterSign.js` - Notarization hook
- `scripts/generate-icon.sh` - Icon generation utility

## Application Icon

The application icon is defined in `assets/icon.icns`.

### Create Custom Icon

1. Design a 1024x1024 PNG icon
2. Save as `assets/icon.png`
3. Run the icon generation script:

```bash
./scripts/generate-icon.sh
```

Or use an online converter like [cloudconvert.com](https://cloudconvert.com/png-to-icns).

### Icon Requirements

- Format: `.icns`
- Sizes: 16x16 to 1024x1024 (multiple resolutions)
- Recommended: 1024x1024 source PNG

## Code Signing

### Development Builds

Development builds use **ad-hoc signing** (no certificate required). The app will run on your Mac but may show security warnings on other systems.

### Production Builds

Production builds use your **Developer ID Application** certificate:

- Hardened runtime enabled
- Entitlements applied for file access
- Notarization via Apple's notarytool service

### Verify Code Signing

```bash
# Verify signature
codesign -vvv dist/Coreto\ Dev\ Portal.app

# Check entitlements
codesign -d --entitlements - dist/Coreto\ Dev\ Portal.app
```

## Notarization

Notarization is required for macOS 10.15+ when distributing outside the App Store.

The `afterSign.js` script automatically notarizes your app when the following environment variables are set:

- `APPLE_ID` - Your Apple ID email
- `APPLE_ID_PASSWORD` - App-specific password
- `APPLE_TEAM_ID` - Your Apple Developer Team ID

### Manual Notarization

If automatic notarization fails, you can notarize manually:

```bash
# Upload to Apple for notarization
xcrun notarytool submit dist/Coreto-Dev-Portal-0.1.0.dmg \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_ID_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  --wait

# Staple the ticket to the DMG
xcrun stapler staple dist/Coreto-Dev-Portal-0.1.0.dmg
```

## Build Scripts

- `npm run dev` - Development mode with hot reload
- `npm run build` - Build for production
- `npm run pack:mac` - Package for macOS
- `npm run dist:mac` - Build and package for macOS (recommended)

## Troubleshooting

### "App is damaged" Error

This means the app isn't code signed or notarized. For production:

1. Ensure you have a valid Developer ID certificate
2. Set environment variables for notarization
3. Rebuild the app

### SQLite Module Not Found

The `better-sqlite3` native module must be rebuilt for the target platform:

```bash
# Rebuild native modules for Electron
npx --yes pnpm@latest electron-rebuild --filter @coreto/electron
```

### Missing @coreto/core Package

Ensure the core package is built before packaging:

```bash
npx --yes pnpm@latest --filter @coreto/core build
npx --yes pnpm@latest run dist:mac --filter @coreto/electron
```

### Icon Not Showing

- Ensure `assets/icon.icns` exists
- Check the icon path in `electron-builder.config.json`
- Rebuild the app after updating the icon

## File Structure

```
packages/electron/
├── electron-builder.config.json  # Packaging configuration
├── entitlements.mac.plist         # macOS entitlements
├── assets/
│   └── icon.icns                  # Application icon
├── scripts/
│   ├── afterPack.js              # Post-packaging hook
│   ├── afterSign.js              # Notarization hook
│   └── generate-icon.sh          # Icon generation
└── dist/
    ├── Coreto Dev Portal.app     # Packaged application
    └── Coreto-Dev-Portal-*.dmg   # DMG installer
```

## References

- [electron-builder Documentation](https://www.electron.build/)
- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Apple Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
