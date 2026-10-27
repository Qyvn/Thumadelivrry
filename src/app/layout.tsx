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
  title: "Duban — Hidden Gems, Food & Homes around Durban",
  description:
    "Duban is your Durban one-stop: Hidden Gems, Food & Shops (delivery powered by THUMA), and Homes to rent. Enquiries via WhatsApp.",
  icons: {
    icon: [{ url: "/duban-mark.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  openGraph: {
    title: "Duban",
    description: "Hidden Gems, Food & Shops, Homes around Durban.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
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
