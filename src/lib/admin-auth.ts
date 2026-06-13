import { clearCookie, createCookie, createRandomString, getCookieValue } from "./oauth";
import { getRuntimeEnv } from "./runtime-env";

const ADMIN_SESSION_COOKIE = "admin_session";
const OAUTH_STATE_COOKIE = "admin_oauth_state";
const OAUTH_VERIFIER_COOKIE = "admin_oauth_verifier";

type RuntimeLocals = {
  runtime?: {
    env?: Record<string, unknown>;
  };
};

export interface AdminSession {
  login: string;
  name: string;
  avatarUrl: string;
  exp: number;
}

function encodeBase64Url(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(normalized + padding);
}

async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  let binary = "";
  for (const byte of new Uint8Array(signature)) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getSessionSecret(locals: RuntimeLocals | undefined) {
  return (
    getRuntimeEnv(locals, "ADMIN_SESSION_SECRET") ||
    getRuntimeEnv(locals, "GITHUB_OAUTH_CLIENT_SECRET")
  );
}

export function createOAuthCookies() {
  const state = createRandomString();
  const verifier = createRandomString(48);
  const headers = new Headers();
  headers.append("set-cookie", createCookie(OAUTH_STATE_COOKIE, state, { maxAge: 600 }));
  headers.append(
    "set-cookie",
    createCookie(OAUTH_VERIFIER_COOKIE, verifier, { maxAge: 600 })
  );
  return { state, verifier, headers };
}

export function clearOAuthCookies(headers: Headers) {
  headers.append("set-cookie", clearCookie(OAUTH_STATE_COOKIE));
  headers.append("set-cookie", clearCookie(OAUTH_VERIFIER_COOKIE));
}

export function readOAuthCookies(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  return {
    state: getCookieValue(cookieHeader, OAUTH_STATE_COOKIE),
    verifier: getCookieValue(cookieHeader, OAUTH_VERIFIER_COOKIE)
  };
}

export function getAllowedAdminLogins(locals: RuntimeLocals | undefined) {
  const configured = getRuntimeEnv(locals, "ADMIN_GITHUB_LOGINS");
  return (configured || "sora0116")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function createAdminSessionCookie(
  locals: RuntimeLocals | undefined,
  session: Omit<AdminSession, "exp">
) {
  const secret = getSessionSecret(locals);
  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET");
  }

  const payload: AdminSession = {
    ...session,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = await sign(encodedPayload, secret);
  return createCookie(ADMIN_SESSION_COOKIE, `${encodedPayload}.${signature}`, {
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function getAdminSession(
  locals: RuntimeLocals | undefined,
  request: Request
) {
  const secret = getSessionSecret(locals);
  const raw = getCookieValue(request.headers.get("cookie"), ADMIN_SESSION_COOKIE);
  if (!secret || !raw) {
    return null;
  }

  const [encodedPayload, signature] = raw.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expected = await sign(encodedPayload, secret);
  if (expected !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as AdminSession;
    if (payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function requireAdminSession(
  locals: RuntimeLocals | undefined,
  request: Request
) {
  const session = await getAdminSession(locals, request);
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export function clearAdminSessionCookie() {
  return clearCookie(ADMIN_SESSION_COOKIE);
}
