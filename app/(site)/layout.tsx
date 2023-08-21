import Nav from "@/components/Nav";
import "../globals.css";
import Link from "next/link";
import { getPages } from "@/sanity/sanity-utils";

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
    <html lang="en">
      <body className="font-inconsolata relative">
        <Nav pages={pages} />
        <main className="h-screen">{children}</main>
      </body>
    </html>
  );
}
