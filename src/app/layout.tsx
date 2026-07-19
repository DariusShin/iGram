import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iGram Workspace",
  description: "Classic split diagram workspace for Mermaid previews",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full font-sans antialiased">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
