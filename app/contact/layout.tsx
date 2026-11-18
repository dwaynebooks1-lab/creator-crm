import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — CreatorCRM",
  description: "Have a question, bug report, or feature request? Get in touch with CreatorCRM support.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
