// deafauth-verify Edge Function (Deno / TypeScript)
// Accepts POST with JSON { token?: string } or Authorization: Bearer <jwt>
// Returns: { user_id, verification_level, profile, success }
// Writes audit row to deafauth.token_verification_audit
// Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables

import { createHash } from "node:crypto";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

function sha256hex(input: string) {
  const hash = createHash("sha256").update(input, "utf8").digest("hex");
  return hash;
}

async function fetchFromTable(table: string, filter: string) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase REST error (${res.status}): ${txt}`);
  }
  return res.json();
}

async function supabaseRpc(sql: string, params: any[] = []) {
  // Minimal helper using Postgres RPC via REST: use the Postgres REST endpoint (/rest/v1/rpc) is not ideal for raw SQL.
  // We'll call the Postgres via the SQL API: /rest/v1/rpc is limited. Instead we'll call the Supabase "SQL" REST endpoint:
  const url = `${SUPABASE_URL}/rest/v1/rpc`;
  // Not used here; prefer direct Postgres via service key using Postgres client in Edge is not available.
  // We'll use the Admin REST endpoint to query tables directly via supabase REST (table endpoints).
  // For simplicity below we'll call table endpoints directly.
  throw new Error("supabaseRpc unsupported in this minimal example");
}

async function insertAudit(audit: Record<string, any>) {
  const url = `${SUPABASE_URL}/rest/v1/deafauth.token_verification_audit`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(audit),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.warn("Unable to write audit:", res.status, txt);
  }
}

function constantTimeCompare(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

Deno.serve(async (req: Request) => {
  try {
    const ip = req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") || null;
    const ua = req.headers.get("user-agent") || null;

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "POST only" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("authorization") || "";
    const body = await req.json().catch(() => ({}));
    const token = (body && body.token) ? String(body.token) : null;

    // 1) Portable token path (preferred if token provided)
    if (token) {
      const tokenHash = sha256hex(token); // match storage scheme; adjust if you use bcrypt or HMAC
      // Query portable_identity_tokens where token_hash = tokenHash and is_revoked = false and expires_at > now()
      const rows = await fetchFromTable(
        "deafauth.portable_identity_tokens",
        `token_hash=eq.${
          encodeURIComponent(tokenHash)
        }&is_revoked=eq.false&expires_at=gt.${new Date().toISOString()}`,
      );
      const found = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

      if (found) {
        // fetch public profile for the user (view)
        const userId = found.user_id;
        const profiles = await fetchFromTable(
          "deafauth.public_profile",
          `deafauth_user_id=eq.${userId}`,
        );
        const profile = Array.isArray(profiles) && profiles.length > 0
          ? profiles[0]
          : null;

        // mark token as revoked (best-effort) — PATCH portable_identity_tokens set is_revoked=true
        const revokeRes = await fetch(
          `${SUPABASE_URL}/rest/v1/deafauth.portable_identity_tokens?id=eq.${found.id}`,
          {
            method: "PATCH",
            headers: {
              apikey: SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify({ is_revoked: true }),
          },
        ).catch(() => null);

        // write audit
        await insertAudit({
          user_id: userId,
          token_id: found.id,
          method: "portable_token",
          ip,
          user_agent: ua,
          success: true,
          reason: null,
        });

        return new Response(JSON.stringify({
          user_id: userId,
          verification_level: profile?.verification_level ?? null,
          profile,
          success: true,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await insertAudit({
          user_id: null,
          token_id: null,
          method: "portable_token",
          ip,
          user_agent: ua,
          success: false,
          reason: "token_not_found_or_expired_or_revoked",
        });
        return new Response(
          JSON.stringify({
            error: "Invalid or expired token",
            success: false,
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    // 2) JWT path — Authorization: Bearer <jwt>
    if (authHeader.startsWith("Bearer ")) {
      const jwt = authHeader.slice("Bearer ".length).trim();
      // Validate token by hitting the Supabase Admin endpoint: /auth/v1/user (or use /rpc if you have a function)
      // Supabase provides an endpoint /auth/v1/admin to retrieve user with service key. We'll call /auth/v1/user
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
        },
      });

      if (!authRes.ok) {
        await insertAudit({
          user_id: null,
          token_id: null,
          method: "jwt",
          ip,
          user_agent: ua,
          success: false,
          reason: `jwt_invalid_${authRes.status}`,
        });
        return new Response(JSON.stringify({ error: "Invalid JWT" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const authUser = await authRes.json(); // contains id (sub) and user metadata
      const authUserId = authUser?.id || authUser?.sub || null;

      // Map to deafauth user via foreign key associations: query deafauth.user_profiles or deafauth.users
      const profileRows = await fetchFromTable(
        "deafauth.public_profile",
        `auth_user_id=eq.${authUserId}`,
      );
      const profile = Array.isArray(profileRows) && profileRows.length > 0
        ? profileRows[0]
        : null;

      await insertAudit({
        user_id: profile?.deafauth_user_id ?? null,
        token_id: null,
        method: "jwt",
        ip,
        user_agent: ua,
        success: true,
        reason: null,
      });

      return new Response(JSON.stringify({
        user_id: profile?.deafauth_user_id ?? null,
        verification_level: profile?.verification_level ?? null,
        profile,
        success: true,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // No token or jwt provided
    return new Response(
      JSON.stringify({ error: "No token or Authorization header provided" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "internal_error", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
