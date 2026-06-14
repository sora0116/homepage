import type { APIRoute } from "astro";
import {
  getMediaBucket,
  guessContentType
} from "../../lib/media-storage";

export const GET: APIRoute = async ({ params, locals }) => {
  const rawKey = params.key?.trim();
  if (!rawKey) {
    return new Response("Not found", { status: 404 });
  }

  const bucket = getMediaBucket(locals);
  if (!bucket) {
    return new Response("Storage unavailable", { status: 503 });
  }

  const key = rawKey
    .split("/")
    .map((segment) => decodeURIComponent(segment))
    .join("/");
  const object = await bucket.get(key);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  headers.set(
    "content-type",
    object.httpMetadata?.contentType || guessContentType(key)
  );
  headers.set(
    "cache-control",
    object.httpMetadata?.cacheControl || "public, max-age=31536000, immutable"
  );
  if (object.httpMetadata?.contentDisposition) {
    headers.set("content-disposition", object.httpMetadata.contentDisposition);
  }

  return new Response(object.body ?? (await object.arrayBuffer()), { headers });
};
