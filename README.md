# DeafAuth SDK

A script-first, modular SDK for building Deaf-first authentication experiences.

## Core Features

- **Visual-first Login**: Methods for authentication that prioritize visual confirmation.
- **Community Verification**: Logic for validating users through community trust.
- **Firebase Integration**: A lightweight adapter for Firebase Authentication.

## Installation

```bash
npm install @mbtq/deafauth-sdk
```

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

## Scripts

- `npm run build`: Compile TypeScript to JavaScript.
- `npm run dev`: Watch for changes and recompile.
- `npm run test`: Run tests.
- `npm run deploy`: Publish the package to npm.
