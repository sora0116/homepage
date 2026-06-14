export interface MediaObjectLike {
  arrayBuffer(): Promise<ArrayBuffer>;
  body: ReadableStream<Uint8Array> | null;
  httpMetadata?: {
    contentType?: string;
    contentDisposition?: string;
    cacheControl?: string;
  };
}

export interface MediaBucketLike {
  put(
    key: string,
    value: ArrayBuffer | Uint8Array | ReadableStream<Uint8Array>,
    options?: {
      httpMetadata?: MediaObjectLike["httpMetadata"];
      customMetadata?: Record<string, string>;
    }
  ): Promise<unknown>;
  get(key: string): Promise<MediaObjectLike | null>;
}

type RuntimeLocals = {
  runtime?: {
    env?: Record<string, unknown>;
  };
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function getMediaBucket(locals: RuntimeLocals | undefined) {
  const bucket = locals?.runtime?.env?.MEDIA_BUCKET;
  return bucket && typeof bucket === "object" ? (bucket as MediaBucketLike) : null;
}

export function buildMediaUrl(key: string) {
  return `/media/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function sanitizeFileName(name: string) {
  return name
    .normalize("NFKC")
    .replaceAll(/[^a-zA-Z0-9._-]+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "")
    .toLowerCase();
}

export function createMediaKey(fileName: string) {
  const now = new Date();
  const safeName = sanitizeFileName(fileName) || "file";
  return `blog/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}-${safeName}`;
}

export function createMarkdownForUpload(
  url: string,
  fileName: string,
  contentType: string | null
) {
  const alt = fileName.replace(/\.[^.]+$/, "").replaceAll(/[-_]+/g, " ").trim() || "attachment";
  return contentType?.startsWith("image/")
    ? `![${alt}](${url})`
    : `[${fileName}](${url})`;
}

export async function storeUploadedFile(
  bucket: MediaBucketLike,
  file: File
) {
  if (!file.name) {
    throw new Error("FILE_NAME_MISSING");
  }

  if (file.size <= 0) {
    throw new Error("FILE_EMPTY");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }

  const key = createMediaKey(file.name);
  const contentType = file.type || guessContentType(file.name);
  const bytes = await file.arrayBuffer();
  await bucket.put(key, bytes, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable"
    },
    customMetadata: {
      originalName: file.name
    }
  });

  const url = buildMediaUrl(key);
  return {
    key,
    url,
    contentType,
    markdown: createMarkdownForUpload(url, file.name, contentType),
    fileName: file.name
  };
}

export function guessContentType(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "pdf":
      return "application/pdf";
    case "txt":
      return "text/plain; charset=utf-8";
    case "md":
      return "text/markdown; charset=utf-8";
    case "json":
      return "application/json";
    default:
      return "application/octet-stream";
  }
}
