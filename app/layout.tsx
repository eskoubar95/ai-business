import type { Metadata } from "next";
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-svh antialiased">
        <NeonAuthUIProvider authClient={authClient}>
          <NavShell>{children}</NavShell>
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
