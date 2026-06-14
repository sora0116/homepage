import type { APIRoute } from "astro";
import { createCodeChallenge, shouldUseSecureCookies } from "../../../../lib/oauth";
import {
  createAdminSessionCookie,
  createOAuthCookies,
  getLocalAdminIdentity,
  isLocalAdminLoginEnabled
} from "../../../../lib/admin-auth";
import { getRuntimeEnv } from "../../../../lib/runtime-env";

export const GET: APIRoute = async ({ request, url, locals }) => {
  const useSecureCookies = shouldUseSecureCookies(request);
  if (isLocalAdminLoginEnabled(locals)) {
    const headers = new Headers();
    headers.append(
      "set-cookie",
      await createAdminSessionCookie(locals, getLocalAdminIdentity(locals), useSecureCookies)
    );
    headers.set("Location", "/admin?status=login");
    return new Response(null, { status: 302, headers });
  }

  const clientId = getRuntimeEnv(locals, "GITHUB_OAUTH_CLIENT_ID");
  if (!clientId) {
    return new Response("Missing GITHUB_OAUTH_CLIENT_ID", { status: 500 });
  }

  const { state, verifier, headers } = createOAuthCookies(useSecureCookies);
  const challenge = await createCodeChallenge(verifier);
  const scope = getRuntimeEnv(locals, "GITHUB_OAUTH_SCOPE") || "public_repo";
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");

  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set(
    "redirect_uri",
    `${url.origin}/api/admin/auth/callback`
  );
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  headers.set("Location", authorizeUrl.toString());
  return new Response(null, {
    status: 302,
    headers
  });
};
