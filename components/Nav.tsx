"use client";

import { Page } from "@/types/Page";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import ThemeSwitchButton from "./ThemeSwitchButton";

const Nav = ({ pages }: { pages: Page[] }) => {
  const router = usePathname();
  const isHome = router === "/" || router?.startsWith("/local");
  // Redesign prototype: home + project pages use the new paper/ink system
  const isRedesign = isHome || router?.startsWith("/projects/");

  if (isRedesign) {
    return (
      <header className="hp-surface hp-rule fixed inset-x-0 top-0 z-50 h-14 flex items-stretch border-b border-ink bg-paper text-ink">
        <Link
          href="/"
          className="flex items-center px-5 md:px-10 font-sans text-base md:text-lg tracking-tight hover:text-rust transition-colors"
        >
          Harry Partridge
        </Link>
        <nav aria-label="Main" className="ml-auto flex items-stretch">
          {pages?.map((page) => {
            const active = router?.startsWith(`/${page.slug}`);
            return (
              <Link
                key={page._id}
                href={`/${page.slug}`}
                aria-current={active ? "page" : undefined}
                className="hp-rule flex items-center gap-2 border-l border-ink px-4 md:px-6 font-mono text-[11px] uppercase tracking-wider hover:text-rust transition-colors"
              >
                <span
                  aria-hidden="true"
                  className={`w-1.5 h-1.5 rounded-full ${active ? "bg-rust" : "bg-current opacity-25"}`}
                />
                {page.title}
              </Link>
            );
          })}
        </nav>
      </header>
    );
  }

  // Legacy pages (not yet redesigned)
  return (
    <header
      className={`${!isHome && "border-b border-gray-300"} ${
        isHome ? "absolute bg-transparent" : "fixed dark:bg-black bg-white"
      } z-50 flex items-center justify-between px-5 md:px-10 left-0 right-0 py-5 md:py-8`}
    >
      <Link href="/" className="hover:text-yellow text-sm md:text-xl">
        Harry Partridge
      </Link>
      <div className="flex items-center gap-3 md:gap-5">
        {pages?.map((page) => (
          <Link
            key={page._id}
            href={`/${page.slug}`}
            className={`${
              router.includes(page.title.toLowerCase()) && "text-yellow"
            } hover:text-yellow text-xs md:text-lg transition`}
          >
            {page.title}
          </Link>
        ))}
        <ThemeSwitchButton />
      </div>
    </header>
  );
};

export default Nav;
