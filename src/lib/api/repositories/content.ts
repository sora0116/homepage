import { ApiError } from "../errors";
import type { D1DatabaseLike } from "../runtime";

export interface ApiPostSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
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

export async function listPublicPosts(
  db: D1DatabaseLike | null,
  options: { limit: number; offset: number }
) {
  const database = ensureDb(db);
  const result = await database
    .prepare(
      `SELECT
         id,
         slug,
         title,
         description,
         published_at,
         updated_at
       FROM posts
       WHERE status = ?
       ORDER BY datetime(published_at) DESC
       LIMIT ?
       OFFSET ?`
    )
    .bind("published", options.limit, options.offset)
    .all<PostRow>();

  return (result.results || []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    createdAt: row.published_at,
    updatedAt: row.updated_at
  }));
}

export async function getPublicPostBySlug(
  db: D1DatabaseLike | null,
  slug: string
) {
  const database = ensureDb(db);
  const row = await database
    .prepare(
      `SELECT
         id,
         slug,
         title,
         description,
         body,
         status,
         published_at,
         updated_at,
         tags_json
       FROM posts
       WHERE slug = ?
         AND status = ?
       LIMIT 1`
    )
    .bind(slug, "published")
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
  const result = await database
    .prepare(
      `SELECT
         id,
         slug,
         title,
         description,
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
    publishedAt: string;
    tags: string[];
  }
) {
  const database = ensureDb(db);
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
      `INSERT INTO posts (
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
      id,
      input.slug,
      input.title,
      input.description,
      input.body,
      input.status,
      input.publishedAt,
      now,
      JSON.stringify(input.tags)
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
    publishedAt: string;
    tags: string[];
  }
) {
  const database = ensureDb(db);
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
      `UPDATE posts
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
      input.slug,
      input.title,
      input.description,
      input.body,
      input.status,
      input.publishedAt,
      new Date().toISOString(),
      JSON.stringify(input.tags),
      id
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
