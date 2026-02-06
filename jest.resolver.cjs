/**
 * Custom Jest Resolver for ESM .js -> .ts mapping
 *
 * Handles TypeScript's ESM import convention where .ts files
 * are imported with .js extensions. This resolver:
 * 1. Leaves node_modules imports unchanged
 * 2. Maps .js to .ts for our source files
 * 3. Maps .js to .d.ts for type-only files in types/ directory
 *
 * The key is to check if the import is FROM our source code (basedir)
 * or from node_modules.
 */

const path = require('path');
const fs = require('fs');

module.exports = function resolver(request, options) {
  const { basedir, defaultResolver } = options;

  // Skip if request is a node built-in
  if (request.startsWith('node:')) {
    return defaultResolver(request, options);
  }

  // Skip if importing FROM node_modules
  // basedir is the directory containing the file doing the import
  if (basedir && basedir.includes('node_modules')) {
    return defaultResolver(request, options);
  }

  // Only process .js extensions
  if (!request.endsWith('.js')) {
    return defaultResolver(request, options);
  }

  // Only process relative imports (starting with . or ..)
  if (!request.startsWith('.')) {
    return defaultResolver(request, options);
  }

  // Special handling for type-only imports in types/ directory
  // These are .d.ts files that may be imported from various depths
  if (request.match(/types\/(rmmz-runtime|pixi)\.js$/)) {
    const typeFile = request.match(/types\/(rmmz-runtime|pixi)\.js$/)[1];
    const absolutePath = path.resolve(__dirname, `packages/core/src/types/${typeFile}.d.ts`);

    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
  }

  // Try resolving with different extensions
  const extensions = ['.ts', '.d.ts', '.tsx'];

  for (const ext of extensions) {
    const modifiedRequest = request.replace(/\.js$/, ext);

    try {
      // Use defaultResolver to let Jest handle the resolution logic
      return defaultResolver(modifiedRequest, options);
    } catch (e) {
      // Continue to next extension
    }
  }

  // If all attempts failed, fall back to original request
  return defaultResolver(request, options);
};
