import type { APIRoute } from "astro";
import { createInquiry, getDb } from "../../lib/db";
import { getRuntimeEnv } from "../../lib/runtime-env";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isFormSubmission(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  return contentType.includes("application/x-www-form-urlencoded");
}

function redirectToContact(status: string) {
  return new Response(null, {
    status: 303,
    headers: { Location: `/contact/?status=${status}` }
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!isFormSubmission(request)) {
    return jsonError("Unsupported content type", 415);
  }

  const formData = await request.formData();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const company = String(formData.get("company") || "").trim();

  if (company) {
    return redirectToContact("ok");
  }

  if (!name || !email || !message) {
    return redirectToContact("missing");
  }

  if (!emailPattern.test(email)) {
    return redirectToContact("email");
  }

  await createInquiry(getDb(locals), {
    name,
    email,
    message,
    source: "homepage-contact-form"
  });

  const webhookUrl = getRuntimeEnv(locals, "CONTACT_WEBHOOK_URL");
  if (webhookUrl) {
    const upstream = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        name,
        email,
        message,
        source: "homepage-contact-form"
      })
    });

    if (!upstream.ok) {
      return redirectToContact("error");
    }
  } else {
    console.log("[contact]", { name, email, message });
  }

  return redirectToContact("ok");
};
