const KEY = "world";
const HOLLOWED = "hollowed";
const KINDLED = "kindled";

type World = typeof HOLLOWED | typeof KINDLED;

/**
 * localStorage is the source of truth, never the DOM: ClientRouter wipes
 * <html>'s attributes on every navigation and the inline head script does
 * not re-run, so reading data-theme reset the reader's world on each click.
 */
function stored(): World {
  return localStorage.getItem(KEY) === KINDLED ? KINDLED : HOLLOWED;
}

function reflect(world: World): void {
  document.firstElementChild?.setAttribute("data-theme", world);

  // The control is an icon, so its only label is the accessible one. It is
  // written in plain language: the internal world names mean nothing to
  // someone who cannot see which theme is on.
  document
    .querySelector("#world-btn")
    ?.setAttribute(
      "aria-label",
      world === KINDLED
        ? "Light theme. Switch to dark."
        : "Dark theme. Switch to light.",
    );

  document
    .querySelector("meta[name='theme-color']")
    ?.setAttribute("content", getComputedStyle(document.body).backgroundColor);
}

/**
 * The flip is instant — no wash, no fade (design.md §11).
 *
 * Bound once, on the document, via closest(). Binding to #world-btn from
 * the after-swap handler stacked one listener per navigation, so the
 * button toggled once per page visited.
 */
document.addEventListener("click", event => {
  const target = event.target as Element | null;
  if (!target?.closest?.("#world-btn")) return;

  const next: World = stored() === KINDLED ? HOLLOWED : KINDLED;
  localStorage.setItem(KEY, next);
  reflect(next);
});

// Re-apply after every navigation; the swap wipes the attribute. Restores
// state only — anything that re-runs per navigation must never bind.
reflect(stored());
document.addEventListener("astro:after-swap", () => reflect(stored()));

// Carry theme-color across View Transitions so Android's chrome does not flash.
document.addEventListener("astro:before-swap", event => {
  const color = document
    .querySelector("meta[name='theme-color']")
    ?.getAttribute("content");
  if (color) {
    (event as unknown as { newDocument: Document }).newDocument
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", color);
  }
});
