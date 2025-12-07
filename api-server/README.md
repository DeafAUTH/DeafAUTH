# DeafAUTH API Server

Standalone Node TypeScript API server for DeafAUTH. Works **alongside** any existing authentication system to provide accessibility-first features for deaf users.

## 🎯 Key Features

- **Multi-tenant support**: Organizations, companies, startups (paid), individuals (free)
- **PASETO tokens**: Secure, HIPAA-compliant authentication (v4.public)
- **Signed consents**: Consent attestations become keys for PinkSync accessibility
- **Works with ANY auth**: Integrates with Auth0, Okta, Firebase, Cognito, Clerk, etc.
- **Domain-agnostic**: Can run as subdomain or standalone
- **Nginx auth_request**: Delegated authentication pattern
- **PostgreSQL backend**: Full database support with Knex migrations

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (for containerized deployment)
- OpenSSL (for generating PASETO keys)

## 🚀 Quick Start

### 1. Generate PASETO Keys

```bash
# Generate Ed25519 private key
openssl genpkey -algorithm Ed25519 -out keys/paseto_private.pem

# Extract public key
openssl pkey -in keys/paseto_private.pem -pubout -out keys/paseto_public.pem
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migrations

```bash
npm run migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This starts:
- PostgreSQL database
- DeafAUTH API server
- Nginx reverse proxy with auth_request

## 📡 API Endpoints

### Authentication

- **POST /auth/login** - Login with credentials or external provider
- **POST /auth/refresh** - Refresh access token using refresh cookie
- **GET /auth/validate** - Validate access token (for Nginx auth_request)
- **POST /auth/logout** - Logout and invalidate refresh token

### Users

- **GET /users/:id/prefs** - Get user accessibility preferences
- **PUT /users/:id/prefs** - Update accessibility preferences
- **GET /users/:id/profile** - Get user profile

### Consents (Signed Consent Keys)

- **POST /consents** - Create consent and get signed attestation
- **GET /consents/:id** - Get consent details
- **DELETE /consents/:id** - Revoke consent
- **GET /consents/user/:userId** - Get all user consents

### Tenants (Multi-tenant)

- **POST /tenants** - Create tenant (org/individual)
- **GET /tenants/:id** - Get tenant info
- **GET /tenants/:id/users** - List tenant users
- **POST /tenants/:id/users** - Add user to tenant

## 🔐 Authentication Flow

### 1. External Provider Integration

```typescript
// Login with external auth (e.g., Auth0)
POST /auth/login
{
  "external_provider": "auth0",
  "external_id": "auth0|123456",
  "email": "user@example.com",
  "tenant_id": "tenant_uuid"
}

// Response
{
  "access_token": "v4.public.eyJ...", // PASETO token
  "token_type": "paseto",
  "expires_in": 600
}
// + HttpOnly refresh cookie set
```

### 2. Using Access Token

```bash
curl -H "Authorization: Bearer v4.public.eyJ..." \
  http://localhost:3000/users/user123/prefs
```

### 3. Token Refresh

```bash
curl -X POST http://localhost:3000/auth/refresh \
  --cookie "deafauth_refresh=<refresh_token>"
```

## 🔑 Signed Consent as Key

DeafAUTH uses signed consents as keys for PinkSync accessibility communication:

```typescript
// Create consent
POST /consents
{
  "user_id": "user123",
  "partner_id": "company_xyz",
  "tenant_id": "tenant_abc",
  "scope": ["accessibility", "preferences"],
  "preferences": {
    "captions": true,
    "sign_language": "ASL",
    "visual_alerts": true
  }
}

// Response includes signed attestation
{
  "consent_id": "consent_uuid",
  "attestation": "v4.public.eyJjb25zZW50X2lkIjoi...", // Signed PASETO
  "status": "active",
  "message": "Consent recorded. Attestation can be used as key for PinkSync."
}
```

This signed attestation can be used by PinkSync to:
1. Verify user consent cryptographically
2. Access user preferences securely
3. Communicate with organizations on behalf of user

## 🏢 Multi-Tenant Support

### Tenant Types

- **Individual**: Free tier, 1 user
- **Startup**: Paid tier, up to 10 users
- **Company**: Paid tier, up to 100 users
- **Organization**: Enterprise tier, unlimited users

### Creating a Tenant

```typescript
// Individual (free)
POST /tenants
{
  "name": "John Doe",
  "type": "individual"
}

// Organization (paid)
POST /tenants
{
  "name": "Acme Corp",
  "type": "company",
  "plan": "business",
  "domain": "acme.com"
}
```

## 🌐 Multi-Domain Setup

DeafAUTH can work as a subdomain with any auth system:

```nginx
# Company domain: company.com (uses Auth0)
# DeafAUTH subdomain: auth.company.com

# Nginx configuration on company.com
location /api {
    # Delegate auth to DeafAUTH
    auth_request https://auth.company.com/_auth;
    
    # Your API
    proxy_pass http://your-api:8080;
}
```

## 🔒 Security Features

- **PASETO v4.public**: Public-key cryptography for tokens
- **HttpOnly cookies**: Refresh tokens protected from XSS
- **Token rotation**: Refresh tokens rotated on each use
- **Signed consents**: HIPAA-compliant consent management
- **Auth request pattern**: Nginx validates tokens before routing

## 📝 Database Schema

### Tables

- **users**: User accounts (local or external)
- **tenants**: Organizations/individuals
- **tenant_users**: User-tenant associations
- **refresh_tokens**: Refresh token storage
- **user_preferences**: Accessibility preferences
- **consents**: Signed consent records

### Migrations

```bash
# Run migrations
npm run migrate

# Create new migration
npm run migrate:make migration_name

# Rollback last migration
npm run migrate:rollback
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run migrations
npm run migrate

# Type check
npm run typecheck
```

## 🚢 Production Deployment

### 1. Set Environment Variables

```bash
export NODE_ENV=production
export DATABASE_URL=postgresql://user:pass@host:5432/db
export PASETO_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
export PASETO_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."
```

### 2. Run Migrations

```bash
npm run migrate
```

### 3. Start Server

```bash
npm start
```

### 4. Configure Nginx

Use the provided `nginx/conf.d/default.conf` configuration.

## 🔧 Integration Examples

### Auth0 Integration

```typescript
// After Auth0 login, call DeafAUTH
const auth0User = await auth0.getUser();

const response = await fetch('https://auth.yourcompany.com/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    external_provider: 'auth0',
    external_id: auth0User.sub,
    email: auth0User.email,
    tenant_id: 'your_tenant_id'
  })
});

const { access_token } = await response.json();
// Use access_token for DeafAUTH features
```

### PinkSync Integration

```typescript
// Use signed consent attestation to communicate with PinkSync
const attestation = consentResponse.attestation;

await fetch('https://pinksync.deafauth.io/orchestrate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Consent-Attestation': attestation // Signed consent as key
  },
  body: JSON.stringify({
    user_id: 'user123',
    target_service: 'example.com',
    preferences: userPreferences
  })
});
```

## 📖 API Documentation

Full API documentation available at: `http://localhost:3000/` when server is running.

## 🤝 Contributing

DeafAUTH is open for contributions. Please ensure all code follows TypeScript best practices and includes tests.

## 📄 License

See main repository for license information.

## 🆘 Support

- GitHub Issues: https://github.com/DeafAUTH/DeafAUTH/issues
- Documentation: https://github.com/DeafAUTH/DeafAUTH

---

**Note**: This API server is designed to work **alongside** your existing authentication system, not replace it. It adds an accessibility layer on top of any auth provider (Auth0, Okta, Firebase, etc.) to provide deaf-first features.
