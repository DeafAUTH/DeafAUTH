# Agents

This file lists canonical agents that can produce or verify attestations for this repository. Each entry MUST contain the required fields: id, name, type, description, contact, created, and identity_compliance (short statement referencing OIDC/OAuth practices or link to docs/IDENTITY.md).

- id: agent-001
  name: DeafAuth CLI Attester
  type: service
  description: "CLI tool that validates attestations and signs attestation metadata during local workflows."
  contact: "@pinkycollie"
  created: "2025-11-28"
  identity_compliance: "follows OIDC core concepts; uses standard token verification and PKCE for public clients. See docs/IDENTITY.md"

- id: agent-002
  name: Repository Maintainer
  type: human
  description: "Human maintainer responsible for approving attestation changes and operating the identity infrastructure."
  contact: "pinkycollie"
  created: "2025-11-28"
  identity_compliance: "manual review required; must document identity proofing steps in PRs"
