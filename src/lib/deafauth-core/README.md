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
