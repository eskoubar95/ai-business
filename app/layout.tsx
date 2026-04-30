import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { NeonAuthUIProvider } from "@neondatabase/auth/react";

import "./globals.css";

import { NavShell } from "./components/nav-shell";
import { authClient } from "@/lib/auth/client";

export const metadata: Metadata = {
  title: "AI Business",
  description: "Orchestration cockpit for AI-driven businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className={`${GeistSans.className} min-h-svh antialiased`}>
        <NeonAuthUIProvider authClient={authClient}>
          <NavShell>{children}</NavShell>
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
