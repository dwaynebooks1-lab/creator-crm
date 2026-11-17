import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreatorCRM — Fan Management for Creators",
  description: "Know who to message, when, and what converts. Stop losing fans you could have saved. The CRM built for content creators.",
  metadataBase: new URL("https://creator-crm-liart.vercel.app"),
  openGraph: {
    title: "CreatorCRM — Fan Management for Creators",
    description: "Track fans, prevent churn, and grow revenue. The CRM that pays for itself in one saved subscription.",
    siteName: "CreatorCRM",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CreatorCRM — Fan Management for Creators",
    description: "Track fans, prevent churn, and grow revenue. The CRM that pays for itself in one saved subscription.",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
