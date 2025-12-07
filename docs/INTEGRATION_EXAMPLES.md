# DeafAUTH Integration Examples

This document shows how to integrate DeafAUTH with popular authentication providers.

## Core Principle

**DeafAUTH does NOT replace your existing authentication.**

It works **alongside** your existing auth to provide accessibility features:

```
Your Auth (Auth0, Okta, etc.) → Authenticates user
          ↓
DeafAUTH → Adds accessibility layer
          ↓
User has BOTH sessions: Your auth + Accessibility features
```

## Integration Pattern

```typescript
// 1. User logs in via your existing auth
const yourAuthUser = await yourAuth.login(credentials);

// 2. Register/sync user with DeafAUTH
const deafAuthResult = await fetch('https://auth.yourcompany.com/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    external_provider: 'your_provider_name',
    external_id: yourAuthUser.id,
    email: yourAuthUser.email,
    tenant_id: 'your_tenant_id', // Your organization ID
  }),
  credentials: 'include', // Important for refresh cookie
});

const { access_token } = await deafAuthResult.json();

// 3. User now has both auth sessions
// - Your auth session for your app
// - DeafAUTH token for accessibility features
```

## Provider Examples

### Auth0

```typescript
import { Auth0Client } from '@auth0/auth0-spa-js';

// Initialize Auth0
const auth0 = new Auth0Client({
  domain: 'your-domain.auth0.com',
  clientId: 'your-client-id',
  authorizationParams: {
    redirect_uri: window.location.origin
  }
});

// Login flow
async function login() {
  // 1. Auth0 login
  await auth0.loginWithRedirect();
}

async function handleCallback() {
  // 2. Handle Auth0 callback
  await auth0.handleRedirectCallback();
  const auth0User = await auth0.getUser();

  // 3. Register with DeafAUTH
  const response = await fetch('https://auth.yourcompany.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      external_provider: 'auth0',
      external_id: auth0User.sub,
      email: auth0User.email,
      tenant_id: process.env.DEAFAUTH_TENANT_ID,
    }),
    credentials: 'include',
  });

  const deafAuth = await response.json();

  // 4. Store DeafAUTH token for API calls
  localStorage.setItem('deafauth_token', deafAuth.access_token);

  // User now has Auth0 session + DeafAUTH accessibility
  return { auth0User, deafAuth };
}

// Use DeafAUTH features
async function getUserPreferences(userId) {
  const token = localStorage.getItem('deafauth_token');
  
  const response = await fetch(`https://auth.yourcompany.com/users/${userId}/prefs`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
}
```

### Okta

```typescript
import { OktaAuth } from '@okta/okta-auth-js';

const oktaAuth = new OktaAuth({
  issuer: 'https://your-domain.okta.com/oauth2/default',
  clientId: 'your-client-id',
  redirectUri: window.location.origin + '/callback',
});

async function login() {
  // 1. Okta login
  await oktaAuth.signInWithRedirect();
}

async function handleCallback() {
  // 2. Handle callback
  await oktaAuth.handleLoginRedirect();
  const user = await oktaAuth.getUser();

  // 3. Integrate with DeafAUTH
  const response = await fetch('https://auth.yourcompany.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      external_provider: 'okta',
      external_id: user.sub,
      email: user.email,
      tenant_id: process.env.DEAFAUTH_TENANT_ID,
    }),
    credentials: 'include',
  });

  const deafAuth = await response.json();
  localStorage.setItem('deafauth_token', deafAuth.access_token);

  return { oktaUser: user, deafAuth };
}
```

### Firebase Authentication

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const app = initializeApp({
  apiKey: 'your-api-key',
  authDomain: 'your-domain.firebaseapp.com',
  // ... other config
});

const firebaseAuth = getAuth(app);

async function login(email, password) {
  // 1. Firebase login
  const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  const firebaseUser = userCredential.user;

  // 2. Register with DeafAUTH
  const response = await fetch('https://auth.yourcompany.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      external_provider: 'firebase',
      external_id: firebaseUser.uid,
      email: firebaseUser.email,
      tenant_id: process.env.DEAFAUTH_TENANT_ID,
    }),
    credentials: 'include',
  });

  const deafAuth = await response.json();
  localStorage.setItem('deafauth_token', deafAuth.access_token);

  return { firebaseUser, deafAuth };
}
```

### AWS Cognito

```typescript
import { CognitoUserPool, AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';

const userPool = new CognitoUserPool({
  UserPoolId: 'your-user-pool-id',
  ClientId: 'your-client-id',
});

async function login(username, password) {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    // 1. Cognito login
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: async (result) => {
        const idToken = result.getIdToken();
        const payload = idToken.payload;

        // 2. Register with DeafAUTH
        const response = await fetch('https://auth.yourcompany.com/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            external_provider: 'cognito',
            external_id: payload.sub,
            email: payload.email,
            tenant_id: process.env.DEAFAUTH_TENANT_ID,
          }),
          credentials: 'include',
        });

        const deafAuth = await response.json();
        localStorage.setItem('deafauth_token', deafAuth.access_token);

        resolve({ cognitoUser, deafAuth });
      },
      onFailure: reject,
    });
  });
}
```

### Clerk

```typescript
import { ClerkProvider, SignIn, SignedIn, SignedOut, useUser } from '@clerk/clerk-react';

function App() {
  return (
    <ClerkProvider publishableKey={process.env.CLERK_PUBLISHABLE_KEY}>
      <SignedOut>
        <SignIn afterSignInUrl="/dashboard" />
      </SignedOut>
      <SignedIn>
        <Dashboard />
      </SignedIn>
    </ClerkProvider>
  );
}

function Dashboard() {
  const { user } = useUser();
  const [deafAuthToken, setDeafAuthToken] = useState(null);

  useEffect(() => {
    if (user) {
      // Integrate with DeafAUTH after Clerk login
      fetch('https://auth.yourcompany.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          external_provider: 'clerk',
          external_id: user.id,
          email: user.primaryEmailAddress.emailAddress,
          tenant_id: process.env.DEAFAUTH_TENANT_ID,
        }),
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          setDeafAuthToken(data.access_token);
          localStorage.setItem('deafauth_token', data.access_token);
        });
    }
  }, [user]);

  return (
    <div>
      <h1>Welcome {user.firstName}</h1>
      {deafAuthToken && <AccessibilityFeatures token={deafAuthToken} />}
    </div>
  );
}
```

### Supabase Auth

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

async function login(email, password) {
  // 1. Supabase login
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const supabaseUser = data.user;

  // 2. Register with DeafAUTH
  const response = await fetch('https://auth.yourcompany.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      external_provider: 'supabase',
      external_id: supabaseUser.id,
      email: supabaseUser.email,
      tenant_id: process.env.DEAFAUTH_TENANT_ID,
    }),
    credentials: 'include',
  });

  const deafAuth = await response.json();
  localStorage.setItem('deafauth_token', deafAuth.access_token);

  return { supabaseUser, deafAuth };
}
```

## Backend Integration (Node.js)

### Express Middleware

```typescript
import express from 'express';
import fetch from 'node-fetch';

const app = express();

// Middleware to verify DeafAUTH token
async function verifyDeafAuthToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);

  try {
    // Verify token with DeafAUTH
    const response = await fetch('https://auth.yourcompany.com/auth/validate', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const payload = await response.json();
    req.deafAuthUser = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token verification failed' });
  }
}

// Protected route with accessibility features
app.get('/api/accessibility-data', verifyDeafAuthToken, async (req, res) => {
  const userId = req.deafAuthUser.sub;
  
  // Get user preferences from DeafAUTH
  const response = await fetch(`https://auth.yourcompany.com/users/${userId}/prefs`, {
    headers: {
      'Authorization': req.headers.authorization
    }
  });

  const prefs = await response.json();
  
  res.json({
    user: req.deafAuthUser,
    preferences: prefs,
  });
});
```

## Using Signed Consents for PinkSync

```typescript
// After user grants consent
async function grantAccessibilityConsent(userId, organization) {
  const token = localStorage.getItem('deafauth_token');

  // Create signed consent
  const response = await fetch('https://auth.yourcompany.com/consents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      user_id: userId,
      partner_id: organization.id,
      scope: ['accessibility', 'preferences'],
      preferences: {
        captions: true,
        sign_language: 'ASL',
        visual_alerts: true,
      }
    })
  });

  const { attestation } = await response.json();

  // This attestation is the KEY for PinkSync
  // Use it to communicate with organizations
  await fetch('https://pinksync.deafauth.io/orchestrate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Consent-Attestation': attestation // Signed consent as key
    },
    body: JSON.stringify({
      user_id: userId,
      target_org: organization.id,
    })
  });

  return attestation;
}
```

## Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (HttpOnly cookies for refresh, memory/localStorage for access)
3. **Handle token refresh** before access token expires
4. **Verify tokens server-side** for sensitive operations
5. **Use signed consents** for HIPAA compliance
6. **Log out from both** your auth and DeafAUTH

## Complete Example: React App with Auth0 + DeafAUTH

```typescript
import React, { useEffect, useState } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';

function App() {
  return (
    <Auth0Provider
      domain="your-domain.auth0.com"
      clientId="your-client-id"
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
      <Dashboard />
    </Auth0Provider>
  );
}

function Dashboard() {
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const [deafAuth, setDeafAuth] = useState(null);
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Register with DeafAUTH after Auth0 login
      registerWithDeafAUTH(user);
    }
  }, [isAuthenticated, user]);

  async function registerWithDeafAUTH(auth0User) {
    const response = await fetch('https://auth.yourcompany.com/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        external_provider: 'auth0',
        external_id: auth0User.sub,
        email: auth0User.email,
      }),
      credentials: 'include',
    });

    const data = await response.json();
    setDeafAuth(data);

    // Get accessibility preferences
    const prefsResponse = await fetch(
      `https://auth.yourcompany.com/users/${auth0User.sub}/prefs`,
      {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      }
    );
    
    const prefs = await prefsResponse.json();
    setPreferences(prefs);
  }

  if (!isAuthenticated) {
    return <button onClick={loginWithRedirect}>Login</button>;
  }

  return (
    <div>
      <h1>Welcome {user.name}</h1>
      <button onClick={() => logout({ returnTo: window.location.origin })}>
        Logout
      </button>

      {deafAuth && (
        <div>
          <h2>Accessibility Features Enabled ✓</h2>
          {preferences && (
            <div>
              <h3>Your Preferences:</h3>
              <pre>{JSON.stringify(preferences, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
```

## Support

For integration help:
- GitHub Issues: https://github.com/DeafAUTH/DeafAUTH/issues
- Documentation: https://github.com/DeafAUTH/DeafAUTH

---

**Remember**: DeafAUTH complements your existing auth, adding accessibility features for deaf users without replacing your authentication system.
