## [LRN-20260702-001] knowledge_gap

**Logged**: 2026-07-02T13:10:00Z
**Priority**: high
**Status**: pending
**Area**: config

### Summary
Next.js 16 replaced `middleware.ts` with `proxy.ts`. The middleware file convention (`src/middleware.ts`) is deprecated and conflicts with `src/proxy.ts`.

### Details
When creating `src/middleware.ts` alongside existing `src/proxy.ts`, Next.js 16 throws: "Both middleware file './src/middleware.ts' and proxy file './src/proxy.ts' are detected. Please use './src/proxy.ts' only." The `src/proxy.ts` file IS the middleware in Next.js 16 and is compiled as "proxy" (visible in logs: "○ Compiling proxy ...").

### Metadata
- Source: error
- Related Files: src/proxy.ts
- Tags: nextjs, middleware

---

## [LRN-20260702-002] best_practice

**Logged**: 2026-07-02T13:10:00Z
**Priority**: high
**Status**: pending
**Area**: frontend

### Summary
LobeHub local development: use `bun run dev` (full-stack) and access via `localhost:9876/admin`. The Vite dev server proxies API calls to Next.js on port 3010. Auth pages (`/signin`) are proxied via Vite proxy rules to Next.js, which uses middleware (`src/proxy.ts`) to rewrite to the auth SPA (`/spa-auth/[locale]/...`).

### Details
- `bun run dev:spa` (9876 alone): works for main SPA UI, no auth pages
- `bun run dev` (full-stack 3010+9876): auth pages available via Vite proxy
- Debug Proxy URL (`app.lobehub.com/_dangerous_local_dev_proxy`) is NOT needed for local-only development
- Required Vite proxy rules for: `/signin`, `/signup`, `/verify-email`, `/reset-password`, `/auth-error`, `/oauth`, `/market-auth-callback`, `/verify-im`, `/verify/`
- Required middleware matcher additions: `/admin(.*)`

### Metadata
- Source: investigation
- Related Files: vite.config.ts, src/proxy.ts
- Tags: dev-setup, local-dev

---

## [LRN-20260702-003] insight

**Logged**: 2026-07-02T13:10:00Z
**Priority**: high
**Status**: pending
**Area**: backend

### Summary
OpenAPI `/api/v1/*` endpoints authenticate via API Key (Bearer token) or OIDC JWT, NOT via session cookies. tRPC routes use Better Auth session cookies.

### Details
The `userAuthMiddleware` in `packages/openapi/src/middleware/auth.ts` supports:
1. Bearer token with API Key format (`sk-lh-xxxxxxxxxxxxxxxx`) — validates against DB
2. Bearer token with OIDC JWT — validates OIDC token
3. Dev debug mode: `lobe-auth-dev-backend-api: 1` header + `MOCK_DEV_USER_ID` env var

For local development, the admin service (`src/services/admin/base.ts`) sends `lobe-auth-dev-backend-api: 1` header and the env var `MOCK_DEV_USER_ID` must be set to a real super_admin user's database ID for permission checks to pass.

### Metadata
- Source: investigation
- Related Files: packages/openapi/src/middleware/auth.ts, .env.development.local
- Tags: openapi, auth, api-key

---

## [LRN-20260702-004] insight

**Logged**: 2026-07-02T13:10:00Z
**Priority**: medium
**Status**: pending
**Area**: frontend

### Summary
OpenAPI admin endpoints return data in a nested format: `{ data: { <items>: [...], total: N }, message, success, timestamp }`. The items key varies by endpoint (`users`, `roles`, `permissions`).

### Details
- List endpoints: `response.data.<items>` (e.g., `response.data.users`, `response.data.roles`)
- User roles endpoint (`/api/v1/users/:id/roles`): `response.data` is an array directly, each item has `roleId`, `roleName`, `roleDisplayName`, etc.
- The admin service layer initial implementation incorrectly assumed `response.data` would be the array directly.

### Metadata
- Source: debug
- Related Files: src/features/Admin/Users/UserList.tsx, src/features/Admin/Roles/RoleList.tsx, src/features/Admin/Users/UserRolePanel.tsx
- Tags: api-format, data-binding

---

## [LRN-20260702-005] best_practice

**Logged**: 2026-07-02T13:10:00Z
**Priority**: medium
**Status**: pending
**Area**: config

### Summary
PostgreSQL runs via Docker in the lobe-postgres container. Default password is in `docker-compose/dev/.env` (`POSTGRES_PASSWORD=lobe_dev_2024`), NOT in `.env.local` (`change_this_password_on_production`).

### Details
- Docker compose: `docker-compose/dev/docker-compose.yml` with `paradedb/paradedb:latest-pg17`
- DB name: `lobechat`
- Admin user roles are seeded via `scripts/init-system-roles.ts` with hardcoded email `903164524@qq.com`
- Super_admin role ID is `rbac_super_admin_role`

### Metadata
- Source: investigation
- Related Files: docker-compose/dev/docker-compose.yml, docker-compose/dev/.env, .env.local
- Tags: database, docker, postgresql
