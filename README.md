# DeafAUTH Repository Structure

## 📁 Repository Overview

```
github.com/deafauth/deafauth              # Core identity compiler
github.com/pinkycollie/deafauth-ecosystem # Full MBTQ Universe integration
github.com/pinkycollie/auth-services      # Microservices architecture
```

---

# 1️⃣ github.com/deafauth/deafauth

## Core DeafAUTH Identity Compiler

**Framework-Agnostic Universal Identity System**

---

## 🎯 What is DeafAUTH?

DeafAUTH is a **universal identity compiler** that aggregates authentication from multiple sources into a single Deaf-first identity hub.

**Not a framework. Not a library. A protocol.**

```
┌─────────────────────────────────────────┐
│  Your Existing Auth Systems             │
│  (Auth0, Google, Work SSO, School, IoT) │
└──────────────┬──────────────────────────┘
               │
               ▼
         ┌────────────┐
         │  DeafAUTH  │  ← Compiles ALL into ONE
         │  Compiler  │     with Deaf-first defaults
         └──────┬─────┘
                │
                ▼
    ┌───────────────────────┐
    │  One Identity         │
    │  Infinite Access      │
    │  Accessibility Synced │
    └───────────────────────┘
```

---

## 🚀 Quick Start (Any Language)

### JavaScript/TypeScript
```typescript
import { DeafAUTH } from '@deafauth/core';

const deafauth = new DeafAUTH({
  apiUrl: 'https://api.deafauth.mbtq.dev'
});

// Register with Deaf-first defaults
const user = await deafauth.register({
  email: 'user@example.com',
  password: 'secure-password',
  name: 'John Doe'
});

// Automatically includes:
// - deaf_status: 'unspecified'
// - preferred_language: 'ASL'
// - communication_preference: 'visual'
// - accessibility_needs: []
```

### Python
```python
from deafauth import DeafAUTH

deafauth = DeafAUTH(api_url='https://api.deafauth.mbtq.dev')

user = deafauth.register(
    email='user@example.com',
    password='secure-password',
    name='John Doe'
)
```

### cURL (REST API)
```bash
curl -X POST https://api.deafauth.mbtq.dev/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure-password",
    "name": "John Doe"
  }'
```

### Go
```go
package main

import "github.com/deafauth/go-sdk"

func main() {
    client := deafauth.NewClient("https://api.deafauth.mbtq.dev")
    
    user, err := client.Register(deafauth.RegisterParams{
        Email:    "user@example.com",
        Password: "secure-password",
        Name:     "John Doe",
    })
}
```

### PHP
```php
<?php
require 'vendor/autoload.php';

use DeafAUTH\Client;

$deafauth = new Client('https://api.deafauth.mbtq.dev');

$user = $deafauth->register([
    'email' => 'user@example.com',
    'password' => 'secure-password',
    'name' => 'John Doe'
]);
```

### Ruby
```ruby
require 'deafauth'

client = DeafAUTH::Client.new(api_url: 'https://api.deafauth.mbtq.dev')

user = client.register(
  email: 'user@example.com',
  password: 'secure-password',
  name: 'John Doe'
)
```

---

## 🏗️ Architecture

DeafAUTH is **protocol-first, not framework-specific**.

### Core Concepts

1. **Identity Compilation** - Aggregate multiple auth sources
2. **Deaf-First Defaults** - Accessibility preferences built-in
3. **Provider Agnostic** - Works with Auth0, Google, Supabase, anything
4. **RESTful API** - HTTP/JSON, works anywhere

### API Endpoints

```
POST   /v1/register              # Create DeafAUTH identity
POST   /v1/login                 # Authenticate user
POST   /v1/validate-deaf         # Validate Deaf identity
POST   /v1/connect-system        # Link external auth system
GET    /v1/user/:id              # Get user profile
PATCH  /v1/user/:id              # Update preferences
DELETE /v1/user/:id              # Delete identity
```

### OpenAPI Specification

Full API docs: [api.deafauth.mtbq.dev/docs](https://api.deafauth.mbtq.dev/docs)

---

## 🔌 Integration Patterns

### Pattern 1: OAuth Wrapper
Wrap existing OAuth with DeafAUTH:

```
User → Your App → DeafAUTH → Auth0/Google
                     ↓
              Deaf preferences
              stored & synced
```

### Pattern 2: Identity Hub
Central hub for all authentications:

```
Work SSO ─┐
School   ─┼→ DeafAUTH → Your App
IoT      ─┤     ↓
Banking  ─┘   Single identity
            + Accessibility
```

### Pattern 3: Microservices
Each service checks DeafAUTH:

```
Service A ─┐
Service B ─┼→ DeafAUTH API
Service C ─┘  (validates token
              + returns prefs)
```

---

## 📦 SDKs & Libraries

| Language | Package | Install |
|----------|---------|---------|
| JavaScript/TypeScript | `@deafauth/core` | `npm install @deafauth/core` |
| Python | `deafauth` | `pip install deafauth` |
| Go | `github.com/deafauth/go-sdk` | `go get github.com/deafauth/go-sdk` |
| PHP | `deafauth/php-sdk` | `composer require deafauth/php-sdk` |
| Ruby | `deafauth` | `gem install deafauth` |
| Rust | `deafauth` | `cargo add deafauth` |
| Java | `deafauth:sdk` | Maven/Gradle |

---

## 🤝 Contributing

DeafAUTH is built **BY** and **FOR** the Deaf community.

**We need:**
- Deaf developers
- ASL experts
- Accessibility consultants
- UX designers (Deaf perspective)
- Community feedback

**Not needed:**
- Hearing people making assumptions
- Solutions without Deaf input
- "Accessibility" defined by hearing standards

---

## 📄 License

MIT License - Use freely, attribute appropriately

---

## 🔗 Links

- **Website:** [deafauth.io](https://deafauth.mbtq.dev)
- **API Docs:** [api.deafauth.io/docs](https://api.deafauth.mbtq.dev/docs)
- **Community:** [discord.gg/deafauth](https://discord.gg/deafauth)
- **Email:** deafauth@mbtq.dev

---

---

# 2️⃣ github.com/pinkycollie/deafauth-ecosystem

## Complete MBTQ Universe Integration

**Full-Stack Deaf-First Business Operating System**

---

## 🌐 What is the DeafAUTH Ecosystem?

The complete MBTQ Universe where DeafAUTH is the **identity layer** integrated with:

- **DeafAUTH** - Identity compilation
- **Fibonrose** - Ethics engine & blockchain logging
- **PinkSync** - Universal accessibility sync
- **360 Magicians** - AI agents with Deaf awareness
- **DAO** - Community governance

---

## 🏗️ Repository Structure

```
deafauth-ecosystem/
├── packages/
│   ├── deafauth/           # Identity compiler
│   ├── fibonrose/          # Logging & validation
│   ├── pinksync/           # Browser extension
│   ├── magicians/          # AI agents
│   └── dao/                # Governance system
│
├── services/
│   ├── api/                # REST API
│   ├── websocket/          # Real-time sync
│   └── workers/            # Background jobs
│
├── apps/
│   ├── web/                # Main web app
│   ├── mobile/             # React Native
│   └── desktop/            # Electron
│
├── docs/
│   ├── architecture/
│   ├── deaf-research/      # Research aggregation
│   └── community/          # Deaf voices
│
└── infrastructure/
    ├── docker/
    ├── kubernetes/
    └── terraform/
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)
```bash
git clone https://github.com/pinkycollie/deafauth-ecosystem.git
cd deafauth-ecosystem
docker-compose up
```

### Option 2: Monorepo (pnpm)
```bash
pnpm install
pnpm dev
```

### Option 3: Individual Services
```bash
# API
cd services/api && npm start

# Frontend
cd apps/web && npm start

# Workers
cd services/workers && python main.py
```

---

## 🧩 Components

### DeafAUTH (Identity)
- Multi-provider authentication
- Deaf-first profile defaults
- Identity compilation

### Fibonrose (Ethics & Logging)
- Event logging
- Blockchain anchoring
- Validation tracking
- Audit trails

### PinkSync (Accessibility)
- Browser extension
- Universal caption enabler
- Visual alert system
- Form auto-fill

### 360 Magicians (AI)
- Deaf-aware AI agents
- Role-based permissions
- Task automation

### DAO (Governance)
- Community voting
- Proposal system
- Reputation-based access

---

## 🔧 Technology Stack

**Flexible - Choose Your Stack:**

### Frontend Options
- React + TypeScript
- Vue + TypeScript
- Svelte + TypeScript
- Solid.js
- **Your choice**

### Backend Options
- Node.js (Express/Fastify)
- Python (FastAPI)
- Go
- Rust (Actix/Axum)
- **Your choice**

### Database Options
- PostgreSQL (production)
- SQLite (development)
- Supabase
- **Your choice**

### Infrastructure Options
- Docker + Kubernetes
- Serverless (Vercel/Netlify)
- Traditional VPS
- **Your choice**

---

## 🎨 Design System

**Framework-agnostic design tokens:**

```json
{
  "colors": {
    "primary": "#ff1493",
    "secondary": "#8a2be2",
    "success": "#00ff88",
    "warning": "#ffa500",
    "error": "#ff6b6b"
  },
  "typography": {
    "fontFamily": "Inter, system-ui, sans-serif",
    "scale": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem"
    }
  },
  "accessibility": {
    "minTouchTarget": "44px",
    "highContrast": true,
    "reducedMotion": "respected"
  }
}
```

---

## 🤝 Contributing

This is a **monorepo** for the complete ecosystem.

**Contribution Areas:**
- Frontend development
- Backend APIs
- AI/ML (Python)
- Browser extensions
- Mobile apps
- Infrastructure
- Documentation
- Deaf research integration

---

## 📄 License

AGPL-3.0 (ecosystem must remain open-source)

---

---

# 3️⃣ github.com/pinkycollie/auth-services

## Microservices Architecture

**DeafAUTH Broken into Composable Services**

---

## 🎯 What is auth-services?

DeafAUTH as **independent microservices** that can be deployed separately.

**Use cases:**
- Large-scale deployments
- Different teams own different services
- Mix languages (Node.js API + Python ML)
- Scale services independently

---

## 🏗️ Service Architecture

```
auth-services/
├── services/
│   ├── identity/           # Core authentication
│   ├── validation/         # Deaf identity validation
│   ├── systems/            # External system connections
│   ├── accessibility/      # Preference management
│   ├── logging/            # Fibonrose integration
│   └── notifications/      # Email/webhooks
│
├── gateway/                # API Gateway
├── shared/                 # Shared libraries
└── infrastructure/         # Deployment configs
```

---

## 🚀 Services Overview

### 1. Identity Service
**Port:** 5001  
**Tech:** Your choice (Node/Python/Go)  
**Purpose:** Core authentication

```bash
POST /register
POST /login
POST /logout
GET  /user/:id
```

### 2. Validation Service
**Port:** 5002  
**Tech:** Python (ML/AI heavy)  
**Purpose:** Deaf identity validation

```bash
POST /validate-deaf
POST /validate-community
GET  /validation-status/:userId
```

### 3. Systems Service
**Port:** 5003  
**Tech:** Node.js (API integrations)  
**Purpose:** Connect external systems

```bash
POST /connect
GET  /connected/:userId
DELETE /disconnect/:systemId
```

### 4. Accessibility Service
**Port:** 5004  
**Tech:** Any  
**Purpose:** Manage preferences

```bash
GET  /preferences/:userId
PUT  /preferences/:userId
POST /sync-preferences
```

### 5. Logging Service
**Port:** 5005  
**Tech:** Go (high-performance)  
**Purpose:** Fibonrose logging

```bash
POST /log
GET  /logs/:userId
POST /blockchain-anchor
```

### 6. Notification Service
**Port:** 5006  
**Tech:** Node.js  
**Purpose:** Emails, webhooks

```bash
POST /email
POST /webhook
GET  /notifications/:userId
```

---

## 🔌 API Gateway

**Single entry point for all services:**

```
Client → API Gateway (port 8080)
            ↓
    ┌───────┴───────┐
    ↓               ↓
Identity (5001)  Validation (5002)
    ↓               ↓
Systems (5003)   Accessibility (5004)
    ↓               ↓
Logging (5005)   Notifications (5006)
```

---

## 🚀 Deployment Options

### Option 1: Docker Compose
```bash
docker-compose up
# All services start on localhost
```

### Option 2: Kubernetes
```bash
kubectl apply -f k8s/
# Services auto-scale
```

### Option 3: Serverless
```bash
# Each service as Lambda/Cloud Function
serverless deploy
```

### Option 4: Traditional
```bash
# Manual service startup
cd services/identity && npm start
cd services/validation && python main.py
# etc...
```

---

## 🔧 Service Communication

### Option 1: REST
Services call each other via HTTP

### Option 2: Message Queue
RabbitMQ/Redis for async communication

### Option 3: gRPC
High-performance RPC

### Option 4: GraphQL Federation
Unified GraphQL API

**Your choice based on needs.**

---

## 📊 Service Template

Each service follows the same structure:

```
service-name/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── models/
├── tests/
├── Dockerfile
├── package.json (or requirements.txt)
└── README.md
```

---

## 🧪 Testing

Each service has independent tests:

```bash
# Test individual service
cd services/identity
npm test

# Test all services
./scripts/test-all.sh

# Integration tests
npm run test:integration
```

---

## 📈 Monitoring

**Each service exposes:**
- `/health` - Health check
- `/metrics` - Prometheus metrics
- `/ready` - Readiness probe

**Centralized monitoring:**
- Grafana dashboards
- Prometheus metrics
- ELK stack for logs

---

## 🤝 Contributing

**Perfect for:**
- Teams wanting to own specific services
- Polyglot development (different languages)
- Large-scale deployments
- Gradual migration from monolith

**Each service can be:**
- Developed independently
- Deployed separately
- Scaled individually
- Written in different languages

---

## 📄 License

MIT License

---

## 🔗 Comparison

| Repo | Best For | Complexity | Scale |
|------|----------|------------|-------|
| **deafauth/deafauth** | SDK users, simple integration | Low | Small-Medium |
| **pinkycollie/deafauth-ecosystem** | Full product, monorepo | Medium | Medium-Large |
| **pinkycollie/auth-services** | Enterprise, microservices | High | Large-Scale |

---

## 🎯 Which Repo Should You Use?

### Use `deafauth/deafauth` if:
- You want to integrate DeafAUTH into existing app
- You need an SDK/library
- You're building something simple

### Use `deafauth-ecosystem` if:
- You're building the complete MBTQ platform
- You want all components together
- You're starting from scratch

### Use `auth-services` if:
- You need microservices architecture
- You have multiple teams
- You need to scale services independently
- You want polyglot development

---

## 📧 Contact

**All repos maintained by:** pinkycollie / MBTQ  
**Email:** deafauth@mbtq.dev  
**Community:** Built WITH the Deaf community, not FOR them

---

**Remember:** DeafAUTH is not about hearing people building "accessibility tools."  
It's about Deaf identity, culture, and autonomy in digital spaces.

