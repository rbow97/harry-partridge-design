import type { Page } from "@/types/Page";
import React, { useEffect, useRef, useState } from "react";
import SoundSwitch from "./SoundSwitch";

/**
 * The slim ruled bar on every page: name, the Sanity pages, and the sound switch at the
 * right end (components/SoundSwitch.tsx). On phones the pages live behind a menu button
 * (three rules) that drops a panel of ruled rows from the bar; Escape, the button, a tap
 * beneath, or a link closes it.
 */
// pathname comes from the page (Astro.url.pathname): every navigation is a full load
const Nav = ({ pages, pathname }: { pages: Page[]; pathname: string }) => {
  // the homepage is the projects index, so the Projects page gets no nav item (and /projects redirects home)
  const links = pages?.filter((page) => page.slug !== "projects");

  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  // a new page closes the menu
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const button = menuButton.current; // held for the cleanup, when focus goes back to it
    firstLink.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    // a tap on the page beneath the panel closes it
    const away = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.("header")) setOpen(false);
    };
    document.addEventListener("keydown", esc);
    document.addEventListener("pointerdown", away);
    return () => {
      document.removeEventListener("keydown", esc);
      document.removeEventListener("pointerdown", away);
      button?.focus();
    };
  }, [open]);

  return (
    <header className="hp-bar hp-surface hp-rule fixed inset-x-0 top-0 z-50 h-14 flex items-stretch border-b border-ink bg-paper text-ink">
      <a
        href="/"
        // the same inset as the photos in their trays, so the name, the statement and the images share an edge
        className="flex items-center px-6 md:px-7 font-sans text-body tracking-tight whitespace-nowrap hover:text-accent hover:transition-colors"
      >
        Harry Partridge
      </a>

      {/* desktop: the pages in the bar */}
      <nav aria-label="Main" className="ml-auto hidden md:flex items-stretch">
        {links?.map((page) => {
          const active = pathname.startsWith(`/${page.slug}`);
          return (
            <a
              key={page._id}
              href={`/${page.slug}`}
              aria-current={active ? "page" : undefined}
              className="group relative hp-rule flex items-center gap-2 border-l border-ink px-7 font-mono text-label uppercase tracking-wider hover:text-accent transition-colors"
            >
              <span
                aria-hidden="true"
                className={`w-1.5 h-1.5 rounded-full transition-transform duration-300 group-hover:scale-150 motion-reduce:transition-none ${active ? "bg-accent scale-150" : "bg-current opacity-25"}`}
              />
              {page.title}
              {/* the thread winds along the foot of the cell, as it does under a tray, and stays wound on the page you're on */}
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 -bottom-px h-0.5 bg-accent origin-left transition-transform duration-500 ease-out group-hover:scale-x-100 motion-reduce:transition-none ${
                  active ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </a>
          );
        })}
      </nav>

      {/* the sound switch sits at the right end on every size, after the pages or beside the menu button */}
      <div className="ml-auto md:ml-0 flex items-stretch">
        <SoundSwitch />
      </div>

      {/* phones: a menu button, three rules that become a cross */}
      <button
        ref={menuButton}
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="hp-menu"
        onClick={() => setOpen((o) => !o)}
        className="hp-rule md:hidden flex items-center justify-center w-14 border-l border-ink hover:text-accent"
      >
        <span aria-hidden="true" className={`hp-burger ${open ? "hp-burger-open" : ""}`}>
          <span />
          <span />
          <span />
        </span>
      </button>
      {/* the menu drops from the bar as a panel of ruled rows, the page showing beneath it */}
      <nav
        id="hp-menu"
        aria-label="Main"
        aria-hidden={!open}
        // display is set by class, not the hidden attribute: Tailwind's `flex` outranks `[hidden]`
        className={`hp-surface md:hidden fixed inset-x-0 top-14 z-40 bg-paper text-ink flex-col shadow-[0_24px_40px_-24px_rgba(26,26,23,0.35)] ${
          open ? "flex" : "hidden"
        }`}
      >
        {links?.map((page, i) => {
          const active = pathname.startsWith(`/${page.slug}`);
          return (
            <a
              key={page._id}
              ref={i === 0 ? firstLink : undefined}
              href={`/${page.slug}`}
              aria-current={active ? "page" : undefined}
              className={`group relative hp-rule flex items-center px-6 py-4 border-b border-ink font-mono text-label uppercase tracking-wider hover:text-accent ${
                active ? "text-accent" : ""
              }`}
            >
              {page.title}
              {/* the same thread as the bar: drawn on the page you're on */}
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 -bottom-px h-0.5 bg-accent origin-left transition-transform duration-500 ease-out group-hover:scale-x-100 motion-reduce:transition-none ${
                  active ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </a>
          );
        })}
      </nav>
    </header>
  );
};

export default Nav;
