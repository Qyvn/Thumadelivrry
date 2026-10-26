import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Duban Delivery, powered by THUMA",
  icons: { icon: "/duban-mark.svg" },
  description:
    "Love Durban, Hidden Gems. Discover Durban with Duban, get it delivered with THUMA — Greater Durban, KwaZulu-Natal.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-ZA"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-body)] text-[#0E3B24]">
        {children}
      </body>
    </html>
  );
}
