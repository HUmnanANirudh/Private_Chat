import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/Providers/Providers";

const jetbrainmono = JetBrains_Mono({
  variable: "--font-jetbrainmono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Private Chat",
  description: "A private self destructing chat application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jetbrainmono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
