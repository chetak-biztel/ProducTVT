import type { Metadata } from "next";
import "./globals.css";
import { getEffectiveAccentColor, readableForeground } from "@/lib/theme";

export const metadata: Metadata = {
  title: "ProducTVT — Team Plans & Projects",
  description: "Weekly action plans, todos, and project management for the team.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const accent = await getEffectiveAccentColor();
  const accentFg = readableForeground(accent);

  return (
    <html
      lang="en"
      className="h-full antialiased"
      style={{ ["--accent" as string]: accent, ["--accent-fg" as string]: accentFg }}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
