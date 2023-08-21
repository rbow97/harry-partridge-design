"use client";

import { Page } from "@/types/Page";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const Nav = ({ pages }: { pages: Page[] }) => {
  const router = usePathname();
  const isHome = router === "/" || router?.startsWith("/local");

  return (
    <header
      className={`${!isHome && "border-b border-gray-500"} ${
        isHome ? "absolute" : "sticky"
      } z-10 flex items-center justify-between px-10 left-0 right-0 py-10 bg-transparent`}
    >
      <Link
        href="/"
        className={`${isHome ? "text-yellow" : "text-black"} text-lg`}
      >
        Harry Partridge
      </Link>
      <div className="flex items-center gap-5 text-sm">
        {pages &&
          pages.map((page) => (
            <Link
              key={page._id}
              href={`/${page.slug}`}
              className={`${
                isHome ? "text-white" : "text-black"
              } hover:text-yellow text-lg transition`}
            >
              {page.title}
            </Link>
          ))}
      </div>
    </header>
  );
};

export default Nav;
