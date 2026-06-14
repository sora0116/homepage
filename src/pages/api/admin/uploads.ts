import type { APIRoute } from "astro";
import { requireAdminSession } from "../../../lib/admin-auth";
import { createMediaAsset, getDb, listMediaAssets } from "../../../lib/db";
import { getMediaBucket, storeUploadedFile } from "../../../lib/media-storage";

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init?.headers
    }
  });
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    await requireAdminSession(locals, request);
  } catch {
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const assets = await listMediaAssets(getDb(locals), { query, limit: 48 });
  return json({
    data: assets.map((asset) => ({
      ...asset,
      url: `/media/${asset.storageKey.split("/").map(encodeURIComponent).join("/")}`
    }))
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  let session;
  try {
    session = await requireAdminSession(locals, request);
  } catch {
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const bucket = getMediaBucket(locals);
  if (!bucket) {
    return json({ error: "storage_unavailable" }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return json({ error: "file_required" }, { status: 400 });
  }

  try {
    const uploaded = await storeUploadedFile(bucket, file);
    await createMediaAsset(getDb(locals), {
      storageKey: uploaded.key,
      fileName: uploaded.fileName,
      contentType: uploaded.contentType,
      sizeBytes: file.size,
      createdBy: session.login
    });
    return json({ data: uploaded });
  } catch (error) {
    if (!(error instanceof Error)) {
      return json({ error: "upload_failed" }, { status: 500 });
    }

    switch (error.message) {
      case "FILE_NAME_MISSING":
      case "FILE_EMPTY":
        return json({ error: error.message.toLowerCase() }, { status: 400 });
      case "FILE_TOO_LARGE":
        return json({ error: "file_too_large" }, { status: 413 });
      default:
        return json({ error: "upload_failed" }, { status: 500 });
    }
  }
};
