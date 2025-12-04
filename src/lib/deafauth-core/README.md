# DeafAUTH Universal Adapter

DeafAUTH is a **framework-agnostic, plug-and-play authentication layer** designed specifically for Deaf-first applications. It works with ANY auth provider, ANY database, and ANY framework—deploy in under 5 minutes.

## Features

✅ **Works with ANY auth provider:** Auth0, Firebase, Clerk, NextAuth, custom  
✅ **Works with ANY database:** Supabase, PostgreSQL, MongoDB, Firebase, MySQL  
✅ **Works with ANY framework:** React, Vue, Svelte, vanilla JS, Node.js  
✅ **No database? No problem:** Auto-falls back to localStorage, works offline-first  
✅ **Switch providers anytime:** Change Auth0 → Firebase in 1 line  

## Quick Start

### Installation

```bash
npm install  # In the DeafAUTH project
```

### Basic Usage

```typescript
import { DeafAUTH } from '@/lib/deafauth-core';

// Create instance with your adapters
const deafAuth = new DeafAUTH({
  authAdapter: yourAuthAdapter,  // Optional: Auth0, Firebase, Clerk, custom
  dbAdapter: yourDbAdapter,      // Optional: Supabase, MongoDB, Postgres, Firebase
});

// Authenticate user - automatically creates/retrieves Deaf profile
const result = await deafAuth.authenticate({
  email: 'user@example.com',
  password: 'password123'
});

if (result.success) {
  console.log('User:', result.user);
  console.log('Deaf Profile:', result.deafProfile);
}
```

### No Database? No Problem!

```typescript
// Works with just localStorage - perfect for prototyping or offline-first apps
const deafAuth = new DeafAUTH({
  authAdapter: yourAuthAdapter,
  // No dbAdapter = automatically uses localStorage
});
```

## Pre-built Adapters

### Auth Adapters

#### Auth0

```typescript
import { DeafAUTH, Auth0Adapter } from '@/lib/deafauth-core';

const deafAuth = new DeafAUTH({
  authAdapter: new Auth0Adapter('your-domain.auth0.com', 'your-client-id'),
});
```

#### Firebase

```typescript
import { getAuth } from 'firebase/auth';
import { DeafAUTH, FirebaseAuthAdapter } from '@/lib/deafauth-core';

const auth = getAuth(app);
const deafAuth = new DeafAUTH({
  authAdapter: new FirebaseAuthAdapter(auth),
});
```

#### Clerk

```typescript
import { useClerk } from '@clerk/nextjs';
import { DeafAUTH, ClerkAdapter } from '@/lib/deafauth-core';

const clerk = useClerk();
const deafAuth = new DeafAUTH({
  authAdapter: new ClerkAdapter(clerk),
});
```

#### NextAuth

```typescript
import { signIn, signOut, getSession } from 'next-auth/react';
import { DeafAUTH, NextAuthAdapter } from '@/lib/deafauth-core';

const deafAuth = new DeafAUTH({
  authAdapter: new NextAuthAdapter({ signIn, signOut, getSession }),
});
```

#### Custom Auth

```typescript
import { DeafAUTH, createAuthAdapter } from '@/lib/deafauth-core';

const deafAuth = new DeafAUTH({
  authAdapter: createAuthAdapter({
    login: async (credentials) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      return { success: true, user: data.user, token: data.token };
    },
    logout: async () => {
      await fetch('/api/logout', { method: 'POST' });
    },
  }),
});
```

### Database Adapters

#### Supabase

```typescript
import { createClient } from '@supabase/supabase-js';
import { DeafAUTH, SupabaseAdapter } from '@/lib/deafauth-core';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const deafAuth = new DeafAUTH({
  dbAdapter: new SupabaseAdapter(supabase),
});
```

#### MongoDB

```typescript
import { MongoClient } from 'mongodb';
import { DeafAUTH, MongoAdapter } from '@/lib/deafauth-core';

const client = new MongoClient(MONGODB_URI);
const db = client.db('deafauth');
const deafAuth = new DeafAUTH({
  dbAdapter: new MongoAdapter(db),
});
```

#### Firebase Firestore

```typescript
import { getFirestore } from 'firebase/firestore';
import { DeafAUTH, FirebaseAdapter } from '@/lib/deafauth-core';

const db = getFirestore(app);
const deafAuth = new DeafAUTH({
  dbAdapter: new FirebaseAdapter(db),
});
```

#### PostgreSQL

```typescript
import { Pool } from 'pg';
import { DeafAUTH, PostgresAdapter } from '@/lib/deafauth-core';

const pool = new Pool({ connectionString: DATABASE_URL });
const deafAuth = new DeafAUTH({
  dbAdapter: new PostgresAdapter(pool),
});
```

#### Custom Database

```typescript
import { DeafAUTH, createDatabaseAdapter } from '@/lib/deafauth-core';

const deafAuth = new DeafAUTH({
  dbAdapter: createDatabaseAdapter({
    findOne: async (table, query) => { /* your logic */ },
    insert: async (table, record) => { /* your logic */ },
    update: async (table, query, updates) => { /* your logic */ },
  }),
});
```

## Core API

### authenticate(credentials)

Authenticate a user and automatically create/retrieve their Deaf profile.

```typescript
const result = await deafAuth.authenticate({
  email: 'user@example.com',
  password: 'password123',
});

// Result includes:
// - success: boolean
// - user: { id, email, name }
// - token: string (if provided by auth adapter)
// - deafProfile: { userId, deafStatus, preferredLanguage, ... }
```

### validateIdentity(userId, validation)

Validate a user's Deaf identity through community verification.

```typescript
const validation = await deafAuth.validateIdentity('user-123', {
  status: 'deaf',           // 'deaf', 'hard-of-hearing', 'coda', 'hearing', 'unspecified'
  type: 'community-vouching', // proof type
  validatorId: 'validator-456',
  notes: 'Verified by community member',
});
```

### updateAccessibility(userId, preferences)

Update a user's accessibility preferences.

```typescript
await deafAuth.updateAccessibility('user-123', {
  language: 'BSL',           // Preferred sign language
  communication: 'sign-language',  // Communication preference
  needs: ['captions', 'visual-alerts'],  // Accessibility needs
});
```

### getProfile(userId)

Get a user's Deaf profile.

```typescript
const profile = await deafAuth.getProfile('user-123');
```

### updateProfile(userId, updates)

Update a user's profile.

```typescript
await deafAuth.updateProfile('user-123', {
  name: 'New Name',
  deafStatus: 'deaf',
});
```

## Configuration Options

```typescript
const deafAuth = new DeafAUTH({
  // Adapters
  authAdapter: yourAuthAdapter,
  dbAdapter: yourDbAdapter,
  storageAdapter: customStorageAdapter,  // Custom localStorage implementation
  
  // Deaf-first settings
  requireValidation: false,   // Require identity validation for access
  autoCreateProfile: true,    // Auto-create profile on first login
  
  // Feature flags
  enablePinkSync: true,       // Enable PinkSync integration
  enableFibonrose: true,      // Enable Fibonrose event logging
  
  // External endpoints
  pinkSyncEndpoint: 'https://api.pinksync.com/sync',
  fibonroseEndpoint: 'https://api.fibonrose.com/log',
});
```

## Deaf Profile Structure

```typescript
interface DeafProfile {
  userId: string;
  email?: string;
  name?: string;
  
  // Deaf-first attributes
  deafStatus: 'deaf' | 'hard-of-hearing' | 'coda' | 'hearing' | 'unspecified';
  preferredLanguage: 'ASL' | 'BSL' | 'LSF' | 'DGS' | 'JSL' | 'ISL' | string;
  communicationPreference: 'visual' | 'written' | 'sign-language' | 'lip-reading' | 'mixed';
  accessibilityNeeds: string[];
  
  // MBTQ Universe flags
  validated: boolean;
  pinkSyncEnabled: boolean;
  reputation: number;
  daoMember: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt?: string;
  lastLogin: string;
}
```

## Switching Providers

One of DeafAUTH's core features is the ability to switch providers without changing your application code.

### Change Auth Provider

```typescript
// Before: Auth0
const deafAuth = new DeafAUTH({
  authAdapter: new Auth0Adapter(AUTH0_DOMAIN, AUTH0_CLIENT_ID),
  dbAdapter: yourDbAdapter,
});

// After: Firebase (just swap the adapter!)
const deafAuth = new DeafAUTH({
  authAdapter: new FirebaseAuthAdapter(firebaseAuth),
  dbAdapter: yourDbAdapter,  // Same database, no changes needed
});
```

### Change Database Provider

```typescript
// Before: Supabase
const deafAuth = new DeafAUTH({
  authAdapter: yourAuthAdapter,
  dbAdapter: new SupabaseAdapter(supabase),
});

// After: MongoDB (just swap the adapter!)
const deafAuth = new DeafAUTH({
  authAdapter: yourAuthAdapter,  // Same auth, no changes needed
  dbAdapter: new MongoAdapter(mongoDb),
});
```

## Database Schema

When using a database adapter, DeafAUTH expects these tables/collections:

### deaf_profiles

| Column | Type | Description |
|--------|------|-------------|
| userId | string | Primary key |
| email | string | User email |
| name | string | User name |
| deafStatus | string | Deaf status |
| preferredLanguage | string | Preferred sign language |
| communicationPreference | string | Communication preference |
| accessibilityNeeds | array | List of accessibility needs |
| validated | boolean | Identity validated |
| pinkSyncEnabled | boolean | PinkSync enabled |
| reputation | number | Reputation score |
| daoMember | boolean | DAO membership |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update time |
| lastLogin | timestamp | Last login time |

### deaf_validations

| Column | Type | Description |
|--------|------|-------------|
| userId | string | User ID |
| deafStatus | string | Validated status |
| proofType | string | Type of proof |
| validatedBy | string | Validator ID |
| validatedAt | timestamp | Validation time |
| notes | string | Validation notes |

## Testing

```bash
npm test
```

## License

MIT

## Security Module

DeafAUTH includes a comprehensive security module for third-party access control, API key management, OAuth2 scopes, and rate limiting.

### Token Management (PASETO / JWT)

DeafAUTH uses **PASETO (Platform-Agnostic Security Tokens)** as the default token format, with JWT available as an optional alternative. PASETO provides secure-by-default tokens without the cryptographic pitfalls of JWT.

```typescript
import { TokenManager, createPasetoTokenManager, createJwtTokenManager } from '@/lib/deafauth-core/security';

// PASETO tokens (default - recommended)
const pasetoManager = new TokenManager({
  secretKey: process.env.DEAFAUTH_SECRET_KEY,
  issuer: 'deafauth.io',
});

// Generate PASETO access token
const { token, expiresAt } = await pasetoManager.generateAccessToken({
  sub: 'user_123',
  scopes: ['profile:read', 'preferences:read'],
});
// Token format: v4.local.xxxxx...

// Validate token
const result = await pasetoManager.validateToken(token);
if (result.valid) {
  console.log('User ID:', result.payload.sub);
  console.log('Scopes:', result.payload.scopes);
}

// JWT tokens (optional alternative)
const jwtManager = new TokenManager({
  format: 'jwt',
  secretKey: process.env.DEAFAUTH_SECRET_KEY,
});

const { token: jwtToken } = await jwtManager.generateAccessToken({
  sub: 'user_123',
  scopes: ['profile:read'],
});
// Token format: eyJhbGc...
```

**Why PASETO over JWT?**
- **Secure by default**: No algorithm confusion attacks
- **Versioned protocol**: Each version is a complete specification
- **Authenticated encryption**: v4.local uses AES-256-GCM
- **No footguns**: Removes dangerous JWT features

### API Key Management

```typescript
import { ApiKeyManager } from '@/lib/deafauth-core/security';

const apiKeyManager = new ApiKeyManager(dbAdapter, {
  apiKeyPrefix: 'dak_',
  apiKeyLength: 32,
});

// Create a new API key
const { key, apiKey } = await apiKeyManager.createApiKey({
  name: 'My App API Key',
  clientId: 'client_123',
  scopes: ['profile:read', 'preferences:read'],
  expiresIn: 86400, // 24 hours
});

// Validate an API key
const result = await apiKeyManager.validateApiKey(key);
if (result.valid) {
  console.log('Valid key with scopes:', result.key.scopes);
}

// Check if key has required scopes
if (apiKeyManager.hasScopes(apiKey, ['profile:read'])) {
  // Allow access
}
```

### Third-Party Access Control

Access control uses PASETO tokens by default. You can configure JWT as an alternative.

```typescript
import { AccessControlManager } from '@/lib/deafauth-core/security';

// Default: PASETO tokens
const accessControl = new AccessControlManager(dbAdapter);

// Or use JWT tokens
const accessControlJwt = new AccessControlManager(dbAdapter, {
  tokenFormat: 'jwt',
  tokenSecretKey: process.env.DEAFAUTH_SECRET_KEY,
});

// Register a third-party app
const app = await accessControl.registerApp({
  name: 'My Third-Party App',
  ownerId: 'user_123',
  redirectUris: ['https://myapp.com/callback'],
  allowedScopes: ['profile:read', 'preferences:read'],
});

// Process OAuth2 authorization
const authResponse = await accessControl.authorize({
  clientId: app.clientId,
  redirectUri: 'https://myapp.com/callback',
  scopes: ['profile:read'],
  state: 'random_state',
  responseType: 'code',
}, userId);

// Exchange authorization code for PASETO tokens
const tokens = await accessControl.exchangeCode(
  authCode,
  app.clientId,
  app.clientSecret
);

// Validate access token (PASETO or JWT)
const validation = await accessControl.validateAccessToken(accessToken);
```

### OAuth2 Scopes

```typescript
import { ScopeManager, DEFAULT_SCOPES } from '@/lib/deafauth-core/security';

const scopeManager = new ScopeManager();

// Validate requested scopes
const validation = scopeManager.validateScopes(['profile:read', 'identity:read']);
console.log('Valid:', validation.valid);
console.log('Sensitive scopes:', validation.sensitiveScopes);

// Check permissions
if (scopeManager.hasPermission(['profile:read'], 'profile', 'read')) {
  // Allow access
}

// Filter to allowed scopes
const allowed = scopeManager.filterAllowedScopes(
  ['profile:read', 'admin:write'],
  ['profile:*', 'preferences:*']
);
```

**Available Scopes:**

| Scope | Description | Category | Sensitivity |
|-------|-------------|----------|-------------|
| `profile:read` | Read basic profile information | profile | protected |
| `profile:write` | Update profile information | profile | protected |
| `identity:read` | Read Deaf identity status | identity | sensitive |
| `identity:verify` | Check if user is verified | identity | protected |
| `preferences:read` | Read accessibility preferences | preferences | protected |
| `preferences:write` | Update accessibility preferences | preferences | protected |
| `validation:read` | Read validation history | validation | sensitive |
| `validation:submit` | Submit community validations | validation | restricted |
| `openid` | OpenID Connect identity token | readonly | public |
| `email` | Email address access | profile | protected |
| `admin:read` | Administrative read access | admin | restricted |
| `admin:write` | Full administrative access | admin | restricted |

### Rate Limiting

```typescript
import { RateLimiter, RATE_LIMIT_PRESETS } from '@/lib/deafauth-core/security';

// Create rate limiter with custom config
const rateLimiter = new RateLimiter({
  windowMs: 60000,    // 1 minute
  maxRequests: 100,   // 100 requests per minute
});

// Or use a preset
const strictLimiter = new RateLimiter(RATE_LIMIT_PRESETS.strict);  // 10/min
const standardLimiter = new RateLimiter(RATE_LIMIT_PRESETS.standard);  // 100/min

// Check if request is allowed
const result = await rateLimiter.check('user_123');
if (!result.allowed) {
  console.log('Rate limit exceeded, retry after:', result.info.retryAfter);
}

// Get rate limit info
const info = rateLimiter.getInfo('user_123');
console.log(`${info.remaining}/${info.limit} requests remaining`);
```

**Rate Limit Presets:**

| Preset | Limit | Use Case |
|--------|-------|----------|
| `strict` | 10/min | Login, sensitive endpoints |
| `standard` | 100/min | General API endpoints |
| `relaxed` | 1000/min | High-traffic public endpoints |
| `burst` | 20/sec | Endpoints needing burst capacity |
| `daily` | 10000/day | Quota-based access |

## Integration Snippets

DeafAUTH provides ready-to-use code snippets for common integration scenarios:

```typescript
import { snippets } from '@/lib/deafauth-core';

// Access React integration examples
console.log(snippets.USE_DEAF_AUTH_HOOK);
console.log(snippets.ACCESSIBILITY_PREFERENCES_FORM);
console.log(snippets.PROTECTED_ROUTE_COMPONENT);

// Access Next.js integration examples
console.log(snippets.NEXTJS_API_ROUTE);
console.log(snippets.NEXTJS_MIDDLEWARE);
console.log(snippets.NEXTJS_SERVER_ACTIONS);

// Access Express.js integration examples
console.log(snippets.EXPRESS_ROUTER);
console.log(snippets.EXPRESS_SECURITY_MIDDLEWARE);

// Access API usage examples
console.log(snippets.API_CLIENT);
console.log(snippets.OAUTH2_FLOWS);
console.log(snippets.WEBHOOK_INTEGRATION);
```

These snippets provide complete, production-ready code for:
- React hooks and components
- Next.js API routes and middleware
- Express.js routers and middleware
- OAuth2 client implementation
- Webhook handling
