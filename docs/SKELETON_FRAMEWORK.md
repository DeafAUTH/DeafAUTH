# DeafAUTH Skeleton Framework Documentation

This document describes the complete DeafAUTH skeleton framework that enables deaf users to authenticate across any digital platform while maintaining their accessibility preferences through signed consents.

## 🎯 Architecture Overview

DeafAUTH consists of several integrated modules:

```
┌─────────────────────────────────────────────────────────────┐
│                     DeafAUTH Ecosystem                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  Basic Auth  │────────▶│  Multi-Tenant │                 │
│  │  (Entry)     │         │  Manager      │                 │
│  └──────────────┘         └──────────────┘                  │
│         │                         │                          │
│         ▼                         ▼                          │
│  ┌──────────────────────────────────────┐                   │
│  │      PASETO Token Management         │                   │
│  │    (HIPAA-Compliant Signed Keys)     │                   │
│  └──────────────────────────────────────┘                   │
│         │                                                    │
│         ├──────────┬──────────────┬──────────────┐          │
│         ▼          ▼              ▼              ▼          │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐     │
│  │ PinkSync │ │ PinkFlow │ │IoT Compiler│ │Auth Integ│     │
│  │Orchestr. │ │Validator │ │           │ │  Layer   │     │
│  └──────────┘ └──────────┘ └───────────┘ └──────────┘     │
│       │            │              │             │           │
│       └────────────┴──────────────┴─────────────┘           │
│                         │                                    │
│                         ▼                                    │
│              External Organizations                          │
│              (Companies, Platforms)                          │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Core Modules

### 1. Basic Auth (`src/lib/basic-auth/`)
**Purpose**: Entry point for deaf user authentication with multi-tenant support

**Features**:
- Multi-tenant authentication (organizations, companies, startups)
- Individual free-tier support
- IoT device authentication
- Integration with external auth providers

**Usage**:
```typescript
import { createBasicAuth } from '@/lib/basic-auth';

const auth = createBasicAuth({
  multiTenant: true,
  enableIoTAuth: true,
  pinkSyncEndpoint: 'https://pinksync.deafauth.io',
});

const result = await auth.authenticate({
  email: 'user@example.com',
  password: 'secure_password',
  tenantId: 'company_xyz',
});
```

### 2. Multi-Tenant Manager (`src/lib/multi-tenant/`)
**Purpose**: Manages organizations, companies, and individual users

**Key Concepts**:
- **Tenant Types**: organization, company, startup, individual
- **Plans**: free (individuals), starter, business, enterprise
- **Signed Consent Keys**: User consent becomes cryptographic key

**Usage**:
```typescript
import { createMultiTenantManager } from '@/lib/multi-tenant';

const manager = createMultiTenantManager();

// Create tenant
const tenant = await manager.createTenant('Acme Corp', 'company', 'business');

// Sign consent (becomes key for PinkSync)
const key = await manager.signConsent(userId, consent, tenantId);
```

### 3. Auth Integration Layer (`src/lib/auth-integration/`)
**Purpose**: Works alongside ANY existing authentication system

**Does NOT replace**: Auth0, Okta, Firebase, Cognito, Clerk, Supabase, etc.
**ADDS**: Accessibility layer on top of existing auth

**Code Compiler**: Generates integration code for any auth provider

**Usage**:
```typescript
import { createAuthIntegrationManager } from '@/lib/auth-integration';

const integration = createAuthIntegrationManager();

// Integrate with external auth
const result = await integration.integrateOnLogin({
  externalId: auth0User.sub,
  provider: 'auth0',
  email: auth0User.email,
});

// Generate integration code
const code = await integration.compileIntegrationCode('auth0', 'typescript');
console.log(code.code); // Ready-to-use TypeScript code
```

### 4. PinkSync Orchestrator (`src/lib/pinksync/`)
**Purpose**: Orchestrates accessibility between users and organizations

**Workflow**:
1. Deaf user tries to access a service
2. PinkSync checks if organization has accessibility features
3. If YES: Returns available features
4. If NO: Provides PinkFlow validation link

**Signed Consents**: Uses PASETO-signed consent as key for communication

**Usage**:
```typescript
import { createPinkSyncOrchestrator } from '@/lib/pinksync';

const pinkSync = createPinkSyncOrchestrator({
  hipaaCompliant: true,
  requireConsent: true,
});

const result = await pinkSync.orchestrate({
  userId: 'user123',
  targetOrg: organization,
  preferences: userPreferences,
});

if (!result.hasAccessibility) {
  // Send organization to PinkFlow for validation
  console.log('Validation link:', result.pinkFlowLink);
}
```

### 5. PinkFlow Validator (`src/lib/pinkflow/`)
**Purpose**: Validation and testing for organizations without accessibility

**Features**:
- Automated accessibility testing
- GitHub page generation with results
- Code examples and recommendations
- Button symbolism for visual accessibility

**Workflow**:
1. Organization receives PinkFlow link
2. PinkFlow runs accessibility tests
3. Generates GitHub page with:
   - Test results and score
   - Implementation recommendations
   - Code examples
   - Visual button symbolism

**Usage**:
```typescript
import { createPinkFlowValidator } from '@/lib/pinkflow';

const validator = createPinkFlowValidator();

// Start validation
const workflow = await validator.startValidation({
  orgId: 'company_xyz',
  orgName: 'Acme Corp',
  domain: 'acme.com',
  requestedBy: 'user123',
  requestedAt: new Date().toISOString(),
});

// Run tests
const results = await validator.runTests(workflow.workflowId, 'https://acme.com');

// Generate GitHub page
const githubUrl = await validator.generateGitHubPage(workflow);
```

### 6. IoT Compiler (`src/lib/iot-compiler/`)
**Purpose**: Enables deaf users to use DeafAUTH on IoT devices

**Features**:
- Device registration and management
- Cross-device login synchronization
- Visual/haptic/LED feedback based on device capabilities
- Same login experience across digital world

**Usage**:
```typescript
import { createIoTCompiler } from '@/lib/iot-compiler';

const compiler = createIoTCompiler();

// Compile IoT auth request
const response = await compiler.compileAuthRequest({
  device: {
    deviceId: 'smartwatch_001',
    deviceType: 'wearable',
    capabilities: ['haptic-feedback', 'vibration'],
  },
  credentials: userCredentials,
});

// Send to PinkSync
const communication = await compiler.compileToPinkSync(request);
```

## 🔐 PASETO Token System

DeafAUTH uses PASETO (Platform-Agnostic Security Tokens) for HIPAA-compliant authentication.

**Why PASETO over JWT**:
- More secure by design
- No algorithm confusion attacks
- Eliminates cryptographic pitfalls
- HIPAA-compliant when used correctly

**Token Types**:
- **Access tokens**: Short-lived (10 minutes), for API access
- **Refresh tokens**: Long-lived (30 days), stored server-side
- **Consent attestations**: Signed consents that become keys

## 🌐 Multi-Domain Support

DeafAUTH can work as a subdomain with any existing auth system:

```
Company Domain: example.com (uses Auth0)
DeafAUTH Subdomain: auth.example.com

Flow:
1. User logs in via Auth0 on example.com
2. After Auth0 success, call auth.example.com/auth/login
3. DeafAUTH creates accessibility profile
4. Signed consent key stored
5. User now has both Auth0 session AND DeafAUTH accessibility
```

## 🚀 API Server (Standalone)

The `api-server/` directory contains a complete standalone Node TypeScript API server.

**See**: `api-server/README.md` for full documentation

**Quick Start**:
```bash
cd api-server
npm install
npm run migrate
npm run dev
```

**Docker Deployment**:
```bash
cd api-server
docker-compose up -d --build
```

## 🔑 Signed Consent as Key

**Core Innovation**: Signed consent records become cryptographic keys

**Flow**:
1. User grants consent for accessibility sharing
2. DeafAUTH signs consent with PASETO
3. Signed attestation becomes "key" for PinkSync
4. PinkSync can verify consent cryptographically
5. Organizations can access user preferences via key

**HIPAA Compliance**:
- Explicit consent required
- Cryptographically signed and verifiable
- Revocable at any time
- Audit trail maintained

**Example**:
```typescript
// User grants consent
const consent = {
  user_id: 'user123',
  partner_id: 'healthcare_org',
  scope: ['medical_accessibility', 'captions'],
  preferences: {
    sign_language: 'ASL',
    captions: true,
    visual_alerts: true,
  },
};

// DeafAUTH signs consent
const attestation = await signConsent(consent);

// This attestation is the KEY
// PinkSync uses it to communicate with healthcare_org:
await pinkSync.orchestrate({
  attestationKey: attestation, // Cryptographic proof of consent
  targetOrg: 'healthcare_org',
});
```

## 📊 Tenant Plans and Features

| Tenant Type | Plan | Users | Price | Features |
|------------|------|-------|-------|----------|
| Individual | Free | 1 | Free | Basic Auth, PinkSync |
| Startup | Starter | 10 | $$ | + PinkFlow, Multi-user |
| Company | Business | 100 | $$$ | + IoT Compiler, API Access |
| Organization | Enterprise | Unlimited | $$$$ | + Custom Branding, Analytics |

## 🔧 Implementation Checklist

- [x] Basic Auth skeleton
- [x] Multi-tenant management
- [x] Auth integration layer (code compiler)
- [x] PinkSync orchestrator
- [x] PinkFlow validator
- [x] IoT compiler
- [x] PASETO token system
- [x] API server (Node TypeScript)
- [x] Database migrations
- [x] Docker Compose setup
- [x] Nginx auth_request pattern
- [x] Signed consent keys
- [ ] Full test coverage (next step)
- [ ] Production deployment scripts
- [ ] GitHub Actions CI/CD
- [ ] Complete integration examples

## 🧪 Testing

```bash
# Run existing tests
npm test

# TODO: Add tests for new modules
npm test src/lib/basic-auth
npm test src/lib/multi-tenant
npm test src/lib/pinksync
npm test src/lib/pinkflow
npm test src/lib/iot-compiler
npm test src/lib/auth-integration
```

## 📝 Next Steps

1. **Implement actual PASETO signing** in production (replace mock)
2. **Add database integration** for all modules
3. **Create integration tests** for full workflow
4. **Deploy API server** to production
5. **Generate PASETO keys** for production
6. **Set up GitHub Actions** for CI/CD
7. **Create client SDKs** (JavaScript, Python, Go)

## 🤝 Contributing

This is a skeleton framework. Implementation details marked with `// TODO` need to be completed based on production requirements.

## 📄 License

See main repository for license information.

---

**Remember**: DeafAUTH does NOT replace existing auth systems. It works ALONGSIDE them to provide accessibility features for deaf users.
