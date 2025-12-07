# Archived Files

This directory contains archived documentation, concept files, and reference materials for the broader MBTQ ecosystem. These files are kept for reference but are not part of the core DeafAUTH SDK implementation.

## Purpose

The archive preserves ecosystem planning documents and integration specifications while keeping the main DeafAUTH codebase focused on its core purpose as the **Identity Cortex** - the gatekeeper and validation initial point.

## Contents

### Documentation
- **Mbtq-technical-implementation.md** - Technical architecture overview for the MBTQ Universe ecosystem
- **Optimal-Regions.md** - Business expansion and regional strategy planning
- **proposal-sign-speak.md** - Integration proposal for Sign-Speak API with financial/tax services

### Schemas & Configurations
- **pinkflow-scheme.json** - Data schema for PinkFlow orchestration layer
- **pinksync-scheme.json** - JSON Schema for PinkSync accessibility automation (reference for DeafAUTH integration)

### Code Samples
- **mbtq-server.txt** - Model Context Protocol (MCP) server implementation example
- **mbtq-winget-manifest.txt** - Windows package manager manifests strategy
- **mbtqshowcase.txt** - React component for MBTQ proposal showcase UI

### Placeholders
- **vr4deaf/** - Placeholder directory for VR accessibility features (future)
- **openid.net/** - OpenID specification reference links

## Relationship to DeafAUTH

DeafAUTH (Identity Cortex) serves as the authentication foundation that enables these ecosystem components:

- **PinkSync**: Uses DeafAUTH for identity validation before accessibility automation
- **Fibonrose**: Receives validation events from DeafAUTH for reputation tracking
- **MBTQ DAO**: Relies on DeafAUTH profiles for governance participation

## Core DeafAUTH Focus

The active DeafAUTH SDK (in `/src`) focuses on:
- Deaf-first authentication using PASETO tokens (reference: [paragonie/paseto](https://github.com/paragonie/paseto))
- ASL video verification
- Community validation
- Universal adapter layer (Auth0, Firebase, Supabase, etc.)
- PinkSync integration endpoints

For questions about these archived materials or the MBTQ ecosystem, refer to the main project documentation.
