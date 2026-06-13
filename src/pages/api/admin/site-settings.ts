import type { APIRoute } from "astro";
import { requireAdminSession } from "../../../lib/admin-auth";
import { getDb, updateHomepageSettings } from "../../../lib/db";

function redirect(location: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: location }
  });
}

function parseList(value: string) {
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
  const heroEyebrow = String(formData.get("heroEyebrow") || "").trim();
  const heroTitle = String(formData.get("heroTitle") || "").trim();
  const heroIntro = String(formData.get("heroIntro") || "").trim();
  const aboutBody = String(formData.get("aboutBody") || "").trim();
  const specialties = parseList(String(formData.get("specialties") || ""));
  const contactIntro = String(formData.get("contactIntro") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const interests = String(formData.get("interests") || "").trim();
  const email = String(formData.get("email") || "").trim();

  if (
    !heroEyebrow ||
    !heroTitle ||
    !heroIntro ||
    !aboutBody ||
    specialties.length === 0 ||
    !contactIntro ||
    !location ||
    !interests ||
    !email
  ) {
    return redirect("/admin?error=invalid");
  }

  await updateHomepageSettings(db, {
    heroEyebrow,
    heroTitle,
    heroIntro,
    aboutBody,
    specialties,
    contactIntro,
    location,
    interests,
    email
  });

  return redirect("/admin?status=home");
};
