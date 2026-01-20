#!/bin/bash

# Icon Generation Script for Coreto Dev Portal
#
# This script generates a macOS .icns icon file from a PNG source.
# For development, we use a placeholder icon.
#
# To create a custom icon:
# 1. Create a 1024x1024 PNG icon
# 2. Place it in assets/icon.png
# 3. Run this script to generate the .icns file

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS_DIR="$(dirname "$SCRIPT_DIR")/assets"
ICON_PNG="$ASSETS_DIR/icon.png"
ICON_ICNS="$ASSETS_DIR/icon.icns"
ICONSET="$ASSETS_DIR/icon.iconset"

echo "Generating macOS icon..."

# Check if source icon exists
if [ ! -f "$ICON_PNG" ]; then
  echo "⚠ Source icon not found: $ICON_PNG"
  echo "Creating placeholder icon..."

  # Create assets directory if it doesn't exist
  mkdir -p "$ASSETS_DIR"

  # Create a simple placeholder using ImageMagick if available
  if command -v convert &> /dev/null; then
    convert -size 1024x1024 xc:'#3B82F6' \
      -gravity center \
      -pointsize 400 \
      -fill white \
      -annotate 0 'C' \
      "$ICON_PNG"
    echo "✓ Placeholder icon created: $ICON_PNG"
  else
    echo "✗ ImageMagick not found. Please install: brew install imagemagick"
    echo "Or manually place icon.png in $ASSETS_DIR"
    exit 1
  fi
fi

# Create iconset directory
mkdir -p "$ICONSET"

# Generate required icon sizes
echo "Generating icon sizes..."
for size in 16 32 64 128 256 512 1024; do
  # Generate @1x and @2x variants
  sips -z $size $size "$ICON_PNG" --out "$ICONSET/icon_${size}x${size}.png" > /dev/null 2>&1
  sips -z $((size * 2)) $((size * 2)) "$ICON_PNG" --out "$ICONSET/icon_${size}x${size}@2x.png" > /dev/null 2>&1
done

# Convert iconset to icns
echo "Converting to .icns format..."
iconutil -c icns "$ICONSET" -o "$ICON_ICNS"

# Cleanup iconset
rm -rf "$ICONSET"

echo "✓ Icon generated: $ICON_ICNS"
echo "Done!"
