import { requireAdminSession } from "../admin-auth";
import { ApiError } from "./errors";

export async function requireAdminApiAuth(
  locals: unknown,
  request: Request
) {
  try {
    return await requireAdminSession(
      locals as { runtime?: { env?: Record<string, unknown> } },
      request
    );
  } catch {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required.");
  }
}
