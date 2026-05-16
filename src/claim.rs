// ============================================================
// DeafAuth — PASETO v4 Token Claim Schema
// deafauth/src/claims.rs
//
// Defines the canonical token payload and all mbtq.* claim
// namespaces. Every downstream service (PinkSync, vr4deaf,
// FibonRose, MagicianCore) reads entitlements from this
// structure — it is the single contract between the webhook
// and all services.
//
// PASETO v4.local (symmetric) for internal service-to-service
// PASETO v4.public (Ed25519) for user-facing tokens
// ============================================================

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use time::OffsetDateTime;

// ── Re-exports ───────────────────────────────────────────────
pub use deafauth_claims::*;
pub use pinksync_claims::*;
pub use fibonrose_claims::*;
pub use vr4deaf_claims::*;
pub use magiciancore_claims::*;

// ============================================================
// REGISTERED CLAIMS (standard PASETO / JWT fields)
// ============================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisteredClaims {
/// Issuer — always “deafauth.mbtq.dev”
pub iss: String,
/// Subject — Supabase auth.users.id (UUID)
pub sub: String,
/// Audience — which services accept this token
/// e.g. [“mbtq.dev”, “vr4deaf.org”, “api.mbtq.dev”]
pub aud: Vec<String>,
/// Expiration (Unix timestamp)
pub exp: i64,
/// Issued at (Unix timestamp)
pub iat: i64,
/// Token ID (for revocation)
pub jti: String,
}

// ============================================================
// ASL IDENTITY CLAIMS  (mbtq.identity.*)
// ============================================================
pub mod deafauth_claims {
use super::*;

```
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct IdentityClaims {
    /// User's chosen ASL handshape identifier
    /// e.g. "A", "B", "5", "ILY" — from ASL handshape symbol set
    pub handshape: Option<String>,
    /// Whether the user has completed Deaf identity verification
    pub deaf_verified: bool,
    /// Preferred communication mode
    pub comm_mode: CommMode,
    /// DeafAuth tenant IDs this user belongs to
    pub tenant_ids: Vec<String>,
    /// Number of tenants allowed by subscription
    pub max_tenants: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum CommMode {
    #[default]
    Asl,
    Signed,
    Written,
    Oral,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeafAuthEntitlement {
    pub tier: DeafAuthTier,
    /// Number of allowed seats (1 for individual, 10 for agency, -1 for gov)
    pub seats: i32,
    /// Number of allowed service endpoint plugins
    pub max_plugins: u8,
    /// HIPAA consent flow enabled
    pub hipaa_enabled: bool,
    /// Multi-tenant provisioning allowed
    pub multi_tenant: bool,
    /// SSO/SAML bridge allowed
    pub sso_enabled: bool,
    /// Deaf directory plugin keys this user has activated
    pub active_plugins: Vec<String>,
    /// Gov-level: grant billing codes enabled
    pub grant_billing: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq, PartialOrd)]
#[serde(rename_all = "snake_case")]
pub enum DeafAuthTier {
    #[default]
    Personal,
    DeafPro,
    AgencyTenant,
    GovTenant,
}

impl DeafAuthEntitlement {
    pub fn free() -> Self {
        Self {
            tier: DeafAuthTier::Personal,
            seats: 1, max_plugins: 1, hipaa_enabled: false,
            multi_tenant: false, sso_enabled: false,
            active_plugins: vec![], grant_billing: false,
        }
    }
}
```

}

// ============================================================
// PINKSYNC CLAIMS  (mbtq.pinksync.*)
// ============================================================
pub mod pinksync_claims {
use super::*;

```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PinkSyncEntitlement {
    pub tier: PinkSyncTier,
    /// Max tokens per day (free tier). -1 = unlimited.
    pub tokens_per_day: i64,
    /// Max tokens per month. -1 = unlimited.
    pub tokens_per_month: i64,
    /// AI providers this tier can route to
    pub providers: Vec<AiProvider>,
    /// SignMirror 3D avatar integration enabled
    pub sign_mirror: bool,
    /// Creator marketplace listing allowed
    pub marketplace_listing: bool,
    /// Max webhook endpoints
    pub max_webhooks: u16,
    /// Ollama sovereign mode enabled (HIPAA builds)
    pub sovereign_mode: bool,
    /// FibonRose reward distribution eligibility
    pub fibonrose_eligible: bool,
    /// MagicianCore pod bridge enabled
    pub pod_bridge: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq, PartialOrd)]
#[serde(rename_all = "snake_case")]
pub enum PinkSyncTier {
    #[default]
    Dev,
    Creator,
    Partner,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AiProvider {
    Claude,
    Gemini,
    DeepSeek,
    Ollama,
    Gpt4,
    Llama,
    Gemma,
}

impl PinkSyncEntitlement {
    pub fn free() -> Self {
        Self {
            tier: PinkSyncTier::Dev,
            tokens_per_day: 10_000, tokens_per_month: -1,
            providers: vec![AiProvider::Claude],
            sign_mirror: false, marketplace_listing: false,
            max_webhooks: 1, sovereign_mode: false,
            fibonrose_eligible: false, pod_bridge: false,
        }
    }

    /// Check if a provider is available on this tier
    pub fn can_use_provider(&self, provider: &AiProvider) -> bool {
        self.providers.contains(provider)
    }
}
```

}

// ============================================================
// FIBONROSE CLAIMS  (mbtq.fibonrose.*)
// ============================================================
pub mod fibonrose_claims {
use super::*;

```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FibonRoseEntitlement {
    pub tier: FibonRoseTier,
    /// Can write to trust ledger
    pub can_write: bool,
    /// Maximum recipients in Fibonacci distribution
    /// F5=5, F7=13, F12=144
    pub max_recipients: u16,
    /// FibonRose DAO governance vote eligible
    pub dao_vote: bool,
    /// Government/grant audit trail access
    pub gov_audit: bool,
    /// Per-transaction overage waived (gov plan)
    pub overage_waived: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq, PartialOrd)]
#[serde(rename_all = "snake_case")]
pub enum FibonRoseTier {
    #[default]
    Observer,
    TrustNode,
    Orchestrator,
}

impl FibonRoseEntitlement {
    pub fn free() -> Self {
        Self {
            tier: FibonRoseTier::Observer,
            can_write: false, max_recipients: 0,
            dao_vote: false, gov_audit: false,
            overage_waived: false,
        }
    }
}
```

}

// ============================================================
// VR4DEAF CLAIMS  (mbtq.vr4deaf.*)
// ============================================================
pub mod vr4deaf_claims {
use super::*;

```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vr4DeafEntitlement {
    pub tier: Vr4DeafTier,
    /// Number of counselor seats
    pub counselors: u16,
    /// RSA-911 auto-filing enabled
    pub rsa911: bool,
    /// Grant billing code support
    pub grant_billing: bool,
    /// Business Pod linked
    pub biz_pod_linked: bool,
    /// FibonRose audit trail linked
    pub fibonrose_linked: bool,
    /// MBTQ Express QR enrollment enabled
    pub mbtq_express: bool,
    /// State-specific rate schedule loaded (see rsa_rate_schedule table)
    pub state_code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq, PartialOrd)]
#[serde(rename_all = "snake_case")]
pub enum Vr4DeafTier {
    #[default]
    Seeker,
    Agency,
    StateSystem,
}

impl Vr4DeafEntitlement {
    pub fn free() -> Self {
        Self {
            tier: Vr4DeafTier::Seeker,
            counselors: 0, rsa911: false, grant_billing: false,
            biz_pod_linked: false, fibonrose_linked: false,
            mbtq_express: false, state_code: None,
        }
    }
}
```

}

// ============================================================
// MAGICIANCORE POD CLAIMS  (mbtq.pods.*)
// ============================================================
pub mod magiciancore_claims {
use super::*;

```
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PodEntitlements {
    pub dev:  Option<DevPodEntitlement>,
    pub biz:  Option<BizPodEntitlement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevPodEntitlement {
    /// Generation runs per month (50 base)
    pub runs_per_month: u32,
    /// Runs used this billing period
    pub runs_used: u32,
    /// All 7 build types available
    pub build_types: u8,
    /// Scaffold engine access
    pub scaffold_engine: bool,
    /// Copilot bridge enabled
    pub copilot_bridge: bool,
    /// Legacy bridge indexer enabled
    pub legacy_bridge: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BizPodEntitlement {
    /// Document generation runs per month (50 base)
    pub runs_per_month: u32,
    pub runs_used: u32,
    /// Grant templates (SBIR/RSA/NIDILRR/AT3) available
    pub grant_templates: bool,
    /// RSA-911 auto-filing enabled
    pub rsa911_auto: bool,
    /// GovTribe grant search enabled
    pub govtribe: bool,
    /// Docusign bridge enabled
    pub docusign: bool,
    /// Taskade workflow sync enabled
    pub taskade: bool,
}

impl DevPodEntitlement {
    pub fn base() -> Self {
        Self { runs_per_month: 50, runs_used: 0, build_types: 7,
            scaffold_engine: true, copilot_bridge: false, legacy_bridge: false }
    }
    pub fn runs_remaining(&self) -> i64 {
        self.runs_per_month as i64 - self.runs_used as i64
    }
}

impl BizPodEntitlement {
    pub fn base() -> Self {
        Self { runs_per_month: 50, runs_used: 0, grant_templates: true,
            rsa911_auto: false, govtribe: false, docusign: true, taskade: true }
    }
}
```

}

// ============================================================
// FULL TOKEN PAYLOAD
// ============================================================
/// The complete PASETO v4 token payload issued by DeafAuth.
/// All mbtq.* namespaces are optional — only present if the
/// user has an active subscription to that service.
///
/// Serialized as JSON, encrypted (v4.local) or signed (v4.public).
///
/// Namespace key convention:  “mbtq.<service>”
/// e.g. token[“mbtq.deafauth”], token[“mbtq.pinksync”], etc.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MbtqTokenPayload {
// ── Standard registered claims ──────────────────────────
#[serde(flatten)]
pub registered: RegisteredClaims,

```
// ── ASL identity ────────────────────────────────────────
#[serde(rename = "mbtq.identity")]
pub identity: IdentityClaims,

// ── Service entitlements (populated from Supabase) ──────
#[serde(rename = "mbtq.deafauth", skip_serializing_if = "Option::is_none")]
pub deafauth: Option<DeafAuthEntitlement>,

#[serde(rename = "mbtq.pinksync", skip_serializing_if = "Option::is_none")]
pub pinksync: Option<PinkSyncEntitlement>,

#[serde(rename = "mbtq.fibonrose", skip_serializing_if = "Option::is_none")]
pub fibonrose: Option<FibonRoseEntitlement>,

#[serde(rename = "mbtq.vr4deaf", skip_serializing_if = "Option::is_none")]
pub vr4deaf: Option<Vr4DeafEntitlement>,

#[serde(rename = "mbtq.pods", skip_serializing_if = "Option::is_none")]
pub pods: Option<PodEntitlements>,

/// Arbitrary extension claims for future services
#[serde(rename = "mbtq.ext", default, skip_serializing_if = "HashMap::is_empty")]
pub ext: HashMap<String, serde_json::Value>,
```

}

// ============================================================
// TOKEN BUILDER — pulls entitlements from Supabase rows
// ============================================================
impl MbtqTokenPayload {
/// Build a token payload from Supabase entitlement rows.
/// Called by DeafAuth after stripe-webhook has synced the subscriptions table.
pub fn from_entitlement_rows(
user_id: &str,
email: Option<&str>,
identity: IdentityClaims,
rows: &[EntitlementRow],
) -> Self {
let mut payload = Self {
registered: RegisteredClaims {
iss: “deafauth.mbtq.dev”.into(),
sub: user_id.into(),
aud: vec![“mbtq.dev”.into(), “vr4deaf.org”.into(), “api.mbtq.dev”.into()],
exp: (OffsetDateTime::now_utc() + time::Duration::hours(1)).unix_timestamp(),
iat: OffsetDateTime::now_utc().unix_timestamp(),
jti: uuid::Uuid::new_v4().to_string(),
},
identity,
deafauth: None,
pinksync: None,
fibonrose: None,
vr4deaf: None,
pods: None,
ext: HashMap::new(),
};

```
    for row in rows {
        match row.service.as_str() {
            "deafauth" => {
                payload.deafauth = serde_json::from_value(row.entitlements.clone()).ok();
            }
            "pinksync" => {
                payload.pinksync = serde_json::from_value(row.entitlements.clone()).ok();
            }
            "fibonrose" => {
                payload.fibonrose = serde_json::from_value(row.entitlements.clone()).ok();
            }
            "vr4deaf" => {
                payload.vr4deaf = serde_json::from_value(row.entitlements.clone()).ok();
            }
            "magiciancore_dev" => {
                let dev: Option<DevPodEntitlement> =
                    serde_json::from_value(row.entitlements.clone()).ok();
                payload.pods.get_or_insert_with(Default::default).dev = dev;
            }
            "magiciancore_biz" => {
                let biz: Option<BizPodEntitlement> =
                    serde_json::from_value(row.entitlements.clone()).ok();
                payload.pods.get_or_insert_with(Default::default).biz = biz;
            }
            _ => {
                // Unknown service → stash in ext for forward compat
                payload.ext.insert(row.service.clone(), row.entitlements.clone());
            }
        }
    }

    payload
}

// ── Per-service convenience checkers ────────────────────

pub fn can_use_deafauth(&self, min_tier: DeafAuthTier) -> bool {
    self.deafauth.as_ref()
        .map(|e| e.tier >= min_tier)
        .unwrap_or(false)
}

pub fn can_use_pinksync(&self, min_tier: PinkSyncTier) -> bool {
    self.pinksync.as_ref()
        .map(|e| e.tier >= min_tier)
        .unwrap_or(false)
}

pub fn can_use_vr4deaf(&self, min_tier: Vr4DeafTier) -> bool {
    self.vr4deaf.as_ref()
        .map(|e| e.tier >= min_tier)
        .unwrap_or(false)
}

pub fn rsa911_enabled(&self) -> bool {
    self.vr4deaf.as_ref().map(|e| e.rsa911).unwrap_or(false)
}

pub fn dev_pod_runs_remaining(&self) -> Option<i64> {
    self.pods.as_ref()?.dev.as_ref().map(|p| p.runs_remaining())
}

pub fn is_sovereign_mode(&self) -> bool {
    self.pinksync.as_ref().map(|e| e.sovereign_mode).unwrap_or(false)
}
```

}

// ── Supabase row shape (matches get_user_entitlements() result) ──
#[derive(Debug, Clone, Deserialize)]
pub struct EntitlementRow {
pub service:      String,
pub tier:         String,
pub entitlements: serde_json::Value,
pub period_end:   Option<String>,
}

// ============================================================
// HOW EACH SERVICE READS THE TOKEN
// ============================================================
//
// DeafAuth (identity gate):
//   token.can_use_deafauth(DeafAuthTier::DeafPro)
//
// PinkSync (AI provider routing):
//   token.pinksync?.can_use_provider(&AiProvider::Gemini)
//   token.pinksync?.sovereign_mode  → route to Ollama only
//
// vr4deaf.org (case management gate):
//   token.can_use_vr4deaf(Vr4DeafTier::Agency)
//   token.rsa911_enabled()          → show RSA-911 filing UI
//   token.vr4deaf?.state_code       → load state-specific rate schedule
//
// FibonRose (trust write gate):
//   token.fibonrose?.can_write
//   token.fibonrose?.max_recipients → cap distribution at this value
//
// MagicianCore Dev Pod:
//   token.dev_pod_runs_remaining()  → enforce run quota
//
// MagicianCore Business Pod:
//   token.pods?.biz?.grant_templates → show grant writing UI
//   token.pods?.biz?.rsa911_auto    → trigger auto-filing workflow
//
// ============================================================
// DENO / TYPESCRIPT MIRROR
// For PinkSync (Deno) and vr4deaf.org (Caddy/TS) — keep in sync.
// ============================================================
//
// export interface MbtqTokenPayload {
//   iss: string; sub: string; aud: string[]; exp: number; iat: number; jti: string;
//   “mbtq.identity”: { handshape?: string; deaf_verified: boolean; comm_mode: string; tenant_ids: string[]; max_tenants: number };
//   “mbtq.deafauth”?: { tier: string; seats: number; max_plugins: number; hipaa_enabled: boolean; multi_tenant: boolean; sso_enabled: boolean; active_plugins: string[]; grant_billing: boolean };
//   “mbtq.pinksync”?: { tier: string; tokens_per_day: number; tokens_per_month: number; providers: string[]; sign_mirror: boolean; marketplace_listing: boolean; max_webhooks: number; sovereign_mode: boolean; fibonrose_eligible: boolean; pod_bridge: boolean };
//   “mbtq.fibonrose”?: { tier: string; can_write: boolean; max_recipients: number; dao_vote: boolean; gov_audit: boolean; overage_waived: boolean };
//   “mbtq.vr4deaf”?: { tier: string; counselors: number; rsa911: boolean; grant_billing: boolean; biz_pod_linked: boolean; fibonrose_linked: boolean; mbtq_express: boolean; state_code?: string };
//   “mbtq.pods”?: { dev?: { runs_per_month: number; runs_used: number; build_types: number; scaffold_engine: boolean; copilot_bridge: boolean; legacy_bridge: boolean }; biz?: { runs_per_month: number; runs_used: number; grant_templates: boolean; rsa911_auto: boolean; govtribe: boolean; docusign: boolean; taskade: boolean } };
//   “mbtq.ext”?: Record<string, unknown>;
// }
//
// Helper (Deno/TS):
// export const canUse = (token: MbtqTokenPayload, ns: keyof MbtqTokenPayload) => !!token[ns];
// export const rsa911Enabled = (t: MbtqTokenPayload) => t[“mbtq.vr4deaf”]?.rsa911 ?? false;
// export const sovereignMode  = (t: MbtqTokenPayload) => t[“mbtq.pinksync”]?.sovereign_mode ?? false;