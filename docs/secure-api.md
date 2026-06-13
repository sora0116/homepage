# Secure API

## Directory Structure

```text
src/
  lib/
    api/
      auth.ts
      cache.ts
      errors.ts
      http.ts
      logging.ts
      middleware.ts
      rate-limit.ts
      runtime.ts
      validation.ts
      repositories/
        content.ts
  pages/
    api/
      v1/
        public/
          posts.ts
          posts/[slug].ts
          profile.ts
        admin/
          posts.ts
          posts/[id].ts
db/
  schema.sql
wrangler.toml.example
```

## Design Intent

- D1 access is only through the Worker binding `DB`.
- Public APIs use Cache API first, then D1 on miss.
- Admin APIs require session authentication and rate limiting before validation and DB work.
- All D1 queries use prepared statements with `bind()`.
- Pagination is mandatory and capped at `20`.

## Deploy

1. Configure `DB` as a D1 binding.
2. Configure rate limit bindings:
   - `PUBLIC_API_RATE_LIMITER`
   - `ADMIN_API_RATE_LIMITER`
3. Apply schema:
   - `npx wrangler d1 execute homepage-db --remote --file=db/schema.sql`
4. Deploy with the existing `wrangler.jsonc`, or mirror the same values from `wrangler.toml.example`.

## Security Notes

- Do not expose Cloudflare API tokens, OAuth secrets, cookies, or session material in logs.
- Keep `ADMIN_SESSION_SECRET` in runtime secrets.
- Public cache TTL is intentionally short to reduce stale content while still avoiding unnecessary D1 reads.
- Admin APIs return `401` when the session is missing or invalid, `400` for validation failures, `429` for rate limit failures, and `500` only for unexpected errors.
