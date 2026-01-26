# /e2e - Run End-to-End Tests

Run Playwright e2e tests for the Maximo XML Generator web application.

## Usage

```
/e2e [options]
```

## Options

- `--ui`: Open Playwright UI mode for interactive test running
- `--headed`: Run tests in headed browser mode (visible browser)
- `--debug`: Run in debug mode with Playwright Inspector
- `<test-file>`: Run specific test file (e.g., `xml-generator`)

## Examples

```bash
# Run all e2e tests
/e2e

# Run with UI mode
/e2e --ui

# Run in headed mode (see the browser)
/e2e --headed

# Run specific test file
/e2e xml-generator

# Debug a specific test
/e2e --debug xml-generator
```

## Implementation

When this skill is invoked, execute the following:

1. Change to the web directory: `cd web`
2. Run the appropriate Playwright command based on options:

```bash
# Default: run all tests
npm run e2e

# With --ui flag
npm run e2e:ui

# With --headed flag
npm run e2e:headed

# With specific test file
npx playwright test <test-file>

# With --debug flag
npx playwright test --debug <test-file>
```

## Test Files

E2E tests are located in `web/e2e/`:

- `xml-generator.spec.ts` - Tests for the XML Generator functionality
  - Page loading
  - Metadata form interaction
  - Field addition
  - XML generation
  - Project save/load

## Requirements

- Node.js 18+
- Playwright browsers installed (`npx playwright install chromium`)
- Dev server will start automatically if not running

## Troubleshooting

If tests fail to start:
1. Ensure dev server is not already running on port 3000
2. Run `npx playwright install` to install browsers
3. Check `playwright.config.ts` for configuration

## Output

- Test results displayed in terminal
- HTML report generated in `playwright-report/`
- Screenshots saved on failure in `test-results/`
