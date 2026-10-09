import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { getEffectiveAccentColor, readableForeground } from "@/lib/theme";

export const metadata: Metadata = {
  title: "ProducTVT — Team Plans & Projects",
  description: "Weekly action plans, todos, and project management for the team.",
  applicationName: "ProducTVT",
  appleWebApp: { capable: true, title: "ProducTVT", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  // Lets the app draw under the iPhone notch / home bar; layouts pad with env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1220" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const accent = await getEffectiveAccentColor();
  const accentFg = readableForeground(accent);
  // Explicit light/dark choice from the theme toggle; absent means follow the OS setting.
  const themeCookie = (await cookies()).get("theme")?.value;
  const theme = themeCookie === "light" || themeCookie === "dark" ? themeCookie : undefined;

  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-theme={theme}
      style={{ ["--accent" as string]: accent, ["--accent-fg" as string]: accentFg }}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
