import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropStealth",
  description: "Your rental properties, managed by AI agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
