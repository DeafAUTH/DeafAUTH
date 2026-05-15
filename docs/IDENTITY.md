# Identity Management Guidelines

This document outlines the identity and authentication practices for the DeafAUTH project.

## OIDC Core Concepts

DeafAUTH follows OpenID Connect (OIDC) core concepts for identity verification:

1. **Token Verification**: All tokens must be verified against the issuer's public keys
2. **PKCE for Public Clients**: Public clients (e.g., SPAs, mobile apps) must use PKCE (Proof Key for Code Exchange) for authorization code flows
3. **Standard Claims**: Use standard OIDC claims (sub, iss, aud, exp, iat) for identity assertions

## Agent Identity

Agents interacting with this repository must:

1. Be registered in `attestations/context/agents.md`
2. Document their identity verification method
3. Follow the identity compliance requirements for their type

### Service Agents

Service agents must:
- Use service accounts with minimal required permissions
- Implement secure token storage
- Rotate credentials regularly

### Human Agents

Human agents must:
- Verify their identity through GitHub account authentication
- Document identity proofing steps in PRs that modify attestations
- Use MFA on their GitHub accounts

## Token Handling

When handling authentication tokens:

1. Never log tokens in plaintext
2. Validate token expiration before use
3. Use short-lived tokens where possible
4. Implement token refresh mechanisms

## References

- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 for Native Apps (RFC 8252)](https://tools.ietf.org/html/rfc8252)
- [Proof Key for Code Exchange (RFC 7636)](https://tools.ietf.org/html/rfc7636)
