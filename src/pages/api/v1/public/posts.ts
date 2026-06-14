import type { APIRoute } from "astro";
import { z } from "zod";
import { hasCloudflareAccess } from "../../../../lib/cloudflare-access";
import { withPublicApi } from "../../../../lib/api/middleware";
import { getCachedJson, putCachedJson } from "../../../../lib/api/cache";
import { parseSearchParams } from "../../../../lib/api/validation";
import { listPublicPosts } from "../../../../lib/api/repositories/content";
import { jsonResponse, noStoreHeaders } from "../../../../lib/api/http";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(20)
});

export const GET: APIRoute = withPublicApi(async (context) => {
  const url = new URL(context.request.url);
  const query = parseSearchParams(url, querySchema);
  const includePrivate = hasCloudflareAccess(context.request);
  if (includePrivate) {
    const items = await listPublicPosts(context.runtimeBindings.db, {
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
      includePrivate: true
    });
    return jsonResponse(
      {
        data: items,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          returned: items.length
        }
      },
      { headers: noStoreHeaders() }
    );
  }

  const cacheKey = new Request(url.toString(), context.request);
  const cached = await getCachedJson(cacheKey);
  if (cached) {
    return cached;
  }

  const items = await listPublicPosts(context.runtimeBindings.db, {
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
    includePrivate: false
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
