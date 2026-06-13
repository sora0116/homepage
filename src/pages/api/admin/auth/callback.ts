import type { APIRoute } from "astro";
import {
  clearOAuthCookies,
  createAdminSessionCookie,
  getAllowedAdminLogins,
  readOAuthCookies
} from "../../../../lib/admin-auth";
import { getRuntimeEnv } from "../../../../lib/runtime-env";

type GitHubUser = {
  login: string;
  name?: string;
  avatar_url?: string;
};

function redirect(location: string, headers = new Headers()) {
  headers.set("Location", location);
  return new Response(null, { status: 302, headers });
}

export const GET: APIRoute = async ({ request, url, locals }) => {
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const oauth = readOAuthCookies(request);
  const headers = new Headers();
  clearOAuthCookies(headers);

  if (error) {
    return redirect("/admin?error=unauthorized", headers);
  }

  if (!state || !code || !oauth.state || !oauth.verifier || oauth.state !== state) {
    return redirect("/admin?error=unauthorized", headers);
  }

  const clientId = getRuntimeEnv(locals, "GITHUB_OAUTH_CLIENT_ID");
  const clientSecret = getRuntimeEnv(locals, "GITHUB_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    return redirect("/admin?error=unauthorized", headers);
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
      redirect_uri: `${url.origin}/api/admin/auth/callback`,
      code_verifier: oauth.verifier
    })
  });

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenResponse.ok || !tokenData.access_token) {
    return redirect("/admin?error=unauthorized", headers);
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      authorization: `Bearer ${tokenData.access_token}`,
      accept: "application/vnd.github+json",
      "user-agent": "homepage-admin"
    }
  });
  const user = (await userResponse.json()) as GitHubUser;
  if (!userResponse.ok || !user.login) {
    return redirect("/admin?error=unauthorized", headers);
  }

  const allowed = getAllowedAdminLogins(locals);
  if (!allowed.includes(user.login)) {
    return redirect("/admin?error=forbidden", headers);
  }

  headers.append(
    "set-cookie",
    await createAdminSessionCookie(locals, {
      login: user.login,
      name: user.name || user.login,
      avatarUrl: user.avatar_url || ""
    })
  );
  return redirect("/admin?status=login", headers);
};
