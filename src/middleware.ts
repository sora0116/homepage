import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  if (import.meta.env.DEV) {
    const { getLocalDevRuntime } = await import("./lib/local-dev-runtime");
    const localRuntime = await getLocalDevRuntime();
    const runtime = context.locals.runtime ?? {};
    const env = runtime.env ?? {};

    context.locals.runtime = {
      ...runtime,
      env: {
        ...localRuntime.env,
        ...env,
        DB: env.DB ?? localRuntime.db,
        MEDIA_BUCKET: env.MEDIA_BUCKET ?? localRuntime.mediaBucket
      }
    };
  }

  return next();
});
