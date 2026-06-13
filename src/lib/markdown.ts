import { Marp } from "@marp-team/marp-core";
import { marked } from "marked";
import { replaceDadsEmbeds } from "./dads-embed";

marked.setOptions({
  breaks: true,
  gfm: true
});

const DADS_MARP_THEME = String.raw`/* @theme dads */
@import 'default';

:root {
  --dads-blue-50: #e8f1fe;
  --dads-blue-900: #0017c1;
  --dads-blue-1000: #00118f;
  --dads-yellow-300: #ffd43d;
  --dads-gray-50: #f2f2f2;
  --dads-gray-300: #b3b3b3;
  --dads-gray-800: #333333;
  --dads-gray-900: #1a1a1a;
  --dads-surface: #f6f8fb;
  --dads-border: #cbd5e1;
}

section {
  font-family: "Noto Sans JP", "Hiragino Sans", sans-serif;
  font-size: 32px;
  line-height: 1.5;
  letter-spacing: 0.01em;
  color: var(--dads-gray-900);
  background: #ffffff;
  padding: 72px 76px;
}

section::after {
  right: 38px;
  bottom: 26px;
  font-size: 20px;
  color: rgba(26, 26, 26, 0.55);
}

h1,
h2,
h3,
h4,
h5,
h6 {
  margin: 0 0 0.45em;
  color: var(--dads-gray-900);
  font-family: "Noto Sans JP", "Hiragino Sans", sans-serif;
  font-weight: 700;
  letter-spacing: 0;
}

h1 {
  font-size: 1.7em;
  line-height: 1.25;
  padding-left: 0.55em;
  position: relative;
}

h1::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.18em;
  width: 0.24em;
  height: 0.95em;
  border-radius: 999px;
  background: var(--dads-blue-900);
}

h2 {
  font-size: 1.2em;
  line-height: 1.35;
}

h3 {
  font-size: 1em;
  line-height: 1.4;
  color: var(--dads-blue-1000);
}

p,
ul,
ol,
blockquote {
  margin: 0 0 0.7em;
}

strong,
b {
  color: var(--dads-blue-1000);
  font-weight: 700;
}

code {
  font-family: "Noto Sans Mono", monospace;
  font-size: 0.88em;
  padding: 0.12em 0.32em;
  border-radius: 0.32em;
  background: rgba(232, 241, 254, 0.95);
  color: var(--dads-blue-1000);
}

pre {
  margin: 0.8em 0;
  padding: 0.7em 0.9em;
  border: 1px solid var(--dads-border);
  border-radius: 0.45em;
  background: rgba(255, 255, 255, 0.9);
}

pre code {
  padding: 0;
  background: transparent;
  color: inherit;
}

ul,
ol {
  padding-left: 1.2em;
}

li + li {
  margin-top: 0.28em;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin-top: 0.6em;
  font-size: 0.82em;
}

table th {
  background: var(--dads-blue-50);
  color: var(--dads-gray-900);
}

table th,
table td {
  padding: 0.45em 0.6em;
  border: 1px solid var(--dads-border);
}

blockquote {
  padding: 0.7em 0.9em;
  border-left: 0.22em solid var(--dads-blue-900);
  background: rgba(255, 255, 255, 0.78);
}

.dads-embed {
  margin: 0.7em 0;
}

.dads-embed__frame {
  display: block;
  width: 100%;
  height: var(--dads-embed-height, 9em);
  border: 1px solid var(--dads-border);
  border-radius: 0.45em;
  background: #ffffff;
}

.dads-embed__caption {
  margin-top: 0.45em;
  color: rgba(26, 26, 26, 0.62);
  font-size: 0.46em;
}

.dads-embed--fallback {
  padding: 0.7em 0.9em;
  border: 1px dashed var(--dads-border);
  border-radius: 0.45em;
  background: rgba(255, 255, 255, 0.78);
}

.dads-embed--fallback p {
  margin: 0;
}

.dads-embed--fallback p + p {
  margin-top: 0.35em;
}

.dads-component {
  margin: 0.7em 0;
}

.dads-component__body {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45em;
  align-items: center;
}

.dads-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.4em;
  padding: 0.55em 0.9em;
  border-radius: 0.42em;
  font-weight: 700;
  font-size: 0.8em;
  line-height: 1;
  text-decoration: none;
}

.dads-button:any-link,
.dads-button:visited {
  text-decoration: none;
}

.dads-button[data-type="solid-fill"] {
  background: var(--dads-blue-900);
  color: #fff;
}

.dads-button[data-type="solid-fill"]:any-link,
.dads-button[data-type="solid-fill"]:visited {
  color: #fff;
}

.dads-button[data-type="outline"] {
  border: 1px solid var(--dads-blue-1000);
  background: #fff;
  color: var(--dads-blue-1000);
}

.dads-button[data-type="outline"]:any-link,
.dads-button[data-type="outline"]:visited,
.dads-button[data-type="text"]:any-link,
.dads-button[data-type="text"]:visited {
  color: var(--dads-blue-1000);
}

.dads-button[data-type="text"] {
  color: var(--dads-blue-1000);
  text-decoration: underline;
}

.dads-chip-label {
  display: inline-grid;
  align-items: center;
  min-height: 2em;
  padding: 0.3em 0.6em;
  border: 1px solid var(--dads-blue-900);
  border-radius: 0.42em;
  background: var(--dads-blue-50);
  color: var(--dads-blue-1000);
  font-size: 0.7em;
  letter-spacing: 0.02em;
}

.dads-link,
.dads-utility-link {
  color: var(--dads-blue-1000);
  text-decoration: underline;
}

.dads-notification-banner {
  display: grid;
  gap: 0.45em;
  padding: 0.7em 0.9em;
  border: 1px solid var(--dads-border);
  border-left: 0.22em solid var(--dads-blue-900);
  border-radius: 0.45em;
  background: rgba(255, 255, 255, 0.92);
}

.dads-notification-banner__heading {
  display: flex;
  align-items: center;
  gap: 0.4em;
  margin: 0;
  font-size: 0.8em;
}

.app-notice__icon {
  display: inline-grid;
  place-items: center;
  width: 1.3em;
  height: 1.3em;
  border-radius: 999px;
  background: var(--dads-blue-1000);
  color: #fff;
  font-size: 0.9em;
  font-weight: 700;
}

header,
footer {
  margin: 0;
  color: rgba(26, 26, 26, 0.62);
  font-size: 0.52em;
}

section.lead {
  justify-content: center;
}

section.lead h1 {
  font-size: 2em;
}

section.lead p {
  max-width: 24em;
  color: var(--dads-gray-800);
}
`;

const marp = new Marp();
marp.themeSet.add(DADS_MARP_THEME);
const MARP_BLOCK_PATTERN = /(^|\n)::marp[ \t]*\n([\s\S]*?)\n::(?=\n|$)/g;

interface MarpRenderFailure {
  markdown: string;
  message: string;
}

export function renderMarkdown(source: string) {
  return marked.parse(replaceDadsEmbeds(replaceMarpBlocks(source), "markdown")) as string;
}

function replaceMarpBlocks(source: string) {
  return source.replace(MARP_BLOCK_PATTERN, (_, leadingWhitespace: string, deckSource: string) => {
    const renderedDeck = renderMarpDeck(deckSource.trim());
    const html = isMarpRenderFailure(renderedDeck)
      ? renderMarpFallbackHtml(renderedDeck)
      : renderMarpDeckHtml(renderedDeck.html, renderedDeck.css);

    return `${leadingWhitespace}\n${html}\n`;
  });
}

function renderMarpDeck(source: string) {
  if (!source) {
    return {
      markdown: source,
      message: "Marp ブロックが空です。"
    } satisfies MarpRenderFailure;
  }

  try {
    return marp.render(replaceDadsEmbeds(applyDadsTheme(source), "marp"));
  } catch {
    return {
      markdown: source,
      message: "Marp スライドの変換に失敗しました。"
    } satisfies MarpRenderFailure;
  }
}

function applyDadsTheme(source: string) {
  const trimmed = source.trim();
  if (!trimmed.startsWith("---")) {
    return `---\ntheme: dads\n---\n\n${source}`;
  }

  const match = trimmed.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return `---\ntheme: dads\n---\n\n${source}`;
  }

  const frontmatter = match[1] ?? "";
  const normalizedFrontmatter = /(^|\n)theme\s*:/m.test(frontmatter)
    ? frontmatter.replace(/(^|\n)theme\s*:\s*([^\n]+)/m, "$1theme: dads")
    : `theme: dads\n${frontmatter}`;

  return trimmed.replace(match[0], `---\n${normalizedFrontmatter}\n---`);
}

function renderMarpDeckHtml(html: string, css: string) {
  return [
    '<section class="marp-deck" data-marp-deck data-view="list" data-active-slide="0" tabindex="0">',
    '  <div class="marp-deck__toolbar">',
    '    <div class="marp-deck__modes" role="group" aria-label="表示モード">',
    '      <button type="button" class="dads-button marp-deck__button" data-size="md" data-type="solid-fill" data-active="true" data-marp-action="list">一覧</button>',
    '      <button type="button" class="dads-button marp-deck__button" data-size="md" data-type="outline" data-marp-action="presentation">プレゼン</button>',
    "    </div>",
    '    <div class="marp-deck__actions dads-page-navigation" aria-label="スライド操作">',
    '      <button type="button" class="dads-page-navigation__arrow-button marp-deck__arrow-button" data-size="lg" data-marp-action="prev" aria-label="前のスライド">',
    '        <svg class="dads-page-navigation__button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.75 5.25L9 12L15.75 18.75" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>',
    "      </button>",
    '      <p class="marp-deck__status dads-page-navigation__counter" data-marp-status aria-live="polite"></p>',
    '      <button type="button" class="dads-page-navigation__arrow-button marp-deck__arrow-button" data-size="lg" data-marp-action="next" aria-label="次のスライド">',
    '        <svg class="dads-page-navigation__button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.25 5.25L15 12L8.25 18.75" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>',
    "      </button>",
    '      <button type="button" class="dads-button marp-deck__button" data-size="md" data-type="outline" data-marp-action="fullscreen">全画面</button>',
    "    </div>",
    "  </div>",
    `  <style>${css}</style>`,
    `  <div class="marp-deck__slides">${html}</div>`,
    "</section>"
  ].join("\n");
}

function renderMarpFallbackHtml(failure: MarpRenderFailure) {
  return [
    '<div class="marp-deck marp-deck--fallback">',
    '  <div class="marp-deck__fallback">',
    `    <p><strong>${escapeHtml(failure.message)}</strong></p>`,
    `    <pre>${escapeHtml(failure.markdown)}</pre>`,
    "  </div>",
    "</div>"
  ].join("\n");
}

function isMarpRenderFailure(value: unknown): value is MarpRenderFailure {
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
