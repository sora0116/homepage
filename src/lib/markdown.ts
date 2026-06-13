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
    '<section class="marp-deck" data-marp-deck data-view="list" data-active-slide="0" tabindex="0">',
    '  <div class="marp-deck__toolbar">',
    '    <div class="marp-deck__modes" role="group" aria-label="表示モード">',
    '      <button type="button" class="marp-deck__button is-active" data-marp-action="list">一覧</button>',
    '      <button type="button" class="marp-deck__button" data-marp-action="presentation">プレゼン</button>',
    "    </div>",
    '    <div class="marp-deck__actions">',
    '      <button type="button" class="marp-deck__button" data-marp-action="prev" aria-label="前のスライド">前へ</button>',
    '      <p class="marp-deck__status" data-marp-status aria-live="polite"></p>',
    '      <button type="button" class="marp-deck__button" data-marp-action="next" aria-label="次のスライド">次へ</button>',
    '      <button type="button" class="marp-deck__button" data-marp-action="fullscreen">全画面</button>',
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
