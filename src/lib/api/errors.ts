export class ApiError extends Error {
  status: number;
  code: string;
  expose: boolean;

  constructor(status: number, code: string, message: string, expose = true) {
    super(message);
    this.status = status;
    this.code = code;
    this.expose = expose;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
