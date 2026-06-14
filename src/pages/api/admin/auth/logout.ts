import type { APIRoute } from "astro";
import { clearAdminSessionCookie } from "../../../../lib/admin-auth";
import { shouldUseSecureCookies } from "../../../../lib/oauth";

export const GET: APIRoute = async ({ request }) => {
  const headers = new Headers({
    Location: "/admin"
  });
  headers.append("set-cookie", clearAdminSessionCookie(shouldUseSecureCookies(request)));
  return new Response(null, {
    status: 302,
    headers
  });
};
