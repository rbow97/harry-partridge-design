"use client";

import { Page } from "@/types/Page";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useSound } from "./sound/SoundProvider";

/** The slim ruled bar on every page: name, the Sanity pages, and the sound switch */
const Nav = ({ pages }: { pages: Page[] }) => {
  const router = usePathname();
  const { soundOn, toggle } = useSound();
  // the homepage is the projects index, so the Projects page gets no nav item (and /projects redirects home)
  const links = pages?.filter((page) => page.slug !== "projects");

  return (
    <header className="hp-surface hp-rule fixed inset-x-0 top-0 z-50 h-14 flex items-stretch border-b border-ink bg-paper text-ink">
      <Link
        href="/"
        // the same inset as the photos in their trays, so the name, the statement and the images share an edge
        className="flex items-center px-6 md:px-7 font-sans text-base md:text-lg tracking-tight whitespace-nowrap hover:text-rust hover:transition-colors"
      >
        Harry Partridge
      </Link>
      <nav aria-label="Main" className="ml-auto flex items-stretch">
        {links?.map((page) => {
          const active = router?.startsWith(`/${page.slug}`);
          return (
            <Link
              key={page._id}
              href={`/${page.slug}`}
              aria-current={active ? "page" : undefined}
              // tight on phones so the name, two pages and the switch fit one 56px bar
              className="hp-rule flex items-center gap-2 border-l border-ink px-3 md:px-7 font-mono text-[11px] uppercase tracking-wider hover:text-rust hover:transition-colors"
            >
              <span
                aria-hidden="true"
                className={`hidden md:inline w-1.5 h-1.5 rounded-full ${active ? "bg-rust" : "bg-current opacity-25"}`}
              />
              {page.title}
            </Link>
          );
        })}
        {/* the only sound control: the sound hover and the spools follow it.
            A switch whose label names the setting and whose meter shows the state: bars moving
            means sound is on, flat means off. "Sound on"/"Sound off" read as commands as much as states */}
        <button
          type="button"
          role="switch"
          aria-checked={soundOn}
          onClick={toggle}
          className="hp-rule flex items-center gap-2.5 border-l border-ink px-3 md:px-7 font-mono text-[11px] uppercase tracking-wider hover:text-rust hover:transition-colors"
        >
          Sound
          <span aria-hidden="true" className={`hp-meter ${soundOn ? "hp-meter-on" : ""}`}>
            <span />
            <span />
            <span />
            <span />
          </span>
        </button>
      </nav>
    </header>
  );
};

export default Nav;
