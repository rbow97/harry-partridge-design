import Nav from "@/components/Nav";
import "../globals.css";
import { getPages } from "@/sanity/sanity-utils";
import SoundProvider from "@/components/sound/SoundProvider";
import { Caveat, Instrument_Sans, Martian_Mono } from "next/font/google";

// handwriting for the herbarium specimen labels
const hand = Caveat({ subsets: ["latin"], weight: "500", variable: "--font-hand", display: "swap" });

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
    <html lang="en" className={`${sans.variable} ${mono.variable} ${hand.variable}`}>
      <body className="relative bg-paper text-ink">
        <SoundProvider>
          <Nav pages={pages} />
          <main>{children}</main>
        </SoundProvider>
      </body>
    </html>
  );
}
