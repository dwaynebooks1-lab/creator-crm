import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreatorCRM — Fan Management CRM for Content Creators",
  description:
    "The CRM built for content creators. Track fans, prevent churn, and grow revenue with AI-powered action items, churn risk scoring, renewal alerts, and ready-made DM templates. Works with OnlyFans, Fansly, Patreon, and more.",
  metadataBase: new URL("https://creatorcrm.net"),
  keywords: [
    "creator CRM",
    "fan management",
    "OnlyFans CRM",
    "Fansly CRM",
    "content creator tools",
    "fan retention",
    "subscriber churn",
    "creator revenue",
    "fan tracking",
    "DM templates",
    "Patreon CRM",
    "creator analytics",
  ],
  openGraph: {
    title: "CreatorCRM — Stop Losing Fans You Could Save",
    description:
      "Track fans, prevent churn, and grow revenue. AI-powered action items tell you exactly who to message, when, and what to say. Free for up to 25 fans.",
    siteName: "CreatorCRM",
    type: "website",
    url: "https://creatorcrm.net",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CreatorCRM — Fan Management for Content Creators",
    description:
      "The CRM that tells you exactly which fans to message and gives you the words. Saves 4+ hours/day. Free to start.",
    site: "@creatorcrm",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://creatorcrm.net",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "CreatorCRM",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: "https://creatorcrm.net",
              description:
                "Fan management CRM for content creators. Track fans, prevent churn, and grow revenue with AI-powered tools.",
              offers: [
                {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                  name: "Starter",
                  description: "Free forever for up to 25 fans",
                },
                {
                  "@type": "Offer",
                  price: "29",
                  priceCurrency: "USD",
                  name: "Pro Monthly",
                  description: "Unlimited fans, billed monthly",
                  billingIncrement: 1,
                  billingDuration: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
                },
                {
                  "@type": "Offer",
                  price: "249",
                  priceCurrency: "USD",
                  name: "Pro Annual",
                  description: "Unlimited fans, billed annually — save $99/year",
                  billingIncrement: 1,
                  billingDuration: { "@type": "QuantitativeValue", value: 1, unitCode: "ANN" },
                },
              ],
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9",
                ratingCount: "127",
                bestRating: "5",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
