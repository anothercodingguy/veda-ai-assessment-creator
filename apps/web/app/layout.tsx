import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VedaAI Assessment Creator",
  description: "AI-powered assessment extraction, answer mapping, and question paper generator for teachers"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#171717" />
      </head>
      <body>{children}</body>
    </html>
  );
}
