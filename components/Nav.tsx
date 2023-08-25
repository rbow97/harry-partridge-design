"use client";

import { Page } from "@/types/Page";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import ThemeSwitchButton from "./ThemeSwitchButton";

const Nav = ({ pages }: { pages: Page[] }) => {
  const router = usePathname();
  const isHome = router === "/" || router?.startsWith("/local");

  return (
    <header
      className={`${!isHome && "border-b border-gray-300"} ${
        isHome
          ? "absolute bg-transparent"
          : "fixed dark:bg-black light:bg-white"
      } z-10 flex items-center justify-between px-5 md:px-10 left-0 right-0 py-5 md:py-8 bg-transparent`}
    >
      <Link
        href="/"
        className={`${isHome && "text-yellow"} text-sm md:text-xl`}
      >
        Harry Partridge
      </Link>
      <div className="flex items-center gap-3 md:gap-5 ">
        {pages &&
          pages.map((page) => (
            <Link
              key={page._id}
              href={`/${page.slug}`}
              className={`${
                router.includes(page.title.toLowerCase()) &&
                "dark:border-b-white border-b-black"
              } ${
                isHome
                  ? "text-white  hover:text-yellow"
                  : "  hover:border-b-black dark:hover:border-b-white pb-x border-b border-b-white dark:border-b-black"
              }   text-xs md:text-lg transition`}
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
