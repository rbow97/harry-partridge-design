import Nav from "@/components/Nav";
import "../globals.css";
import { getPages } from "@/sanity/sanity-utils";
import SoundProvider from "@/components/sound/SoundProvider";
import dynamic from "next/dynamic";
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
    <html lang="en" className={`dark ${sans.variable} ${mono.variable}`}>
      <body className="font-inconsolata relative bg-white dark:bg-black">
        <DarkModeThemeProvider>
          <SoundProvider>
            <Nav pages={pages} />
            <main>{children}</main>
          </SoundProvider>
        </DarkModeThemeProvider>
      </body>
    </html>
  );
}
