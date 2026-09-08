import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import HeaderNav from "@/components/HeaderNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CV AI Generator",
  description: "Správa znalostní báze, inzerátů a generování CV / průvodních dopisů",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="cs" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex h-screen flex-col overflow-hidden bg-background text-text-primary">
        <ThemeProvider>
          <header className="shrink-0 border-b border-border-subtle bg-card">
            <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-6">
              <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-text-primary">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-foreground">
                  CV
                </span>
                CV AI Generator
              </span>
              <HeaderNav />
              <div className="ml-auto flex items-center gap-3">
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="mx-auto flex w-full min-h-0 max-w-6xl flex-1 flex-col overflow-y-auto px-8 py-8">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
