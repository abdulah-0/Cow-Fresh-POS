# Testing

## Current State
- **Automated Tests**: No obvious test suite (Jest, Vitest, Playwright) is configured in `package.json`.
- **Manual Verification**: Features are currently verified manually in the browser.

## Recommendations
- **Unit Testing**: Implement Vitest for business logic (Zustand stores, utility functions).
- **E2E Testing**: Implement Playwright for critical POS flows (adding items to cart, completing a sale).
