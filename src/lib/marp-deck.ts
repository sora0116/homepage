type MarpDeckView = "list" | "presentation";
const touchLayoutMedia = window.matchMedia("(max-width: 48rem), (hover: none) and (pointer: coarse)");

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
      if (!(target instanceof Element)) return;
      const button = target.closest("[data-marp-action]");
      if (button instanceof HTMLButtonElement) {
        deck.focus();
        const action = button.dataset.marpAction;
        await runDeckAction(deck, elements, action);
        return;
      }

      if (deck.dataset.fullscreen !== "true" || deck.dataset.view !== "list") return;

      const slideIndex = getSlideIndexFromEvent(event, elements.slides);
      if (slideIndex < 0) return;

      deck.focus();
      updateDeck(deck, elements, "presentation", slideIndex);
    });

    document.addEventListener("fullscreenchange", () => {
      const isFullscreen = document.fullscreenElement === deck;
      deck.dataset.fullscreen = isFullscreen ? "true" : "false";
      deck.dataset.toolbarVisible = isFullscreen && !usesTouchLayout() ? "false" : "true";
      if (elements.fullscreenButton) {
        elements.fullscreenButton.textContent = isFullscreen ? "全画面終了" : "全画面";
      }
    });

    deck.addEventListener("pointermove", (event) => {
      if (deck.dataset.fullscreen !== "true" || usesTouchLayout()) return;
      deck.dataset.toolbarVisible = event.clientY <= 96 ? "true" : "false";
    });

    deck.addEventListener("pointerleave", () => {
      if (deck.dataset.fullscreen !== "true" || usesTouchLayout()) return;
      deck.dataset.toolbarVisible = "false";
    });

    deck.addEventListener("focusin", () => {
      if (deck.dataset.fullscreen !== "true") return;
      deck.dataset.toolbarVisible = "true";
    });

    let touchStartX = 0;
    let touchStartY = 0;
    let touchActive = false;

    deck.addEventListener(
      "touchstart",
      (event) => {
        if (deck.dataset.view !== "presentation") return;
        const touch = event.touches[0];
        if (!touch) return;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchActive = true;
      },
      { passive: true }
    );

    deck.addEventListener(
      "touchend",
      async (event) => {
        if (!touchActive || deck.dataset.view !== "presentation") return;
        touchActive = false;
        const touch = event.changedTouches[0];
        if (!touch) return;

        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

        await runDeckAction(deck, elements, deltaX < 0 ? "next" : "prev");
      },
      { passive: true }
    );

    deck.addEventListener("keydown", async (event) => {
      const action = getDeckActionFromKey(event.key, deck.dataset.view === "presentation");
      if (!action) return;
      event.preventDefault();
      await runDeckAction(deck, elements, action);
    });

    touchLayoutMedia.addEventListener("change", () => {
      if (deck.dataset.fullscreen === "true") {
        deck.dataset.toolbarVisible = usesTouchLayout() ? "true" : "false";
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
    const isVisible = view === "list" || index === activeSlide;
    slide.classList.toggle("is-hidden", !isVisible);
    slide.setAttribute("aria-hidden", isVisible ? "false" : "true");
  }

  syncModeButton(elements.listButton, view === "list");
  syncModeButton(elements.presentationButton, view === "presentation");

  if (elements.previousButton) {
    elements.previousButton.disabled = view !== "presentation" || activeSlide === 0;
    elements.previousButton.setAttribute("aria-disabled", String(elements.previousButton.disabled));
  }

  if (elements.nextButton) {
    elements.nextButton.disabled =
      view !== "presentation" || activeSlide === elements.slides.length - 1;
    elements.nextButton.setAttribute("aria-disabled", String(elements.nextButton.disabled));
  }

  if (elements.status) {
    elements.status.textContent =
      view === "presentation"
        ? `${activeSlide + 1} / ${elements.slides.length}`
        : `全 ${elements.slides.length} 枚`;
  }
}

function syncModeButton(button: HTMLButtonElement | null, active: boolean) {
  if (!button) return;
  button.dataset.active = active ? "true" : "false";
  button.dataset.type = active ? "solid-fill" : "outline";
}

async function runDeckAction(
  deck: HTMLElement,
  elements: MarpDeckElements,
  action: string | undefined
) {
  const currentView = deck.dataset.view === "presentation" ? "presentation" : "list";
  const currentIndex = normalizeSlideIndex(deck.dataset.activeSlide, elements.slides.length);

  if (action === "list" || action === "presentation") {
    updateDeck(deck, elements, action, currentIndex);
    return;
  }

  if (action === "prev") {
    if (currentView !== "presentation") return;
    updateDeck(deck, elements, currentView, currentIndex - 1);
    return;
  }

  if (action === "next") {
    if (currentView !== "presentation") return;
    updateDeck(deck, elements, currentView, currentIndex + 1);
    return;
  }

  if (action === "first") {
    updateDeck(deck, elements, "presentation", 0);
    return;
  }

  if (action === "last") {
    updateDeck(deck, elements, "presentation", elements.slides.length - 1);
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
}

function getDeckActionFromKey(key: string, isPresentation: boolean) {
  switch (key) {
    case "ArrowLeft":
    case "PageUp":
      return "prev";
    case "ArrowRight":
    case "PageDown":
    case " ":
      return "next";
    case "Home":
      return "first";
    case "End":
      return "last";
    case "p":
    case "P":
      return isPresentation ? "list" : "presentation";
    case "l":
    case "L":
      return "list";
    case "f":
    case "F":
      return "fullscreen";
    case "Escape":
      return document.fullscreenElement ? "fullscreen" : undefined;
    default:
      return undefined;
  }
}

function getSlideIndexFromEvent(event: MouseEvent, slides: SVGElement[]) {
  for (const node of event.composedPath()) {
    if (!(node instanceof SVGElement)) continue;
    const index = slides.indexOf(node);
    if (index >= 0) return index;
  }

  return -1;
}

function normalizeSlideIndex(value: string | number | undefined, slideCount: number) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(slideCount - 1, parsed));
}

function usesTouchLayout() {
  return touchLayoutMedia.matches;
}
