import Nav from "@/components/Nav";
import "../globals.css";
import { getPages } from "@/sanity/sanity-utils";
import dynamic from "next/dynamic";

const DarkModeThemeProvider = dynamic(() => import("./theme-provider"), {
  ssr: false,
});

export const metadata = {
  title: "Harry Partridge Design",
  description: "Portfolio site for Harry Partridge",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // get all of our pages
  const pages = await getPages();

  return (
    <html lang="en" className="dark">
      <body className="font-inconsolata relative">
        <DarkModeThemeProvider>
          <Nav pages={pages} />
          <main className="h-full">{children}</main>
        </DarkModeThemeProvider>
      </body>
    </html>
  );
}
