import type { z } from "zod";
import { ApiError } from "./errors";

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>
) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(400, "INVALID_INPUT", "Invalid request payload.");
  }

  return parsed.data;
}

export function parseSearchParams<T>(
  url: URL,
  schema: z.ZodType<T>
) {
  const input: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    input[key] = value;
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid query parameters.");
  }

  return parsed.data;
}

export function parseRouteParams<T>(
  params: Record<string, string | undefined>,
  schema: z.ZodType<T>
) {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw new ApiError(400, "INVALID_ROUTE_PARAMS", "Invalid route parameters.");
  }

  return parsed.data;
}
