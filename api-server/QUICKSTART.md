# DeafAUTH API Server - Quick Start Guide

This guide will help you get the DeafAUTH API server running in minutes.

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- OpenSSL

## Option 1: Docker Compose (Fastest)

### 1. Generate PASETO Keys

```bash
cd api-server
mkdir -p keys

# Generate Ed25519 keys for PASETO v4.public
openssl genpkey -algorithm Ed25519 -out keys/paseto_private.pem
openssl pkey -in keys/paseto_private.pem -pubout -out keys/paseto_public.pem

# Secure the keys
chmod 600 keys/paseto_private.pem
chmod 644 keys/paseto_public.pem
```

### 2. Create Admin Password for Nginx

```bash
# Install htpasswd if needed: sudo apt-get install apache2-utils
htpasswd -c nginx/.htpasswd admin
# Enter a secure password when prompted
```

### 3. Start Services

```bash
docker-compose up -d --build
```

This starts:
- PostgreSQL database on port 5432
- DeafAUTH API on port 3000 (internal)
- Nginx reverse proxy on port 80

### 4. Verify Deployment

```bash
# Check services are running
docker-compose ps

# Check health
curl http://localhost/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-12-07T...",
  "service": "deafauth-api",
  "version": "0.1.0"
}
```

### 5. Test Authentication

```bash
# Login (demo credentials)
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo"}' \
  --cookie-jar cookies.txt

# Response includes access token
{
  "access_token": "v4.public.eyJ...",
  "token_type": "paseto",
  "expires_in": 600
}

# Use access token
curl -H "Authorization: Bearer <access_token>" \
  http://localhost/users/user:demo/prefs
```

### 6. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f nginx
docker-compose logs -f db
```

### 7. Stop Services

```bash
docker-compose down

# To also remove volumes (database data)
docker-compose down -v
```

## Option 2: Local Development

### 1. Generate Keys

```bash
cd api-server
mkdir -p keys
openssl genpkey -algorithm Ed25519 -out keys/paseto_private.pem
openssl pkey -in keys/paseto_private.pem -pubout -out keys/paseto_public.pem
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://deafuser:changeme@localhost:5432/deafauth
PASETO_ISSUER=deafauth.local
```

### 3. Start PostgreSQL

```bash
# Using Docker
docker run -d \
  --name deafauth-postgres \
  -e POSTGRES_DB=deafauth \
  -e POSTGRES_USER=deafuser \
  -e POSTGRES_PASSWORD=changeme \
  -p 5432:5432 \
  postgres:15-alpine
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Migrations

```bash
npm run migrate
```

### 6. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Testing the API

### 1. Get API Information

```bash
curl http://localhost:3000/
```

### 2. Login with External Provider

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "external_provider": "auth0",
    "external_id": "auth0|123456",
    "email": "user@example.com",
    "tenant_id": null
  }'
```

### 3. Create Tenant

```bash
TOKEN="<your_access_token>"

curl -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Organization",
    "type": "company",
    "plan": "business",
    "domain": "example.com"
  }'
```

### 4. Create Signed Consent (Key for PinkSync)

```bash
curl -X POST http://localhost:3000/consents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "user123",
    "partner_id": "organization_xyz",
    "scope": ["accessibility", "preferences"],
    "preferences": {
      "captions": true,
      "sign_language": "ASL",
      "visual_alerts": true
    }
  }'
```

Response includes signed attestation:
```json
{
  "consent_id": "uuid",
  "attestation": "v4.public.eyJjb25zZW50X2lkIjoi...",
  "status": "active",
  "message": "Consent recorded. Attestation can be used as key for PinkSync."
}
```

## Integration with Existing Auth

### Auth0 Example

```typescript
// After Auth0 login
import { Auth0Client } from '@auth0/auth0-spa-js';

const auth0 = new Auth0Client({
  domain: 'your-domain.auth0.com',
  clientId: 'your-client-id'
});

// Get Auth0 user
const user = await auth0.getUser();

// Integrate with DeafAUTH
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    external_provider: 'auth0',
    external_id: user.sub,
    email: user.email,
  }),
  credentials: 'include' // Include cookies
});

const { access_token } = await response.json();

// Now user has both Auth0 AND DeafAUTH accessibility features
// Use access_token for DeafAUTH API calls
```

### Nginx Integration

If you have an existing Nginx setup, add auth_request:

```nginx
# Your existing nginx config
server {
    listen 80;
    server_name your-app.com;

    # Internal auth endpoint
    location = /_auth {
        internal;
        proxy_pass http://deafauth-api:3000/auth/validate;
        proxy_pass_request_body off;
        proxy_set_header Content-Length "";
        proxy_set_header Authorization $http_authorization;
    }

    # Protected endpoints
    location /api {
        auth_request /_auth;
        proxy_pass http://your-api:8080;
    }
}
```

## Production Checklist

- [ ] Generate secure PASETO keys
- [ ] Store keys in secure vault (not filesystem)
- [ ] Set `NODE_ENV=production`
- [ ] Use strong database password
- [ ] Enable HTTPS/TLS
- [ ] Set `SECURE_COOKIES=true`
- [ ] Configure proper CORS origins
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring/alerts
- [ ] Review security settings
- [ ] Enable rate limiting
- [ ] Set up CI/CD pipeline

## Troubleshooting

### "Database connection failed"

```bash
# Check if PostgreSQL is running
docker-compose ps db

# Check logs
docker-compose logs db

# Verify connection string
echo $DATABASE_URL
```

### "PASETO keys not found"

```bash
# Verify keys exist
ls -la api-server/keys/

# Regenerate if needed
cd api-server
openssl genpkey -algorithm Ed25519 -out keys/paseto_private.pem
openssl pkey -in keys/paseto_private.pem -pubout -out keys/paseto_public.pem
```

### "401 Unauthorized"

```bash
# Check token in Authorization header
# Format: Bearer <token>

# Verify token hasn't expired (10 min default)
# Use refresh endpoint if expired
curl -X POST http://localhost:3000/auth/refresh \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

## Next Steps

1. **Read** `api-server/README.md` for detailed API documentation
2. **Review** `docs/SKELETON_FRAMEWORK.md` for architecture overview
3. **Integrate** with your existing auth provider
4. **Configure** PinkSync and PinkFlow endpoints
5. **Deploy** to production

## Support

- GitHub Issues: https://github.com/DeafAUTH/DeafAUTH/issues
- Documentation: https://github.com/DeafAUTH/DeafAUTH/tree/main/docs

---

**Remember**: DeafAUTH works **alongside** your existing authentication, not replacing it. It adds accessibility features for deaf users on top of any auth system.
