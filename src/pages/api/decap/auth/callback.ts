import type { APIRoute } from "astro";
import {
  clearCookie,
  getCookieValue
} from "../../../../lib/oauth";

const STATE_COOKIE = "decap_oauth_state";
const VERIFIER_COOKIE = "decap_oauth_verifier";

function renderMessage(kind: "success" | "error", payload: Record<string, string>) {
  const message = `authorization:github:${kind}:${JSON.stringify(payload)}`;
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>Authentication complete</title>
  </head>
  <body>
    <script>
      const message = ${JSON.stringify(message)};
      const target = window.location.origin;
      if (window.opener) {
        window.opener.postMessage(message, target);
      }
      window.close();
    </script>
    <p>認証結果を送信しました。このウィンドウは閉じて構いません。</p>
  </body>
</html>`;
}

function html(body: string, clear = false) {
  const headers = new Headers({
    "content-type": "text/html; charset=utf-8"
  });

  if (clear) {
    headers.append("set-cookie", clearCookie(STATE_COOKIE));
    headers.append("set-cookie", clearCookie(VERIFIER_COOKIE));
  }

  return new Response(body, { headers });
}

export const GET: APIRoute = async ({ request, url }) => {
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");
  const cookieHeader = request.headers.get("cookie");
  const storedState = getCookieValue(cookieHeader, STATE_COOKIE);
  const codeVerifier = getCookieValue(cookieHeader, VERIFIER_COOKIE);

  if (error) {
    return html(
      renderMessage("error", {
        message: errorDescription || error
      }),
      true
    );
  }

  if (!state || !code || !storedState || state !== storedState || !codeVerifier) {
    return html(
      renderMessage("error", {
        message: "Invalid OAuth state"
      }),
      true
    );
  }

  const clientId = import.meta.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return html(
      renderMessage("error", {
        message: "Missing GitHub OAuth configuration"
      }),
      true
    );
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${url.origin}/api/decap/auth/callback`,
      code_verifier: codeVerifier
    })
  });

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenResponse.ok || !tokenData.access_token) {
    return html(
      renderMessage("error", {
        message:
          tokenData.error_description || tokenData.error || "Token exchange failed"
      }),
      true
    );
  }

  return html(
    renderMessage("success", {
      token: tokenData.access_token
    }),
    true
  );
};
