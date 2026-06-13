type RuntimeLocals = {
  runtime?: {
    env?: Record<string, unknown>;
  };
};

export function getRuntimeEnv(
  locals: RuntimeLocals | undefined,
  key: string
) {
  const value = locals?.runtime?.env?.[key];
  return typeof value === "string" ? value : undefined;
}

export function getRuntimeBinding<T>(
  locals: RuntimeLocals | undefined,
  key: string
) {
  const value = locals?.runtime?.env?.[key];
  return value ? (value as T) : null;
}
