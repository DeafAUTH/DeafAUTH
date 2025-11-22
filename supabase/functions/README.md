# DeafAuth Edge Functions

This directory contains Supabase Edge Functions for the DeafAuth authentication system.

## Overview

DeafAuth Edge Functions provide secure server-side authentication verification using:
- One-time portable identity tokens (hashed SHA256)
- JWT validation via Supabase Auth
- Audit logging for all authentication attempts
- Row-Level Security (RLS) for data protection

## Functions

### `deafauth-verify`

Verifies authentication tokens and returns user profile information.

**Endpoint:** `https://<project-ref>.supabase.co/functions/v1/deafauth-verify`

**Methods:**
1. **Portable Token Verification** - One-time use tokens
2. **JWT Verification** - Standard Supabase Auth JWTs

**Request (Portable Token):**
```json
POST /functions/v1/deafauth-verify
Content-Type: application/json

{
  "token": "one-time-token-string"
}
```

**Request (JWT):**
```http
POST /functions/v1/deafauth-verify
Authorization: Bearer <jwt-token>
```

**Response (Success):**
```json
{
  "user_id": "uuid",
  "verification_level": "verified",
  "profile": {
    "deafauth_user_id": "uuid",
    "auth_user_id": "uuid",
    "username": "string",
    "email": "string",
    "communication_preferences": {},
    "sign_language_preferences": {},
    "verification_level": "verified"
  },
  "success": true
}
```

**Response (Error):**
```json
{
  "error": "Invalid or expired token",
  "success": false
}
```

## Local Development

### Prerequisites

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli)
2. Install [Deno](https://deno.land/manual/getting_started/installation)
3. Configure your Supabase project

### Setup

1. Clone the repository:
```bash
git clone https://github.com/DeafAUTH/DeafAUTH.git
cd DeafAUTH
```

2. Link to your Supabase project:
```bash
supabase link --project-ref <your-project-ref>
```

3. Set environment secrets:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
supabase secrets set HMAC_SECRET=<your-hmac-secret>
```

### Running Locally

Serve all functions:
```bash
supabase functions serve
```

Serve a specific function:
```bash
supabase functions serve deafauth-verify
```

Test locally:
```bash
curl -X POST http://localhost:54321/functions/v1/deafauth-verify \
  -H "Content-Type: application/json" \
  -d '{"token": "test-token"}'
```

### Testing

```bash
deno test --allow-all
```

## Deployment

### Manual Deployment

Deploy a single function:
```bash
supabase functions deploy deafauth-verify --project-ref <your-project-ref>
```

Deploy all functions:
```bash
for fn in supabase/functions/*; do
  if [ -d "$fn" ]; then
    supabase functions deploy "$(basename "$fn")" --project-ref <your-project-ref>
  fi
done
```

### Automated Deployment (CI/CD)

The repository includes a GitHub Actions workflow (`.github/workflows/deploy-functions.yml`) that automatically deploys functions when changes are pushed to `main` or `master`.

#### Required GitHub Secrets:

1. `SUPABASE_ACCESS_TOKEN` - Get from Supabase CLI:
   ```bash
   supabase login
   # Token will be stored, or generate at https://app.supabase.com/account/tokens
   ```

2. `SUPABASE_PROJECT_REF` - Your project reference (e.g., `hhgmgvhrmebkiscphirp`)

3. `SUPABASE_SERVICE_ROLE_KEY` - Service role key from Supabase project settings

4. `HMAC_SECRET` - (Optional) Secret for HMAC token signing

Add these secrets in GitHub:
- Go to repository Settings → Secrets and variables → Actions
- Click "New repository secret"
- Add each secret

## Database Schema

The Edge Functions interact with the following database schema:

### Tables

- `deafauth.users` - Core user records
- `deafauth.user_profiles` - User profile information
- `deafauth.user_verification` - Verification status
- `deafauth.portable_identity_tokens` - One-time tokens
- `deafauth.token_verification_audit` - Authentication audit log

### Views

- `deafauth.public_profile` - Public profile information (non-sensitive)

### Migrations

Run migrations to set up the schema:
```bash
supabase db push
```

Or apply manually via the Supabase SQL Editor using files in `supabase/migrations/`.

## Security Best Practices

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY` to clients** - Only use server-side
2. **Use one-time tokens** - Portable tokens are automatically revoked after use
3. **Rate limiting** - Implement rate limiting via API gateway or Cloudflare
4. **Monitor audit logs** - Review `token_verification_audit` regularly
5. **HMAC signing** - Consider signing portable tokens with HMAC for stronger security
6. **Row-Level Security** - All tables have RLS enabled with appropriate policies

## Configuration Files

- `deno.json` - Deno TypeScript configuration
- `import_map.json` - Dependency imports
- `.github/workflows/deploy-functions.yml` - CI/CD pipeline

## Environment Variables

The following environment variables are automatically provided in Edge Functions:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Anonymous key (auto-provided)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (set via secrets)

Additional secrets can be set via:
```bash
supabase secrets set KEY_NAME=value --project-ref <project-ref>
```

## Ecosystem Integration

This implementation is part of the [DeafAuth Ecosystem](https://github.com/pinkycollie/deafauth-ecosystem) which provides comprehensive authentication solutions for Deaf and Hard of Hearing communities.

## Troubleshooting

### Function fails to deploy

1. Check Supabase CLI is up to date: `supabase --version`
2. Verify authentication: `supabase login --token <token>`
3. Check project ref: `supabase projects list`

### Local function not responding

1. Ensure Supabase is running: `supabase status`
2. Check function logs: `supabase functions logs deafauth-verify`
3. Verify environment variables are set

### Authentication errors

1. Check service role key is correct
2. Verify RLS policies are enabled
3. Review audit logs in `deafauth.token_verification_audit`

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with `supabase functions serve`
4. Submit a pull request

## License

See the main repository LICENSE file.

## Support

For issues and questions:
- GitHub Issues: https://github.com/DeafAUTH/DeafAUTH/issues
- DeafAuth Ecosystem: https://github.com/pinkycollie/deafauth-ecosystem
