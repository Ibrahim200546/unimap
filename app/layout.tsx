import React from "react"
import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "UniMap TDK - University Navigation",
  description:
    "Interactive university navigation app with indoor floor plans and outdoor routing for students.",
};

export const viewport: Viewport = {
  themeColor: "#3178c6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased overflow-hidden">{children}</body>
    </html>
  );
}
