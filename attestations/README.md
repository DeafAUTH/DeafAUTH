# Attestations

This directory holds canonical attestation metadata for the repository. Use it to record agents, their roles, and compliance notes.

## Structure

- `context/agents.md` - Lists canonical agents that can produce or verify attestations

## Commands

- `scripts/new-agent.sh` - Script to add new agents (coming soon)

## Adding Agents

To add a new agent, edit `context/agents.md` and include all required fields:
- id: unique identifier (e.g., agent-003)
- name: human-readable name
- type: service or human
- description: what the agent does
- contact: GitHub handle or email
- created: date added (YYYY-MM-DD)
- identity_compliance: statement about identity verification practices

## Validation

Run the attestation validator to check for issues:
```bash
# Coming soon: scripts/validate-attestations.sh
```
