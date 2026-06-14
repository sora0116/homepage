export function hasCloudflareAccess(request: Request) {
  return Boolean(
    request.headers.get("cf-access-authenticated-user-email") ||
      request.headers.get("cf-access-jwt-assertion")
  );
}
