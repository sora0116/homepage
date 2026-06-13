import { Marp } from "@marp-team/marp-core";
import { marked } from "marked";

marked.setOptions({
  breaks: true,
  gfm: true
});

const marp = new Marp();
const MARP_BLOCK_PATTERN = /(^|\n)::marp[ \t]*\n([\s\S]*?)\n::(?=\n|$)/g;

interface MarpRenderFailure {
  markdown: string;
  message: string;
}

export function renderMarkdown(source: string) {
  return marked.parse(replaceMarpBlocks(source)) as string;
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
    return marp.render(source);
  } catch {
    return {
      markdown: source,
      message: "Marp スライドの変換に失敗しました。"
    } satisfies MarpRenderFailure;
  }
}

function renderMarpDeckHtml(html: string, css: string) {
  return [
    '<div class="marp-deck">',
    `  <style>${css}</style>`,
    `  <div class="marp-deck__slides">${html}</div>`,
    "</div>"
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
