/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly CONTACT_WEBHOOK_URL?: string;
  readonly GITHUB_OAUTH_CLIENT_ID?: string;
  readonly GITHUB_OAUTH_CLIENT_SECRET?: string;
  readonly GITHUB_OAUTH_SCOPE?: string;
  readonly ADMIN_SESSION_SECRET?: string;
  readonly ADMIN_GITHUB_LOGINS?: string;
  readonly ADMIN_LOCAL_LOGIN?: string;
  readonly ADMIN_LOCAL_LOGIN_USERNAME?: string;
  readonly ADMIN_LOCAL_LOGIN_NAME?: string;
  readonly ADMIN_LOCAL_LOGIN_AVATAR_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    runtime?: {
      env?: Record<string, unknown>;
    };
  }
}

declare const process: {
  cwd(): string;
  env: Record<string, string | undefined>;
};

declare module "node:fs";
declare module "node:fs/promises";
declare module "node:path";
declare module "node:sqlite";
