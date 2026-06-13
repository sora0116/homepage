type MarpDeckView = "list" | "presentation";

interface MarpDeckElements {
  fullscreenButton: HTMLButtonElement | null;
  listButton: HTMLButtonElement | null;
  nextButton: HTMLButtonElement | null;
  presentationButton: HTMLButtonElement | null;
  previousButton: HTMLButtonElement | null;
  slides: SVGElement[];
  status: HTMLElement | null;
}

export function initMarpDecks(root: ParentNode = document) {
  for (const rawDeck of root.querySelectorAll("[data-marp-deck]")) {
    const deck = rawDeck as HTMLElement;
    if (deck.dataset.marpReady === "true") continue;
    deck.dataset.marpReady = "true";

    const elements = getDeckElements(deck);
    if (elements.slides.length === 0) continue;

    const activeSlide = normalizeSlideIndex(deck.dataset.activeSlide, elements.slides.length);
    updateDeck(deck, elements, deck.dataset.view === "presentation" ? "presentation" : "list", activeSlide);

    deck.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest("[data-marp-action]");
      if (!(button instanceof HTMLButtonElement)) return;

      const action = button.dataset.marpAction;
      const currentView = deck.dataset.view === "presentation" ? "presentation" : "list";
      const currentIndex = normalizeSlideIndex(deck.dataset.activeSlide, elements.slides.length);

      if (action === "list" || action === "presentation") {
        updateDeck(deck, elements, action, currentIndex);
        return;
      }

      if (action === "prev") {
        updateDeck(deck, elements, currentView, currentIndex - 1);
        return;
      }

      if (action === "next") {
        updateDeck(deck, elements, currentView, currentIndex + 1);
        return;
      }

      if (action === "fullscreen") {
        if (document.fullscreenElement === deck) {
          await document.exitFullscreen();
        } else {
          updateDeck(deck, elements, "presentation", currentIndex);
          await deck.requestFullscreen();
        }
      }
    });

    document.addEventListener("fullscreenchange", () => {
      const isFullscreen = document.fullscreenElement === deck;
      deck.dataset.fullscreen = isFullscreen ? "true" : "false";
      if (elements.fullscreenButton) {
        elements.fullscreenButton.textContent = isFullscreen ? "全画面終了" : "全画面";
      }
    });
  }
}

function getDeckElements(deck: HTMLElement): MarpDeckElements {
  return {
    fullscreenButton: deck.querySelector('[data-marp-action="fullscreen"]'),
    listButton: deck.querySelector('[data-marp-action="list"]'),
    nextButton: deck.querySelector('[data-marp-action="next"]'),
    presentationButton: deck.querySelector('[data-marp-action="presentation"]'),
    previousButton: deck.querySelector('[data-marp-action="prev"]'),
    slides: Array.from(deck.querySelectorAll(".marp-deck__slides > .marpit > svg")),
    status: deck.querySelector("[data-marp-status]")
  };
}

function updateDeck(
  deck: HTMLElement,
  elements: MarpDeckElements,
  view: MarpDeckView,
  requestedSlide: number
) {
  const activeSlide = normalizeSlideIndex(requestedSlide, elements.slides.length);
  deck.dataset.view = view;
  deck.dataset.activeSlide = String(activeSlide);

  for (const [index, slide] of elements.slides.entries()) {
    slide.toggleAttribute("hidden", view === "presentation" && index !== activeSlide);
  }

  elements.listButton?.classList.toggle("is-active", view === "list");
  elements.presentationButton?.classList.toggle("is-active", view === "presentation");

  if (elements.previousButton) {
    elements.previousButton.disabled = view !== "presentation" || activeSlide === 0;
  }

  if (elements.nextButton) {
    elements.nextButton.disabled =
      view !== "presentation" || activeSlide === elements.slides.length - 1;
  }

  if (elements.status) {
    elements.status.textContent =
      view === "presentation"
        ? `${activeSlide + 1} / ${elements.slides.length}`
        : `全 ${elements.slides.length} 枚`;
  }
}

function normalizeSlideIndex(value: string | number | undefined, slideCount: number) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(slideCount - 1, parsed));
}
