# DeafAuth SDK

A script-first, modular SDK for building Deaf-first authentication experiences.

## 🚀 NEW: Universal Adapter Layer

DeafAUTH now includes a **framework-agnostic, plug-and-play** adapter layer that works with ANY auth provider, ANY database, and ANY framework. Deploy in under 5 minutes!

```typescript
import { DeafAUTH, Auth0Adapter, SupabaseAdapter } from '@/lib/deafauth-core';

// Plug in YOUR stack
const deafAuth = new DeafAUTH({
  authAdapter: new Auth0Adapter(AUTH0_DOMAIN, AUTH0_CLIENT_ID),
  dbAdapter: new SupabaseAdapter(supabase),
});

// Use immediately
const result = await deafAuth.authenticate({
  email: 'user@example.com',
  password: 'password123'
});
```

**Key Benefits:**
- ✅ Works with **ANY auth provider**: Auth0, Firebase, Clerk, NextAuth, custom
- ✅ Works with **ANY database**: Supabase, PostgreSQL, MongoDB, Firebase, MySQL
- ✅ Works with **ANY framework**: React, Vue, Svelte, vanilla JS, Node.js
- ✅ **No database? No problem**: Auto-falls back to localStorage
- ✅ **Switch providers anytime**: Change Auth0 → Firebase in 1 line

📖 **[View Universal Adapter Documentation](src/lib/deafauth-core/README.md)**

## Core Features

- **Visual-first Login**: Methods for authentication that prioritize visual confirmation.
- **Community Verification**: Logic for validating users through community trust.
- **Framework Agnostic**: Universal adapter layer for any auth/database combination.
- **Deaf-first Profiles**: Built-in support for sign language preferences, accessibility needs, and identity validation.

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
- `npm run build`: Build the production application.
- `npm run start`: Start the production server.
- `npm run lint`: Run ESLint to check code quality.
- `npm test`: Run the test suite.
- `npm run test:watch`: Run tests in watch mode.
- `npm run test:coverage`: Run tests with coverage report.

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

### Supabase Edge Functions

The project includes serverless Edge Functions for secure authentication verification:

- **deafauth-verify**: Verifies portable tokens and JWT authentication
- Automatic deployment via GitHub Actions
- Server-side security with service role keys

```bash
# Local development
supabase functions serve

# Deploy manually
supabase functions deploy deafauth-verify --project-ref <project-ref>
```

📖 **[View Edge Functions Documentation](supabase/functions/README.md)**

### Runtime Compatibility

DeafAUTH is designed to be runtime-agnostic and can be adapted to work with:

- **Deno Fresh**: Server-rendered Preact with islands architecture
- **Vite + React**: Fast build tool with full React compatibility
- **Node.js/Next.js**: Current default configuration

📖 **[View Runtime Compatibility Guide](docs/RUNTIME_COMPATIBILITY.md)**

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
