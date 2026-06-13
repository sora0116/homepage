/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly CONTACT_WEBHOOK_URL?: string;
  readonly GITHUB_OAUTH_CLIENT_ID?: string;
  readonly GITHUB_OAUTH_CLIENT_SECRET?: string;
  readonly GITHUB_OAUTH_SCOPE?: string;
  readonly ADMIN_SESSION_SECRET?: string;
  readonly ADMIN_GITHUB_LOGINS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
