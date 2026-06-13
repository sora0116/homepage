import type { APIRoute } from "astro";
import { withPublicApi } from "../../../../lib/api/middleware";
import { getCachedJson, putCachedJson } from "../../../../lib/api/cache";
import { getPublicProfile } from "../../../../lib/api/repositories/content";

export const GET: APIRoute = withPublicApi(async (context) => {
  const cacheKey = new Request(context.request.url, context.request);
  const cached = await getCachedJson(cacheKey);
  if (cached) {
    return cached;
  }

  const profile = await getPublicProfile(context.runtimeBindings.db);
  return putCachedJson(
    cacheKey,
    { data: profile },
    180,
    context.runtimeBindings.waitUntil
  );
});
