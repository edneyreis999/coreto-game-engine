# Suggested Commands for Development

## Important Note

**PROJECT IS PRE-IMPLEMENTATION**
No package.json or build scripts exist yet. Commands below are PLANNED for MVP v1.

## System Information

- **Platform**: Darwin (macOS)
- **Node.js Version**: To be determined
- **Package Manager**: npm (expected)

## Planned CLI Commands (When Implemented)

### Main Commands

```bash
# Run TTK validation for all trechos
node cli.js run-ttk --config project.config.json

# Run TTK with custom seed
node cli.js run-ttk --config project.config.json --seed 42

# Run TTK for specific trecho
node cli.js run-ttk --config project.config.json --trecho ato1-nivel1-10

# Run in verbose mode
node cli.js run-ttk --config project.config.json --verbose

# Run in diagnostic mode (debug headless initialization)
node cli.js run-ttk --config project.config.json --diagnostic

# Export context for AI
node cli.js export-context --config project.config.json

# Export filtered by trechos
node cli.js export-context --config project.config.json --filter-trechos
```

## Future Development Commands (To Be Configured)

### Package Management

```bash
# Install dependencies
npm install

# Add new dependency
npm install <package-name>

# Add dev dependency
npm install --save-dev <package-name>

# Update dependencies
npm update
```

### Build & Compilation

```bash
# Compile TypeScript
npm run build

# Watch mode for development
npm run dev

# Clean build artifacts
npm run clean
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- <test-file-path>

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

### Git Workflow

```bash
# Check status
git status

# Add changes
git add .

# Commit (use conventional commits)
git commit -m "feat: add headless runtime initialization"

# Push
git push origin main

# Pull latest
git pull origin main
```

## macOS-Specific Commands

### File System

```bash
# List files (macOS)
ls -la

# Find files
find . -name "*.ts" -type f

# Search content (use ripgrep if available, otherwise grep)
grep -r "pattern" src/

# Change directory
cd <path>
```

### Process Management

```bash
# View running processes
ps aux | grep node

# Kill process
kill <pid>
```

## Future Scripts (Expected in package.json)

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist/"
  }
}
```

## Development Workflow (Planned)

1. **Start Development**: `npm install` → `npm run dev`
2. **Make Changes**: Edit TypeScript files in `src/`
3. **Run Tests**: `npm test` or `npm run test:watch`
4. **Check Quality**: `npm run lint` and `npm run type-check`
5. **Build**: `npm run build`
6. **Run CLI**: `node dist/cli.js run-ttk --config <path>`

## References

- ADR-007: Oclif CLI Framework
- ADR-028: TypeScript as Implementation Language
- HLD Section 6: Interface Públicas (CLI commands specification)
