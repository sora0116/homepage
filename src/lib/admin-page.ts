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
  const currentUrl = new URL(Astro.request.url);
  const status = currentUrl.searchParams.get("status");
  const error = currentUrl.searchParams.get("error");
  const inquiryQuery = currentUrl.searchParams.get("q")?.trim() || "";
  const inquiryStatusFilter = currentUrl.searchParams.get("status_filter")?.trim() || "";
  const inquiries = session ? await listInquiries(db) : [];
  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesQuery =
      !inquiryQuery ||
      [inquiry.name, inquiry.email, inquiry.message]
        .join("\n")
        .toLowerCase()
        .includes(inquiryQuery.toLowerCase());
    const matchesStatus =
      !inquiryStatusFilter || inquiry.status === inquiryStatusFilter;
    return matchesQuery && matchesStatus;
  });

  return {
    session,
    db,
    status,
    error,
    posts: session ? await listPosts(db, { includeDrafts: true, includePrivate: true }) : [],
    works: session ? await listWorks(db, true) : [],
    homepage: session ? await getHomepageSettings(db) : null,
    inquiries,
    filteredInquiries,
    inquiryQuery,
    inquiryStatusFilter
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
