import type { APIRoute } from "astro";
import { z } from "zod";
import { withAdminApi } from "../../../../../lib/api/middleware";
import {
  deleteAdminPost,
  updateAdminPost
} from "../../../../../lib/api/repositories/content";
import { parseJsonBody, parseRouteParams } from "../../../../../lib/api/validation";
import { jsonResponse } from "../../../../../lib/api/http";

const paramsSchema = z.object({
  id: z.uuid()
});

const patchSchema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(400),
  body: z.string().min(1),
  status: z.enum(["draft", "published"]),
  visibility: z.enum(["public", "private"]).default("public"),
  publishedAt: z.iso.datetime(),
  tags: z.array(z.string().min(1).max(50)).max(20).default([])
});

export const PATCH: APIRoute = withAdminApi(async (context) => {
  const params = parseRouteParams(context.params, paramsSchema);
  const input = await parseJsonBody(context.request, patchSchema);
  await updateAdminPost(context.runtimeBindings.db, params.id, input);
  return jsonResponse({ data: { id: params.id } });
});

export const DELETE: APIRoute = withAdminApi(async (context) => {
  const params = parseRouteParams(context.params, paramsSchema);
  await deleteAdminPost(context.runtimeBindings.db, params.id);
  return jsonResponse({ data: { id: params.id } });
});
