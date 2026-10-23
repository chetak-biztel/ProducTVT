import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getEffectiveAccentColor, readableForeground } from "@/lib/theme";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

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
    { media: "(prefers-color-scheme: light)", color: "#f4f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#101218" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // No accent chosen anywhere means the theme's own default (see globals.css).
  const accent = await getEffectiveAccentColor();
  // Explicit light/dark choice from the theme toggle; absent means follow the OS setting.
  const themeCookie = (await cookies()).get("theme")?.value;
  const theme = themeCookie === "light" || themeCookie === "dark" ? themeCookie : undefined;

  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${jetbrains.variable} h-full antialiased`}
      data-theme={theme}
      style={accent ? { ["--accent" as string]: accent, ["--accent-fg" as string]: readableForeground(accent) } : undefined}
    >
      <body className="min-h-full flex flex-col">
        <div className="ambient-blobs" aria-hidden="true">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>
        {children}
      </body>
    </html>
  );
}
