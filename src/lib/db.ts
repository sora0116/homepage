import type {
  HomepageSettings,
  PostRecord,
  PostStatus,
  WorkLink,
  WorkRecord
} from "./default-content";
import {
  defaultHomepageSettings,
  defaultPosts,
  defaultWorks
} from "./default-content";

type D1Statement = {
  bind: (...values: unknown[]) => {
    all: <T>() => Promise<{ results?: T[] }>;
    first: <T>() => Promise<T | null>;
    run: () => Promise<unknown>;
  };
};

type D1DatabaseLike = {
  prepare: (query: string) => D1Statement;
};

type RuntimeLocals = {
  runtime?: {
    env?: Record<string, unknown>;
  };
};

type PostRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  status: PostStatus;
  published_at: string;
  updated_at: string;
  tags_json: string | null;
};

type WorkRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  status: PostStatus;
  published_at: string;
  updated_at: string;
  tags_json: string | null;
  links_json: string | null;
  featured: number;
};

type SiteSettingsRow = {
  key: string;
  value_json: string;
};

type InquiryStatus = "new" | "in_progress" | "replied" | "archived";

type InquiryRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: InquiryStatus;
  source: string;
  created_at: string;
  updated_at: string;
};

export interface PostInput {
  id?: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  status: PostStatus;
  publishedAt: string;
  tags: string[];
}

export interface WorkInput {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  status: PostStatus;
  publishedAt: string;
  tags: string[];
  links: WorkLink[];
  featured: boolean;
}

export interface InquiryRecord {
  id: string;
  name: string;
  email: string;
  message: string;
  status: InquiryStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export function getDb(locals: RuntimeLocals | undefined) {
  const db = locals?.runtime?.env?.DB;
  return db && typeof db === "object" ? (db as D1DatabaseLike) : null;
}

function parseJsonArray(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapPost(row: PostRow): PostRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    body: row.body,
    status: row.status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    tags: parseJsonArray(row.tags_json).filter(
      (tag): tag is string => typeof tag === "string"
    )
  };
}

function mapWork(row: WorkRow): WorkRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    status: row.status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    tags: parseJsonArray(row.tags_json).filter(
      (tag): tag is string => typeof tag === "string"
    ),
    links: parseJsonArray(row.links_json).filter(
      (item): item is WorkLink =>
        typeof item === "object" &&
        item !== null &&
        typeof item.label === "string" &&
        typeof item.href === "string"
    ),
    featured: Boolean(row.featured)
  };
}

function mapInquiry(row: InquiryRow): InquiryRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function sortByPublishedAt<T extends { publishedAt: string }>(items: T[]) {
  return [...items].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export async function listPosts(db: D1DatabaseLike | null, includeDrafts = false) {
  if (!db) {
    return sortByPublishedAt(
      defaultPosts.filter((post) => includeDrafts || post.status === "published")
    );
  }

  const query = includeDrafts
    ? `select * from posts order by datetime(published_at) desc`
    : `select * from posts where status = 'published' order by datetime(published_at) desc`;
  const result = await db.prepare(query).bind().all<PostRow>();
  return (result.results || []).map(mapPost);
}

export async function getPostBySlug(
  db: D1DatabaseLike | null,
  slug: string,
  includeDrafts = false
) {
  if (!db) {
    return (
      defaultPosts.find(
        (post) => post.slug === slug && (includeDrafts || post.status === "published")
      ) || null
    );
  }

  const query = includeDrafts
    ? `select * from posts where slug = ? limit 1`
    : `select * from posts where slug = ? and status = 'published' limit 1`;
  const result = await db.prepare(query).bind(slug).first<PostRow>();
  return result ? mapPost(result) : null;
}

export async function listWorks(db: D1DatabaseLike | null, includeDrafts = false) {
  if (!db) {
    return sortByPublishedAt(
      defaultWorks.filter((work) => includeDrafts || work.status === "published")
    );
  }

  const query = includeDrafts
    ? `select * from works order by datetime(published_at) desc`
    : `select * from works where status = 'published' order by datetime(published_at) desc`;
  const result = await db.prepare(query).bind().all<WorkRow>();
  return (result.results || []).map(mapWork);
}

export async function getWorkBySlug(
  db: D1DatabaseLike | null,
  slug: string,
  includeDrafts = false
) {
  if (!db) {
    return (
      defaultWorks.find(
        (work) => work.slug === slug && (includeDrafts || work.status === "published")
      ) || null
    );
  }

  const query = includeDrafts
    ? `select * from works where slug = ? limit 1`
    : `select * from works where slug = ? and status = 'published' limit 1`;
  const result = await db.prepare(query).bind(slug).first<WorkRow>();
  return result ? mapWork(result) : null;
}

export async function getHomepageSettings(db: D1DatabaseLike | null) {
  if (!db) {
    return defaultHomepageSettings;
  }

  const row = await db
    .prepare(`select * from site_settings where key = 'homepage' limit 1`)
    .bind()
    .first<SiteSettingsRow>();

  if (!row) {
    return defaultHomepageSettings;
  }

  try {
    return {
      ...defaultHomepageSettings,
      ...(JSON.parse(row.value_json) as Partial<HomepageSettings>)
    };
  } catch {
    return defaultHomepageSettings;
  }
}

export async function listInquiries(db: D1DatabaseLike | null) {
  if (!db) {
    return [] as InquiryRecord[];
  }

  const result = await db
    .prepare(`select * from inquiries order by datetime(created_at) desc`)
    .bind()
    .all<InquiryRow>();

  return (result.results || []).map(mapInquiry);
}

export async function createInquiry(
  db: D1DatabaseLike | null,
  input: {
    name: string;
    email: string;
    message: string;
    source?: string;
  }
) {
  if (!db) {
    return;
  }

  const now = new Date().toISOString();
  await db
    .prepare(
      `insert into inquiries (
        id,
        name,
        email,
        message,
        status,
        source,
        created_at,
        updated_at
      ) values (?, ?, ?, ?, 'new', ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      input.name,
      input.email,
      input.message,
      input.source || "homepage-contact-form",
      now,
      now
    )
    .run();
}

export async function updateInquiryStatus(
  db: D1DatabaseLike,
  id: string,
  status: InquiryStatus
) {
  await db
    .prepare(`update inquiries set status = ?, updated_at = ? where id = ?`)
    .bind(status, new Date().toISOString(), id)
    .run();
}

export async function upsertPost(db: D1DatabaseLike, input: PostInput) {
  const now = new Date().toISOString();
  const id = input.id || crypto.randomUUID();
  const duplicate = await db
    .prepare(`select id from posts where slug = ? and id != ? limit 1`)
    .bind(input.slug, id)
    .first<{ id: string }>();

  if (duplicate) {
    throw new Error("POST_SLUG_EXISTS");
  }

  await db
    .prepare(
      `insert into posts (id, slug, title, description, body, status, published_at, updated_at, tags_json)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?)
       on conflict(id) do update set
         slug = excluded.slug,
         title = excluded.title,
         description = excluded.description,
         body = excluded.body,
         status = excluded.status,
         published_at = excluded.published_at,
         updated_at = excluded.updated_at,
         tags_json = excluded.tags_json`
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
}

export async function deletePost(db: D1DatabaseLike, id: string) {
  await db.prepare(`delete from posts where id = ?`).bind(id).run();
}

export async function upsertWork(db: D1DatabaseLike, input: WorkInput) {
  const now = new Date().toISOString();
  const id = input.id || crypto.randomUUID();
  const duplicate = await db
    .prepare(`select id from works where slug = ? and id != ? limit 1`)
    .bind(input.slug, id)
    .first<{ id: string }>();

  if (duplicate) {
    throw new Error("WORK_SLUG_EXISTS");
  }

  await db
    .prepare(
      `insert into works (id, slug, title, summary, body, status, published_at, updated_at, tags_json, links_json, featured)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       on conflict(id) do update set
         slug = excluded.slug,
         title = excluded.title,
         summary = excluded.summary,
         body = excluded.body,
         status = excluded.status,
         published_at = excluded.published_at,
         updated_at = excluded.updated_at,
         tags_json = excluded.tags_json,
         links_json = excluded.links_json,
         featured = excluded.featured`
    )
    .bind(
      id,
      input.slug,
      input.title,
      input.summary,
      input.body,
      input.status,
      input.publishedAt,
      now,
      JSON.stringify(input.tags),
      JSON.stringify(input.links),
      input.featured ? 1 : 0
    )
    .run();
}

export async function deleteWork(db: D1DatabaseLike, id: string) {
  await db.prepare(`delete from works where id = ?`).bind(id).run();
}

export async function updateHomepageSettings(
  db: D1DatabaseLike,
  input: HomepageSettings
) {
  await db
    .prepare(
      `insert into site_settings (key, value_json, updated_at)
       values ('homepage', ?, ?)
       on conflict(key) do update set
         value_json = excluded.value_json,
         updated_at = excluded.updated_at`
    )
    .bind(JSON.stringify(input), new Date().toISOString())
    .run();
}

export function formatDate(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(value);
}

export function formatDateTime(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}
