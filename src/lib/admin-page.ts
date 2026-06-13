import { getAdminSession } from "./admin-auth";
import { getDb, getHomepageSettings, listInquiries, listPosts, listWorks } from "./db";

type AstroContextLike = {
  locals: unknown;
  request: Request;
};

export async function getAdminPageData(Astro: AstroContextLike) {
  const locals = Astro.locals as { runtime?: { env?: Record<string, unknown> } };
  const session = await getAdminSession(locals, Astro.request);
  const db = getDb(locals);
  const status = new URL(Astro.request.url).searchParams.get("status");
  const error = new URL(Astro.request.url).searchParams.get("error");

  return {
    session,
    db,
    status,
    error,
    posts: session ? await listPosts(db, true) : [],
    works: session ? await listWorks(db, true) : [],
    homepage: session ? await getHomepageSettings(db) : null,
    inquiries: session ? await listInquiries(db) : []
  };
}

export function toDateTimeLocal(value: string) {
  return value.slice(0, 16);
}

export function toTagsInput(tags: string[]) {
  return tags.join(", ");
}

export function toLinksInput(links: { label: string; href: string }[]) {
  return links.map((link) => `${link.label}|${link.href}`).join("\n");
}
