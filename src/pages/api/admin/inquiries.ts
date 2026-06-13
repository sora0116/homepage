import type { APIRoute } from "astro";
import { requireAdminSession } from "../../../lib/admin-auth";
import { getDb, updateInquiryStatus } from "../../../lib/db";

function redirect(location: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: location }
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    await requireAdminSession(locals, request);
  } catch {
    return redirect("/admin/inquiries?error=unauthorized");
  }

  const db = getDb(locals);
  if (!db) {
    return redirect("/admin/inquiries?error=invalid");
  }

  const formData = await request.formData();
  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "").trim();

  if (
    !id ||
    !["new", "in_progress", "replied", "archived"].includes(status)
  ) {
    return redirect("/admin/inquiries?error=invalid");
  }

  await updateInquiryStatus(db, id, status as "new" | "in_progress" | "replied" | "archived");
  return redirect("/admin/inquiries?status=saved");
};
