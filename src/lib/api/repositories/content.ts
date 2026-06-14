import { ApiError } from "../errors";
import type { D1DatabaseLike } from "../runtime";
import type { PostVisibility } from "../../default-content";

const postVisibilityColumnCache = new WeakMap<D1DatabaseLike, Promise<boolean>>();

export interface ApiPostSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  visibility: PostVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface ApiPostDetail extends ApiPostSummary {
  body: string;
  tags: string[];
  status: "draft" | "published";
}

export interface ApiProfile {
  heroEyebrow: string;
  heroTitle: string;
  heroIntro: string;
  aboutBody: string;
  specialties: string[];
  contactIntro: string;
  location: string;
  interests: string;
  email: string;
}

interface PostRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  body?: string;
  status?: "draft" | "published";
  visibility?: PostVisibility;
  published_at: string;
  updated_at: string;
  tags_json?: string | null;
}

interface SiteSettingsRow {
  value_json: string;
}

function parseTags(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : [];
  } catch {
    return [];
  }
}

function ensureDb(db: D1DatabaseLike | null) {
  if (!db) {
    throw new ApiError(500, "DB_BINDING_MISSING", "D1 binding is not configured.");
  }
  return db;
}

function postSelectVisibility(hasVisibilityColumn: boolean) {
  return hasVisibilityColumn ? "visibility" : "'public' as visibility";
}

async function hasPostVisibilityColumn(db: D1DatabaseLike) {
  const cached = postVisibilityColumnCache.get(db);
  if (cached) {
    return cached;
  }

  const pending = db
    .prepare("pragma table_info(posts)")
    .bind()
    .all<{ name?: string }>()
    .then((result) =>
      (result.results || []).some((column) => column && column.name === "visibility")
    )
    .catch(() => false);

  postVisibilityColumnCache.set(db, pending);
  return pending;
}

export async function listPublicPosts(
  db: D1DatabaseLike | null,
  options: { limit: number; offset: number; includePrivate?: boolean }
) {
  const database = ensureDb(db);
  const includePrivate = options.includePrivate ?? false;
  const hasVisibility = await hasPostVisibilityColumn(database);
  const result = await database
    .prepare(
      `SELECT
         id,
         slug,
         title,
         description,
         ${postSelectVisibility(hasVisibility)},
         published_at,
         updated_at
       FROM posts
       WHERE status = ?
         ${includePrivate || !hasVisibility ? "" : "AND visibility = ?"}
       ORDER BY datetime(published_at) DESC
       LIMIT ?
       OFFSET ?`
    )
    .bind(
      ...(includePrivate || !hasVisibility
        ? ["published", options.limit, options.offset]
        : ["published", "public", options.limit, options.offset])
    )
    .all<PostRow>();

  return (result.results || []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    visibility: row.visibility || "public",
    createdAt: row.published_at,
    updatedAt: row.updated_at
  }));
}

export async function getPublicPostBySlug(
  db: D1DatabaseLike | null,
  slug: string,
  options: { includePrivate?: boolean } = {}
) {
  const database = ensureDb(db);
  const includePrivate = options.includePrivate ?? false;
  const hasVisibility = await hasPostVisibilityColumn(database);
  const row = await database
    .prepare(
      `SELECT
         id,
         slug,
         title,
         description,
         body,
         status,
         ${postSelectVisibility(hasVisibility)},
         published_at,
         updated_at,
         tags_json
       FROM posts
       WHERE slug = ?
         AND status = ?
         ${includePrivate || !hasVisibility ? "" : "AND visibility = ?"}
       LIMIT 1`
    )
    .bind(
      ...(includePrivate || !hasVisibility
        ? [slug, "published"]
        : [slug, "published", "public"])
    )
    .first<PostRow>();

  if (!row) {
    throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    body: row.body || "",
    status: row.status || "draft",
    visibility: row.visibility || "public",
    createdAt: row.published_at,
    updatedAt: row.updated_at,
    tags: parseTags(row.tags_json)
  } satisfies ApiPostDetail;
}

export async function listAdminPosts(
  db: D1DatabaseLike | null,
  options: { limit: number; offset: number }
) {
  const database = ensureDb(db);
  const hasVisibility = await hasPostVisibilityColumn(database);
  const result = await database
    .prepare(
      `SELECT
         id,
         slug,
         title,
         description,
         ${postSelectVisibility(hasVisibility)},
         published_at,
         updated_at
       FROM posts
       ORDER BY datetime(updated_at) DESC
       LIMIT ?
       OFFSET ?`
    )
    .bind(options.limit, options.offset)
    .all<PostRow>();

  return (result.results || []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    visibility: row.visibility || "public",
    createdAt: row.published_at,
    updatedAt: row.updated_at
  }));
}

export async function createAdminPost(
  db: D1DatabaseLike | null,
  input: {
    slug: string;
    title: string;
    description: string;
    body: string;
    status: "draft" | "published";
    visibility: PostVisibility;
    publishedAt: string;
    tags: string[];
  }
) {
  const database = ensureDb(db);
  const hasVisibility = await hasPostVisibilityColumn(database);
  const duplicate = await database
    .prepare(`SELECT id FROM posts WHERE slug = ? LIMIT 1`)
    .bind(input.slug)
    .first<{ id: string }>();

  if (duplicate) {
    throw new ApiError(400, "POST_SLUG_EXISTS", "Post slug already exists.");
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await database
    .prepare(
      hasVisibility
        ? `INSERT INTO posts (
         id,
         slug,
         title,
         description,
         body,
         status,
         visibility,
         published_at,
         updated_at,
         tags_json
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        : `INSERT INTO posts (
         id,
         slug,
         title,
         description,
         body,
         status,
         published_at,
         updated_at,
         tags_json
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      ...(hasVisibility
        ? [
            id,
            input.slug,
            input.title,
            input.description,
            input.body,
            input.status,
            input.visibility,
            input.publishedAt,
            now,
            JSON.stringify(input.tags)
          ]
        : [
            id,
            input.slug,
            input.title,
            input.description,
            input.body,
            input.status,
            input.publishedAt,
            now,
            JSON.stringify(input.tags)
          ])
    )
    .run();

  return { id };
}

export async function updateAdminPost(
  db: D1DatabaseLike | null,
  id: string,
  input: {
    slug: string;
    title: string;
    description: string;
    body: string;
    status: "draft" | "published";
    visibility: PostVisibility;
    publishedAt: string;
    tags: string[];
  }
) {
  const database = ensureDb(db);
  const hasVisibility = await hasPostVisibilityColumn(database);
  const duplicate = await database
    .prepare(`SELECT id FROM posts WHERE slug = ? AND id != ? LIMIT 1`)
    .bind(input.slug, id)
    .first<{ id: string }>();

  if (duplicate) {
    throw new ApiError(400, "POST_SLUG_EXISTS", "Post slug already exists.");
  }

  const existing = await database
    .prepare(`SELECT id FROM posts WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<{ id: string }>();

  if (!existing) {
    throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
  }

  await database
    .prepare(
      hasVisibility
        ? `UPDATE posts
       SET slug = ?,
           title = ?,
           description = ?,
           body = ?,
           status = ?,
           visibility = ?,
           published_at = ?,
           updated_at = ?,
           tags_json = ?
       WHERE id = ?`
        : `UPDATE posts
       SET slug = ?,
           title = ?,
           description = ?,
           body = ?,
           status = ?,
           published_at = ?,
           updated_at = ?,
           tags_json = ?
       WHERE id = ?`
    )
    .bind(
      ...(hasVisibility
        ? [
            input.slug,
            input.title,
            input.description,
            input.body,
            input.status,
            input.visibility,
            input.publishedAt,
            new Date().toISOString(),
            JSON.stringify(input.tags),
            id
          ]
        : [
            input.slug,
            input.title,
            input.description,
            input.body,
            input.status,
            input.publishedAt,
            new Date().toISOString(),
            JSON.stringify(input.tags),
            id
          ])
    )
    .run();
}

export async function deleteAdminPost(
  db: D1DatabaseLike | null,
  id: string
) {
  const database = ensureDb(db);
  const existing = await database
    .prepare(`SELECT id FROM posts WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<{ id: string }>();

  if (!existing) {
    throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
  }

  await database.prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run();
}

export async function getPublicProfile(db: D1DatabaseLike | null) {
  const database = ensureDb(db);
  const row = await database
    .prepare(
      `SELECT
         value_json
       FROM site_settings
       WHERE key = ?
       LIMIT 1`
    )
    .bind("homepage")
    .first<SiteSettingsRow>();

  if (!row) {
    throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found.");
  }

  try {
    return JSON.parse(row.value_json) as ApiProfile;
  } catch {
    throw new ApiError(500, "PROFILE_PARSE_ERROR", "Profile payload is invalid.", false);
  }
}
