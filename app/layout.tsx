import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import { ThemeProvider } from "next-themes";

import "./globals.css";

import { NavShell } from "./components/nav-shell";
import { Toaster } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth/client";

export const metadata: Metadata = {
  title: "AI Business",
  description: "Orchestration cockpit for AI-driven businesses",
};

export default async function RootLayout({
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <NeonAuthUIProvider authClient={authClient}>
            <NavShell>{children}</NavShell>
            <Toaster />
          </NeonAuthUIProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
