import { marked } from "marked";

marked.setOptions({
  breaks: true,
  gfm: true
});

type SlideEmbedKind = "iframe" | "pdf";

interface SlideEmbedSuccess {
  aspectRatio: string;
  embedUrl: string;
  kind: SlideEmbedKind;
  sourceUrl: string;
  title: string;
}

interface SlideEmbedFailure {
  message: string;
  sourceUrl: string;
  title: string;
}

const DEFAULT_SLIDE_TITLE = "埋め込みスライド";
const DEFAULT_ASPECT_RATIO = "16 / 9";
const SLIDE_DIRECTIVE_PATTERN = /::slide\{([^}]*)\}/g;

export function renderMarkdown(source: string) {
  return marked.parse(replaceSlideDirectives(source)) as string;
}

function replaceSlideDirectives(source: string) {
  return source.replace(SLIDE_DIRECTIVE_PATTERN, (_, rawAttributes: string) => {
    const parsedAttributes = parseSlideDirectiveAttributes(rawAttributes);
    if (isSlideEmbedFailure(parsedAttributes)) {
      return wrapHtmlBlock(renderSlideFallbackHtml(parsedAttributes));
    }

    const title = parsedAttributes.title?.trim() || DEFAULT_SLIDE_TITLE;
    const sourceUrl = parsedAttributes.src?.trim() || "";
    const aspectRatio = normalizeAspectRatio(parsedAttributes.aspect);
    const embed = normalizeSlideEmbed(sourceUrl, title, aspectRatio);
    return wrapHtmlBlock(isSlideEmbedFailure(embed) ? renderSlideFallbackHtml(embed) : renderSlideEmbedHtml(embed));
  });
}

function wrapHtmlBlock(html: string) {
  return `\n\n${html}\n\n`;
}

function parseSlideDirectiveAttributes(rawAttributes: string) {
  const attributes: Record<string, string> = {};
  const attributePattern = /(\w+)\s*=\s*"([^"]*)"/g;
  let lastIndex = 0;

  for (const match of rawAttributes.matchAll(attributePattern)) {
    const [fullMatch, key, value] = match;
    const index = match.index ?? 0;
    if (rawAttributes.slice(lastIndex, index).trim().length > 0) {
      return {
        message: "スライド記法を解釈できませんでした。",
        sourceUrl: "",
        title: DEFAULT_SLIDE_TITLE
      } satisfies SlideEmbedFailure;
    }

    attributes[key] = value;
    lastIndex = index + fullMatch.length;
  }

  if (rawAttributes.slice(lastIndex).trim().length > 0) {
    return {
      message: "スライド記法を解釈できませんでした。",
      sourceUrl: "",
      title: DEFAULT_SLIDE_TITLE
    } satisfies SlideEmbedFailure;
  }

  return attributes as Partial<Record<"aspect" | "src" | "title", string>>;
}

function normalizeAspectRatio(rawAspect: string | undefined) {
  if (!rawAspect) return DEFAULT_ASPECT_RATIO;

  const match = rawAspect.match(/^\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*$/);
  if (!match) return DEFAULT_ASPECT_RATIO;

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return DEFAULT_ASPECT_RATIO;
  }

  return `${width} / ${height}`;
}

function normalizeSlideEmbed(sourceUrl: string, title: string, aspectRatio: string) {
  if (!sourceUrl) {
    return {
      message: "src が指定されていません。",
      sourceUrl,
      title
    } satisfies SlideEmbedFailure;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    return {
      message: "URL として解釈できませんでした。",
      sourceUrl,
      title
    } satisfies SlideEmbedFailure;
  }

  if (!/^https?:$/.test(parsedUrl.protocol)) {
    return {
      message: "http または https の URL のみ対応しています。",
      sourceUrl,
      title
    } satisfies SlideEmbedFailure;
  }

  const googleSlidesUrl = normalizeGoogleSlidesUrl(parsedUrl);
  if (googleSlidesUrl) {
    return {
      aspectRatio,
      embedUrl: googleSlidesUrl,
      kind: "iframe",
      sourceUrl: parsedUrl.toString(),
      title
    } satisfies SlideEmbedSuccess;
  }

  if (parsedUrl.pathname.toLowerCase().endsWith(".pdf")) {
    return {
      aspectRatio,
      embedUrl: parsedUrl.toString(),
      kind: "pdf",
      sourceUrl: parsedUrl.toString(),
      title
    } satisfies SlideEmbedSuccess;
  }

  if (isLikelyHtmlSlideUrl(parsedUrl)) {
    return {
      aspectRatio,
      embedUrl: parsedUrl.toString(),
      kind: "iframe",
      sourceUrl: parsedUrl.toString(),
      title
    } satisfies SlideEmbedSuccess;
  }

  return {
    message: "対応していないスライド URL です。",
    sourceUrl,
    title
  } satisfies SlideEmbedFailure;
}

function normalizeGoogleSlidesUrl(url: URL) {
  if (url.hostname !== "docs.google.com") return null;

  const match = url.pathname.match(/^\/presentation\/d\/(e\/)?([^/]+)\//);
  if (!match) return null;

  const idPrefix = match[1] || "";
  const presentationId = match[2];
  const embedUrl = new URL(
    `https://docs.google.com/presentation/d/${idPrefix}${presentationId}/embed`
  );

  for (const key of ["start", "loop", "delayms", "rm", "slide"]) {
    const value = url.searchParams.get(key);
    if (value) embedUrl.searchParams.set(key, value);
  }

  return embedUrl.toString();
}

function isLikelyHtmlSlideUrl(url: URL) {
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();
  if (pathname.endsWith(".html") || pathname.endsWith(".htm")) return true;
  if (pathname.includes("/slidev") || pathname.includes("/slides")) return true;
  if (hostname.includes("slidev") || hostname.includes("marp")) return true;
  if (hostname.startsWith("slides.") || hostname.includes(".slides.")) return true;
  if (/^\/\d+\/?$/.test(pathname) || /^#\/\d+/.test(url.hash)) return true;
  if (url.searchParams.get("embed") === "1" || url.searchParams.get("embedded") === "true") {
    return true;
  }

  return false;
}

function renderSlideEmbedHtml(embed: SlideEmbedSuccess) {
  const kindClass =
    embed.kind === "pdf" ? "slide-embed slide-embed--pdf" : "slide-embed slide-embed--iframe";
  const caption = embed.title ? `<figcaption>${escapeHtml(embed.title)}</figcaption>` : "";

  return [
    `<figure class="${kindClass}">`,
    `  <div class="slide-embed__frame" style="aspect-ratio: ${escapeHtml(embed.aspectRatio)};">`,
    `    <iframe src="${escapeHtml(embed.embedUrl)}" title="${escapeHtml(embed.title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`,
    "  </div>",
    caption,
    "</figure>"
  ].join("\n");
}

function renderSlideFallbackHtml(fallback: SlideEmbedFailure) {
  const link = fallback.sourceUrl
    ? `<a href="${escapeHtml(fallback.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(fallback.sourceUrl)}</a>`
    : "";
  const linkBlock = link ? `<p class="slide-embed__fallback-link">${link}</p>` : "";

  return [
    `<figure class="slide-embed slide-embed--fallback">`,
    '  <div class="slide-embed__fallback">',
    `    <p><strong>${escapeHtml(fallback.title)}</strong></p>`,
    `    <p>${escapeHtml(fallback.message)}</p>`,
    `    ${linkBlock}`,
    "  </div>",
    "</figure>"
  ].join("\n");
}

function isSlideEmbedFailure(value: unknown): value is SlideEmbedFailure {
  return typeof value === "object" && value !== null && "message" in value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
