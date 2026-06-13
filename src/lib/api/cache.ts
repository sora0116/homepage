import { jsonResponse } from "./http";

function cacheStore(): Cache {
  return (caches as unknown as { default: Cache }).default;
}

export async function getCachedJson(request: Request) {
  const cached = await cacheStore().match(request);
  return cached || null;
}

export async function putCachedJson(
  request: Request,
  payload: unknown,
  ttlSeconds: number,
  waitUntil?: ((promise: Promise<unknown>) => void) | null
) {
  const response = jsonResponse(payload, {
    headers: {
      "Cache-Control": `public, max-age=${ttlSeconds}`
    }
  });
  const store = cacheStore().put(request, response.clone());
  if (waitUntil) {
    waitUntil(store);
  } else {
    await store;
  }
  return response;
}
