# Audit Log

This file contains an append-only history of repository and operational activities.
Entries are added automatically by the GitHub Actions workflow `.github/workflows/audit-log.yml`
and can also be added manually via workflow dispatch (useful for DB migrations, Edge Function deployments, etc).

Format:
- Timestamp (UTC)
- Actor (GitHub login)
- Trigger (push / merge / manual)
- Branch
- Commit SHA
- PR number (if applicable)
- Changed files summary
- Message / Note

---

## Recent entries

- 2026-02-13T00:00:00Z — user: deploy-bot — trigger: manual — branch: master — commit: abcdef1 — PR: N/A  
  changed_files: ["migrations/20260213_create_users.sql"]  
  message: Deployed DB migration — create users table.

- 2026-02-12T18:31:22Z — user: alice — trigger: push — branch: feature/add-edge-fn — commit: 1234abc — PR: N/A  
  changed_files: ["functions/send-notif/index.ts", "README.md"]  
  message: Add Edge Function for notifications.

---
