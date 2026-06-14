import type { APIRoute } from "astro";
import { requireAdminSession } from "../../../lib/admin-auth";
import { deletePost, getDb, upsertPost } from "../../../lib/db";

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
  const returnTo = String(formData.get("returnTo") || "/admin/posts");
  const id = String(formData.get("id") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const status = String(formData.get("status") || "draft");
  const isPrivate = String(formData.get("isPrivate") || "") === "true";
  const publishedAt = String(formData.get("publishedAt") || "").trim();
  const tags = parseTags(String(formData.get("tags") || ""));

  try {
    if (action === "delete") {
      if (!id) {
        return redirect(`${returnTo}?error=invalid`);
      }
      await deletePost(db, id);
      return redirect("/admin/posts?status=posts");
    }

    if (!slug || !title || !description || !body || !publishedAt) {
      return redirect(`${returnTo}?error=invalid`);
    }

    await upsertPost(db, {
      id: id || undefined,
      slug,
      title,
      description,
      body,
      status: status === "published" ? "published" : "draft",
      visibility: isPrivate ? "private" : "public",
      publishedAt: new Date(publishedAt).toISOString(),
      tags
    });

    return redirect(`${returnTo}?status=posts`);
  } catch (error) {
    if (error instanceof Error && error.message === "POST_SLUG_EXISTS") {
      return redirect(`${returnTo}?error=post_slug`);
    }
    return redirect(`${returnTo}?error=invalid`);
  }
};
