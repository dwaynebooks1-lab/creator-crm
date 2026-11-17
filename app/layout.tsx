import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreatorCRM — Fan Management for Creators",
  description: "Know who to message, when, and what converts. The CRM built for content creators.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
