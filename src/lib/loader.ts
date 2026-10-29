/**
 * The thread, the page-to-page loading line: the same accent line that winds along a tray on hover,
 * run along the foot of the nav. It's honest about what it shows. While the browser fetches the next
 * page it creeps forward, slowing as it goes, since the wait can't be measured. Once the new page is
 * up it moves on as that page's photos in view finish loading, then completes and fades. Nothing
 * blocks or covers the page: text shows the moment it arrives (research note, 2026-10-23).
 * The browser carries it across the load as a view transition (global.css), so it reads as one line.
 */

const KEY = "hp-loading"; // when a navigation started, kept for the next page
const FETCHED = 0.7; // how far the line has got when the new page arrives

const store = {
  get: () => {
    try {
      return Number(sessionStorage.getItem(KEY)) || 0;
    } catch {
      return 0;
    }
  },
  set: (v: number | null) => {
    try {
      if (v === null) sessionStorage.removeItem(KEY);
      else sessionStorage.setItem(KEY, String(v));
    } catch {
      // private windows can refuse storage: the line then just starts afresh on the next page
    }
  },
};

export function startLoader() {
  const line = document.querySelector<HTMLElement>(".hp-loader");
  if (!line) return;
  const set = (p: number) => line.style.setProperty("--p", p.toFixed(3));
  let creep = 0;

  const finish = () => {
    clearInterval(creep);
    set(1);
    line.dataset.state = "done";
    store.set(null);
  };

  // leaving: a plain click on a link to another page on this site
  document.addEventListener("click", (e) => {
    const a = (e.target as Element | null)?.closest?.("a");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== "_self") return;
    if (a.hasAttribute("download")) return;
    const to = new URL(a.href, location.href);
    if (to.origin !== location.origin || (to.pathname === location.pathname && to.search === location.search)) return;
    store.set(Date.now());
    line.dataset.state = "going";
    let p = 0.08;
    set(p);
    clearInterval(creep);
    // creeps toward FETCHED, a little less each step, so a slow page never looks stuck or finished
    creep = window.setInterval(() => set((p += (FETCHED - p) * 0.12)), 120);
  });

  // coming back through the back button restores the old page as it was: clear the line
  addEventListener("pageshow", (e) => {
    if (e.persisted) {
      clearInterval(creep);
      delete line.dataset.state;
      store.set(null);
    }
  });

  // arriving: only if this load came from a click on the last page, within the last 15 seconds
  const started = store.get();
  if (!started || Date.now() - started > 15000) return store.set(null);
  // picks up where the fetch got to, straight away: without this it would grow back up from nothing
  line.style.transition = "none";
  set(FETCHED);
  line.dataset.state = "going";
  void line.offsetWidth;
  line.style.transition = "";
  const photos = Array.from(document.images).filter((img) => {
    const r = img.getBoundingClientRect();
    return img.loading !== "lazy" || (r.bottom > 0 && r.top < innerHeight);
  });
  const waiting = photos.filter((img) => !img.complete);
  if (!waiting.length) return requestAnimationFrame(finish);
  let done = photos.length - waiting.length;
  const step = () => {
    done++;
    set(FETCHED + (1 - FETCHED) * (done / photos.length));
    if (done >= photos.length) finish();
  };
  for (const img of waiting) {
    img.addEventListener("load", step, { once: true });
    img.addEventListener("error", step, { once: true });
  }
  // and never hang about: a photo that stalls doesn't hold the line up
  setTimeout(finish, 8000);
}
