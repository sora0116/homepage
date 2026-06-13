import type { APIRoute } from "astro";
import { createCodeChallenge, createCookie, createRandomString } from "../../../lib/oauth";
import { getRuntimeEnv } from "../../../lib/runtime-env";

const STATE_COOKIE = "decap_oauth_state";
const VERIFIER_COOKIE = "decap_oauth_verifier";

function html(body: string) {
  return new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}

export const GET: APIRoute = async ({ url, locals }) => {
  const provider = url.searchParams.get("provider");
  if (provider !== "github") {
    return html("<p>Unsupported provider.</p>");
  }

  const clientId = getRuntimeEnv(locals, "GITHUB_OAUTH_CLIENT_ID");
  if (!clientId) {
    return html("<p>Missing GITHUB_OAUTH_CLIENT_ID.</p>");
  }

  const state = createRandomString();
  const verifier = createRandomString(48);
  const challenge = await createCodeChallenge(verifier);
  const redirectUri = `${url.origin}/api/decap/auth/callback`;
  const scope = getRuntimeEnv(locals, "GITHUB_OAUTH_SCOPE") || "public_repo";
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");

  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const body = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>GitHub Authentication</title>
  </head>
  <body>
    <p>GitHub 認証へ移動しています。</p>
    <script>
      const message = "authorizing:github";
      const target = window.location.origin;
      function begin(event) {
        if (event.origin !== target || event.data !== message) return;
        window.removeEventListener("message", begin);
        window.location.replace(${JSON.stringify(authorizeUrl.toString())});
      }
      window.addEventListener("message", begin);
      if (window.opener) {
        window.opener.postMessage(message, target);
      }
    </script>
  </body>
</html>`;

  const headers = new Headers({
    "content-type": "text/html; charset=utf-8"
  });
  headers.append("set-cookie", createCookie(STATE_COOKIE, state, { maxAge: 600 }));
  headers.append(
    "set-cookie",
    createCookie(VERIFIER_COOKIE, verifier, { maxAge: 600 })
  );

  return new Response(body, { headers });
};
