import type { APIRoute } from "astro";
import { clearAdminSessionCookie } from "../../../../lib/admin-auth";

export const GET: APIRoute = async () => {
  const headers = new Headers({
    Location: "/admin"
  });
  headers.append("set-cookie", clearAdminSessionCookie());
  return new Response(null, {
    status: 302,
    headers
  });
};
