import type { Metadata } from "next";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
