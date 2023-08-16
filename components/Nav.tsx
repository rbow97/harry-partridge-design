"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const Nav = () => {
  const router = usePathname();
  const isHome = router === "/" || router?.startsWith("/local");

  return (
    <nav
      className={`flex justify-end flex-row top-0 ${
        isHome ? "absolute" : "fixed bg-white"
      } z-10`}
      style={{
        width: "100%",
        gap: "24px",
      }}
    >
      <p
        className={`${isHome ? "text-white" : "text-black"}`}
        style={{ marginLeft: "0px" }}
      >
        <Link href="/">harry partridge</Link>
      </p>
      <p className={`${isHome ? "text-white" : "text-black"}`}>
        <Link href="/projects">projects</Link>
      </p>
      <p className={`${isHome ? "text-white" : "text-black"}`}>
        <Link href="/about">about</Link>
      </p>
      <p className={`${isHome ? "text-white" : "text-black"}`}>
        <Link href="/contact">contact</Link>
      </p>
    </nav>
  );
};

export default Nav;
