const KEY = "world";
const HOLLOWED = "hollowed";
const KINDLED = "kindled";

type World = typeof HOLLOWED | typeof KINDLED;

function current(): World {
  return document.firstElementChild?.getAttribute("data-theme") === KINDLED
    ? KINDLED
    : HOLLOWED;
}

function reflect(world: World): void {
  document.firstElementChild?.setAttribute("data-theme", world);

  const label = document.querySelector("#world-label");
  if (label) label.textContent = world === KINDLED ? "Kindled" : "Hollowed";

  document
    .querySelector("#world-btn")
    ?.setAttribute("aria-label", `Current world: ${world}. Switch worlds.`);

  document
    .querySelector("meta[name='theme-color']")
    ?.setAttribute("content", getComputedStyle(document.body).backgroundColor);
}

/** Going hollow washes in blood; kindling the fire washes in gold. */
function wash(next: World, done: () => void): void {
  const veil = document.querySelector<HTMLElement>("#veil");
  const word = document.querySelector<HTMLElement>("#veil-word");

  if (!veil || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    done();
    return;
  }

  if (word) {
    word.textContent = next === KINDLED ? "Kindled" : "Hollowed";
    word.style.color = next === KINDLED ? "var(--torch)" : "var(--blood)";
  }

  veil.classList.remove("run");
  void veil.offsetWidth; // force reflow so the animation restarts
  veil.classList.add("run");
  window.setTimeout(done, 300);
}

function setup(): void {
  reflect(current());

  document.querySelector("#world-btn")?.addEventListener("click", () => {
    const next: World = current() === KINDLED ? HOLLOWED : KINDLED;
    wash(next, () => {
      localStorage.setItem(KEY, next);
      reflect(next);
    });
  });

  document.querySelector("#veil")?.addEventListener("animationend", event => {
    (event.currentTarget as HTMLElement).classList.remove("run");
  });
}

setup();
document.addEventListener("astro:after-swap", setup);

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
