export function jsonResponse(
  data: unknown,
  init: ResponseInit = {}
) {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }
  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

export function noStoreHeaders() {
  return {
    "Cache-Control": "no-store"
  };
}
