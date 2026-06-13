import { dadsComponentRegistry } from "./dads-component-registry";

const DADS_EMBED_PATTERN = /(^|\n)::dads\{([^}\n]+)\}(?=\n|$)/g;
const ATTRIBUTE_PATTERN = /(\w+)="([^"]*)"/g;
const SUPPORTED_COMPONENTS = new Set([
  "button",
  "chip-label",
  "heading",
  "link",
  "notification-banner",
  "utility-link"
]);

interface DadsEmbedFailure {
  message: string;
  raw: string;
}

type DadsEmbedKind = "component" | "example";

interface DadsEmbedBase {
  component: string;
  kind: DadsEmbedKind;
}

interface DadsExampleEmbed extends DadsEmbedBase {
  example: string;
  height: string;
  kind: "example";
  title?: string;
}

interface DadsComponentEmbed extends DadsEmbedBase {
  attributes: Map<string, string>;
  kind: "component";
}

type DadsEmbedOptions = DadsExampleEmbed | DadsComponentEmbed;

export function replaceDadsEmbeds(source: string, context: "markdown" | "marp") {
  return source.replace(DADS_EMBED_PATTERN, (_, leadingWhitespace: string, rawOptions: string) => {
    const parsed = parseDadsEmbed(rawOptions);
    const html = "message" in parsed
      ? renderDadsEmbedFallback(parsed, context)
      : renderDadsEmbed(parsed, context);

    return `${leadingWhitespace}\n${html}\n`;
  });
}

function parseDadsEmbed(rawOptions: string): DadsEmbedOptions | DadsEmbedFailure {
  const attributes = new Map<string, string>();

  for (const match of rawOptions.matchAll(ATTRIBUTE_PATTERN)) {
    const [, key, value] = match;
    if (!key || value === undefined) continue;
    attributes.set(key, value);
  }

  const component = (attributes.get("component") || "").trim().toLowerCase();
  if (!component) {
    return {
      message: "DADS コンポーネント名が指定されていません。",
      raw: rawOptions
    };
  }

  if (!(component in dadsComponentRegistry)) {
    return {
      message: `未対応の DADS コンポーネントです: ${component}`,
      raw: rawOptions
    };
  }

  const example = (attributes.get("example") || "").trim();
  if (example) {
    const availableExamples = [
      ...dadsComponentRegistry[component as keyof typeof dadsComponentRegistry]
    ];

    if (!availableExamples.some((availableExample) => availableExample === example)) {
      return {
        message: `未対応の example です: ${component} / ${example}`,
        raw: rawOptions
      };
    }

    return {
      component,
      example,
      height: sanitizeHeight(attributes.get("height")),
      kind: "example",
      title: attributes.get("title")?.trim() || undefined
    };
  }

  if (!SUPPORTED_COMPONENTS.has(component)) {
    return {
      message: `このコンポーネントは本文向け描画に未対応です: ${component}`,
      raw: rawOptions
    };
  }

  return {
    attributes,
    component,
    kind: "component"
  };
}

function renderDadsEmbed(options: DadsEmbedOptions, context: "markdown" | "marp") {
  if (options.kind === "example") {
    return renderDadsExampleEmbed(options, context);
  }

  return renderDadsComponentEmbed(options, context);
}

function renderDadsExampleEmbed(
  options: DadsExampleEmbed,
  context: "markdown" | "marp"
) {
  const src = `/dads-examples/components/${options.component}/${options.example}.html`;
  const title = escapeHtml(options.title || `${options.component} / ${options.example}`);
  const caption = escapeHtml(options.title || `${options.component} / ${options.example}`);
  const style = `--dads-embed-height: ${escapeHtml(options.height)};`;

  return [
    `<figure class="dads-embed dads-embed--${context}" style="${style}">`,
    `  <iframe class="dads-embed__frame" src="${src}" title="${title}" loading="lazy"></iframe>`,
    `  <figcaption class="dads-embed__caption">${caption}</figcaption>`,
    "</figure>"
  ].join("\n");
}

function renderDadsComponentEmbed(
  options: DadsComponentEmbed,
  context: "markdown" | "marp"
) {
  const innerHtml = renderDadsComponent(options.component, options.attributes);

  return [
    `<div class="dads-component dads-component--${context}" data-component="${escapeHtml(options.component)}">`,
    innerHtml
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n"),
    "</div>"
  ].join("\n");
}

function renderDadsComponent(component: string, attributes: Map<string, string>) {
  switch (component) {
    case "button":
      return renderButton(attributes);
    case "chip-label":
      return renderChipLabel(attributes);
    case "heading":
      return renderHeading(attributes);
    case "link":
      return renderLink(attributes);
    case "notification-banner":
      return renderNotificationBanner(attributes);
    case "utility-link":
      return renderUtilityLink(attributes);
    default:
      return `<p>${escapeHtml(component)}</p>`;
  }
}

function renderButton(attributes: Map<string, string>) {
  const label = escapeHtml(attributes.get("label") || "ボタン");
  const href = attributes.get("href")?.trim();
  const size = escapeHtml(normalizeChoice(attributes.get("size"), ["md"], "md"));
  const type = escapeHtml(
    normalizeChoice(attributes.get("type"), ["solid-fill", "outline", "text"], "solid-fill")
  );

  if (href) {
    return `<a class="dads-button" data-size="${size}" data-type="${type}" href="${escapeAttribute(href)}">${label}</a>`;
  }

  return `<button class="dads-button" data-size="${size}" data-type="${type}" type="button">${label}</button>`;
}

function renderChipLabel(attributes: Map<string, string>) {
  const label = escapeHtml(attributes.get("label") || "Chip Label");
  const color = escapeHtml(
    normalizeChoice(
      attributes.get("color"),
      ["gray", "blue", "light-blue", "cyan", "green", "lime", "yellow", "orange", "red", "magenta", "purple"],
      "blue"
    )
  );
  const style = escapeHtml(
    normalizeChoice(attributes.get("style"), ["text", "outline", "filled-outline", "fill"], "filled-outline")
  );

  return `<span class="dads-chip-label" data-color="${color}" data-style="${style}">${label}</span>`;
}

function renderHeading(attributes: Map<string, string>) {
  const text = escapeHtml(attributes.get("text") || attributes.get("label") || "Heading");
  const size = escapeHtml(
    normalizeChoice(attributes.get("size"), ["57", "45", "32", "24", "20"], "32")
  );
  const chip = attributes.get("chip") === "true";

  return `<p class="dads-heading" data-size="${size}"${chip ? " data-chip" : ""}>${text}</p>`;
}

function renderLink(attributes: Map<string, string>) {
  const label = escapeHtml(attributes.get("label") || "リンク");
  const href = escapeAttribute(attributes.get("href") || "#");
  return `<a class="dads-link" href="${href}">${label}</a>`;
}

function renderNotificationBanner(attributes: Map<string, string>) {
  const type = escapeHtml(
    normalizeChoice(attributes.get("type"), ["info", "success", "warning", "error"], "info")
  );
  const heading = escapeHtml(attributes.get("heading") || attributes.get("label") || "お知らせ");
  const body = escapeHtml(attributes.get("body") || attributes.get("text") || "本文をここに表示します。");
  const icon = type === "success" ? "○" : type === "info" ? "i" : "!";

  return [
    `<div class="dads-notification-banner app-notice" data-style="standard" data-type="${type}">`,
    `  <h2 class="dads-notification-banner__heading">`,
    `    <span class="dads-notification-banner__icon app-notice__icon" aria-hidden="true">${icon}</span>`,
    `    <span class="dads-notification-banner__heading-text">${heading}</span>`,
    "  </h2>",
    `  <div class="dads-notification-banner__body">`,
    `    <p>${body}</p>`,
    "  </div>",
    "</div>"
  ].join("\n");
}

function renderUtilityLink(attributes: Map<string, string>) {
  const label = escapeHtml(attributes.get("label") || "リンク");
  const href = escapeAttribute(attributes.get("href") || "#");
  return `<a class="dads-utility-link" href="${href}"><span class="dads-utility-link__label">${label}</span></a>`;
}

function renderDadsEmbedFallback(
  failure: DadsEmbedFailure,
  context: "markdown" | "marp"
) {
  return [
    `<div class="dads-embed dads-embed--${context} dads-embed--fallback">`,
    `  <p><strong>${escapeHtml(failure.message)}</strong></p>`,
    `  <p>${escapeHtml(failure.raw)}</p>`,
    "</div>"
  ].join("\n");
}

function sanitizeHeight(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return "28rem";
  if (/^\d+(\.\d+)?(px|rem|vh|vw|%)$/.test(trimmed)) {
    return trimmed;
  }

  return "28rem";
}

function normalizeChoice(
  value: string | undefined,
  allowed: readonly string[],
  fallback: string
) {
  return value && allowed.includes(value) ? value : fallback;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}
