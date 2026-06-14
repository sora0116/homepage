import type { APIRoute } from "astro";
import { z } from "zod";
import { withAdminApi } from "../../../../lib/api/middleware";
import {
  createAdminPost,
  listAdminPosts
} from "../../../../lib/api/repositories/content";
import { parseJsonBody, parseSearchParams } from "../../../../lib/api/validation";
import { jsonResponse } from "../../../../lib/api/http";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(20)
});

const postSchema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(400),
  body: z.string().min(1),
  status: z.enum(["draft", "published"]),
  visibility: z.enum(["public", "private"]).default("public"),
  publishedAt: z.iso.datetime(),
  tags: z.array(z.string().min(1).max(50)).max(20).default([])
});

export const GET: APIRoute = withAdminApi(async (context) => {
  const query = parseSearchParams(new URL(context.request.url), querySchema);
  const items = await listAdminPosts(context.runtimeBindings.db, {
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize
  });
  return jsonResponse({
    data: items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      returned: items.length
    }
  });
});

export const POST: APIRoute = withAdminApi(async (context) => {
  const input = await parseJsonBody(context.request, postSchema);
  const created = await createAdminPost(context.runtimeBindings.db, input);
  return jsonResponse({ data: created }, { status: 201 });
});
