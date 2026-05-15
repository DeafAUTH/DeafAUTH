# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **Do not** create a public GitHub issue
2. Contact the maintainers directly through GitHub Security Advisories
3. Provide detailed information about the vulnerability
4. Allow reasonable time for a fix before public disclosure

## Security Practices

### Database Security

1. **Row Level Security (RLS)**: All tables must have RLS enabled
2. **Minimal Permissions**: Grant only necessary permissions to roles
3. **Service Role Access**: Use service role only for server-side operations that require elevated access
4. **Audit Logging**: Sensitive operations should be logged for security review

### Authentication Security

1. **Token Validation**: Always validate tokens on the server side
2. **PKCE**: Use PKCE for public OAuth clients
3. **Secure Storage**: Never store sensitive tokens in localStorage
4. **Session Management**: Implement proper session timeout and invalidation

### API Security

1. **Input Validation**: Validate and sanitize all user input
2. **Rate Limiting**: Implement rate limiting on sensitive endpoints
3. **CORS**: Configure strict CORS policies
4. **HTTPS**: All production traffic must use HTTPS

### Code Security

1. **Dependency Scanning**: Regularly scan for vulnerable dependencies
2. **Code Review**: All changes require review before merging
3. **Secrets Management**: Never commit secrets to the repository
4. **Access Control**: Use least-privilege access for CI/CD and integrations

## Supabase Security Notes

The `supabase-disabled/` directory contains archived database schemas. When restoring:

1. Review all GRANT statements carefully
2. Prefer service-role for audit/logging inserts over authenticated role
3. Ensure RLS policies are properly configured
4. Test policies in a staging environment first

## Security Contacts

- Repository: [@pinkycollie](https://github.com/pinkycollie)
