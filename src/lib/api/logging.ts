export function logApiError(request: Request, error: unknown) {
  const safe = {
    method: request.method,
    pathname: new URL(request.url).pathname
  };

  if (error instanceof Error) {
    console.error("[api-error]", safe, {
      name: error.name,
      message: error.message
    });
    return;
  }

  console.error("[api-error]", safe, { error: "Unknown error" });
}
