type RuntimeLocals = {
  runtime?: {
    env?: Record<string, unknown>;
    ctx?: {
      waitUntil?: (promise: Promise<unknown>) => void;
    };
  };
};

export interface RateLimitBindingLike {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface D1StatementLike {
  bind: (...values: unknown[]) => {
    all: <T>() => Promise<{ results?: T[] }>;
    first: <T>() => Promise<T | null>;
    run: () => Promise<unknown>;
  };
}

export interface D1DatabaseLike {
  prepare(query: string): D1StatementLike;
}

export interface ApiRuntime {
  db: D1DatabaseLike | null;
  publicRateLimiter: RateLimitBindingLike | null;
  adminRateLimiter: RateLimitBindingLike | null;
  waitUntil: ((promise: Promise<unknown>) => void) | null;
}

export function getApiRuntime(locals: RuntimeLocals | undefined): ApiRuntime {
  return {
    db:
      locals?.runtime?.env?.DB && typeof locals.runtime.env.DB === "object"
        ? (locals.runtime.env.DB as D1DatabaseLike)
        : null,
    publicRateLimiter:
      locals?.runtime?.env?.PUBLIC_API_RATE_LIMITER &&
      typeof locals.runtime.env.PUBLIC_API_RATE_LIMITER === "object"
        ? (locals.runtime.env.PUBLIC_API_RATE_LIMITER as RateLimitBindingLike)
        : null,
    adminRateLimiter:
      locals?.runtime?.env?.ADMIN_API_RATE_LIMITER &&
      typeof locals.runtime.env.ADMIN_API_RATE_LIMITER === "object"
        ? (locals.runtime.env.ADMIN_API_RATE_LIMITER as RateLimitBindingLike)
        : null,
    waitUntil: locals?.runtime?.ctx?.waitUntil || null
  };
}
