import Nav from "@/components/Nav";
import "../globals.css";
import { getPages } from "@/sanity/sanity-utils";
import SoundProvider from "@/components/sound/SoundProvider";
import { Instrument_Sans, Martian_Mono } from "next/font/google";

const sans = Instrument_Sans({
  subsets: ["latin"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  // pages set their own title (a project's name, "Bio"), this is the home title and the suffix
  title: { default: "Harry Partridge Design", template: "%s · Harry Partridge" },
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
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="relative bg-paper text-ink">
        <SoundProvider>
          <Nav pages={pages} />
          <main>{children}</main>
        </SoundProvider>
      </body>
    </html>
  );
}
