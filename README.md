# DeafAuth SDK

A script-first, modular SDK for building Deaf-first authentication experiences.

## Core Features

- **Visual-first Login**: Methods for authentication that prioritize visual confirmation.
- **Community Verification**: Logic for validating users through community trust.
- **Firebase Integration**: A lightweight adapter for Firebase Authentication.

## Installation

```bash
npm install
```

## Environment Setup

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in the `.env` file:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Scripts

- `npm run dev`: Start the development server.
- `npm run build`: Build the production application (outputs static files to `out/` folder).
- `npm run start`: Start the production server.
- `npm run lint`: Run ESLint to check code quality.
- `npm test`: Run the test suite.
- `npm run test:watch`: Run tests in watch mode.
- `npm run test:coverage`: Run tests with coverage report.

## Deployment

### GitHub Pages

The project is configured for automatic deployment to GitHub Pages.

1. **Set up repository secrets** (Settings → Secrets and variables → Actions):
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

2. **Enable GitHub Pages** (Settings → Pages):
   - Source: GitHub Actions

3. **Push to main branch** - The deployment workflow will automatically:
   - Build the static site
   - Deploy to GitHub Pages

Your site will be available at: `https://deafauth.github.io/deafauth/`

### Manual Build

To build the static site locally:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_url NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key npm run build
```

The output will be in the `out/` folder.

## Development

### Running Tests

The project uses Jest and React Testing Library for testing. To run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Continuous Integration

The project includes automated CI/CD pipelines that run on every push and pull request:

- **Lint Check**: Ensures code quality with ESLint
- **Tests**: Runs all unit tests
- **Build**: Validates the application builds successfully
- **Type Check**: Validates TypeScript types
- **Docker Build**: Tests Docker container build

All checks must pass before merging code.

📖 **[View Complete DevOps Documentation](docs/DEVOPS.md)**

## Example Usage

```typescript
import { initDeafAuth, loginWithVisual, verifyCommunity } from '@mbtq/deafauth-sdk';

// Initialize with your Firebase config
initDeafAuth({
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  // ...
});

async function authenticate() {
  const user = await loginWithVisual(); // Placeholder for visual auth flow
  if (user) {
    const isVerified = await verifyCommunity(user.uid); // Placeholder for community check
    if (isVerified) {
      console.log("Access granted 🎉");
    }
  }
}
```
