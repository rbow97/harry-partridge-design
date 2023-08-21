import "../globals.css";

export const metadata = {
  title: "Harry Partridge Design",
  description: "Portfolio site for Harry Partridge",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
