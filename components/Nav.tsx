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
      className={`${!isHome && "border-b border-gray-300"} ${
        isHome ? "absolute" : "fixed bg-white"
      } z-10 flex items-center justify-between px-5 md:px-10 left-0 right-0 py-8 md:py-10 bg-transparent`}
    >
      <Link
        href="/"
        className={`${
          isHome ? "text-yellow" : "text-black"
        } text-sm md:text-xl`}
      >
        Harry Partridge
      </Link>
      <div className="flex items-center gap-3 md:gap-5">
        {pages &&
          pages.map((page) => (
            <Link
              key={page._id}
              href={`/${page.slug}`}
              className={`${
                router.includes(page.title.toLowerCase())
                  ? "border-b-black text-black"
                  : "border-b-white"
              } ${
                isHome
                  ? "text-white  hover:text-yellow"
                  : "  hover:border-b-black pb-x border-b"
              }   text-xs md:text-lg transition`}
            >
              {page.title}
            </Link>
          ))}
      </div>
    </header>
  );
};

export default Nav;
