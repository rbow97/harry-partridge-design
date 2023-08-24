"use client";

import { ThemeProvider } from "next-themes";

export default function DarkModeThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider enableSystem={false}>{children}</ThemeProvider>;
}
