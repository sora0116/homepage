import type { APIRoute } from "astro";
import { requireAdminSession } from "../../../lib/admin-auth";
import { deleteWork, getDb, upsertWork } from "../../../lib/db";

function redirect(location: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: location }
  });
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLinks(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split("|").map((part) => part.trim());
      return { label, href };
    })
    .filter((link) => link.label && link.href);
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    await requireAdminSession(locals, request);
  } catch {
    return redirect("/admin?error=unauthorized");
  }

  const db = getDb(locals);
  if (!db) {
    return redirect("/admin?error=invalid");
  }

  const formData = await request.formData();
  const action = String(formData.get("_action") || "");
  const returnTo = String(formData.get("returnTo") || "/admin/works");
  const id = String(formData.get("id") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const status = String(formData.get("status") || "draft");
  const publishedAt = String(formData.get("publishedAt") || "").trim();
  const tags = parseTags(String(formData.get("tags") || ""));
  const links = parseLinks(String(formData.get("links") || ""));
  const featured = formData.get("featured") === "true";

  try {
    if (action === "delete") {
      if (!id) {
        return redirect(`${returnTo}?error=invalid`);
      }
      await deleteWork(db, id);
      return redirect("/admin/works?status=works");
    }

    if (!slug || !title || !summary || !body || !publishedAt) {
      return redirect(`${returnTo}?error=invalid`);
    }

    await upsertWork(db, {
      id: id || undefined,
      slug,
      title,
      summary,
      body,
      status: status === "published" ? "published" : "draft",
      publishedAt: new Date(publishedAt).toISOString(),
      tags,
      links,
      featured
    });

    return redirect(`${returnTo}?status=works`);
  } catch (error) {
    if (error instanceof Error && error.message === "WORK_SLUG_EXISTS") {
      return redirect(`${returnTo}?error=work_slug`);
    }
    return redirect(`${returnTo}?error=invalid`);
  }
};
