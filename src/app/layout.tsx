import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

const display = Inter_Tight({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Duban — Durban. All in one.",
  description: "Gems. Food. Stays. Around Durban.",
  icons: {
    icon: [{ url: "/duban-mark.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  openGraph: {
    title: "Duban — Durban. All in one.",
    description: "Gems. Food. Stays.",
    images: [{ url: "/og-duban.jpg", width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-ZA"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[var(--paper)] font-[family-name:var(--font-body)] text-[var(--ink)]">
        {children}
      </body>
    </html>
  );
}
