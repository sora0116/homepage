import { ApiError } from "./errors";
import type { RateLimitBindingLike } from "./runtime";

export async function enforceRateLimit(
  binding: RateLimitBindingLike | null,
  key: string
) {
  if (!binding) {
    throw new ApiError(500, "RATE_LIMIT_BINDING_MISSING", "Rate limiter is not configured.");
  }

  const outcome = await binding.limit({ key });
  if (!outcome.success) {
    throw new ApiError(429, "RATE_LIMITED", "Too Many Requests");
  }
}
