import type { APIRoute } from "astro";
import { isApiError } from "./errors";
import { noStoreHeaders, jsonResponse } from "./http";
import { logApiError } from "./logging";
import { requireAdminApiAuth } from "./auth";
import { enforceRateLimit } from "./rate-limit";
import { getApiRuntime } from "./runtime";

type ApiContext = Parameters<Exclude<APIRoute, undefined>>[0];

export interface SecureApiContext extends ApiContext {
  runtimeBindings: ReturnType<typeof getApiRuntime>;
}

type Handler = (context: SecureApiContext) => Promise<Response>;

function clientIp(request: Request) {
  return request.headers.get("cf-connecting-ip") || "unknown";
}

export function withPublicApi(handler: Handler): APIRoute {
  return async (context) => {
    const runtimeBindings = getApiRuntime(context.locals);
    try {
      await enforceRateLimit(
        runtimeBindings.publicRateLimiter,
        `${clientIp(context.request)}:${new URL(context.request.url).pathname}`
      );
      return await handler({ ...context, runtimeBindings });
    } catch (error) {
      if (isApiError(error)) {
        return jsonResponse(
          {
            error: {
              code: error.code,
              message: error.message
            }
          },
          {
            status: error.status,
            headers: noStoreHeaders()
          }
        );
      }
      logApiError(context.request, error);
      return jsonResponse(
        { error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } },
        { status: 500, headers: noStoreHeaders() }
      );
    }
  };
}

export function withAdminApi(
  handler: Handler,
  options: { requireAuth?: boolean } = { requireAuth: true }
): APIRoute {
  return async (context) => {
    const runtimeBindings = getApiRuntime(context.locals);
    try {
      await enforceRateLimit(
        runtimeBindings.adminRateLimiter,
        `${clientIp(context.request)}:${new URL(context.request.url).pathname}`
      );

      if (options.requireAuth !== false) {
        await requireAdminApiAuth(context.locals, context.request);
      }

      return await handler({ ...context, runtimeBindings });
    } catch (error) {
      if (isApiError(error)) {
        return jsonResponse(
          {
            error: {
              code: error.code,
              message: error.message
            }
          },
          {
            status: error.status,
            headers: noStoreHeaders()
          }
        );
      }
      logApiError(context.request, error);
      return jsonResponse(
        { error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } },
        { status: 500, headers: noStoreHeaders() }
      );
    }
  };
}
