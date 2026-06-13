import type { APIRoute } from "astro";
import { z } from "zod";
import { withPublicApi } from "../../../../lib/api/middleware";
import { getCachedJson, putCachedJson } from "../../../../lib/api/cache";
import { parseSearchParams } from "../../../../lib/api/validation";
import { listPublicPosts } from "../../../../lib/api/repositories/content";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(20)
});

export const GET: APIRoute = withPublicApi(async (context) => {
  const url = new URL(context.request.url);
  const query = parseSearchParams(url, querySchema);
  const cacheKey = new Request(url.toString(), context.request);
  const cached = await getCachedJson(cacheKey);
  if (cached) {
    return cached;
  }

  const items = await listPublicPosts(context.runtimeBindings.db, {
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize
  });
  const payload = {
    data: items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      returned: items.length
    }
  };

  return putCachedJson(
    cacheKey,
    payload,
    120,
    context.runtimeBindings.waitUntil
  );
});
