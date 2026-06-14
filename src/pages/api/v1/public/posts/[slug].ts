import type { APIRoute } from "astro";
import { z } from "zod";
import { hasCloudflareAccess } from "../../../../../lib/cloudflare-access";
import { withPublicApi } from "../../../../../lib/api/middleware";
import { getCachedJson, putCachedJson } from "../../../../../lib/api/cache";
import { parseRouteParams } from "../../../../../lib/api/validation";
import { getPublicPostBySlug } from "../../../../../lib/api/repositories/content";
import { jsonResponse, noStoreHeaders } from "../../../../../lib/api/http";

const paramsSchema = z.object({
  slug: z.string().min(1).max(120)
});

export const GET: APIRoute = withPublicApi(async (context) => {
  const params = parseRouteParams(context.params, paramsSchema);
  const includePrivate = hasCloudflareAccess(context.request);
  if (includePrivate) {
    const post = await getPublicPostBySlug(context.runtimeBindings.db, params.slug, {
      includePrivate: true
    });
    return jsonResponse({ data: post }, { headers: noStoreHeaders() });
  }

  const cacheKey = new Request(context.request.url, context.request);
  const cached = await getCachedJson(cacheKey);
  if (cached) {
    return cached;
  }

  const post = await getPublicPostBySlug(
    context.runtimeBindings.db,
    params.slug,
    { includePrivate: false }
  );

  return putCachedJson(
    cacheKey,
    { data: post },
    300,
    context.runtimeBindings.waitUntil
  );
});
