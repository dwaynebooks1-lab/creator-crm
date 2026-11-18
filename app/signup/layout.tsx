import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up Free — CreatorCRM",
  description: "Create your free CreatorCRM account. Track fans, prevent churn, and grow revenue. Free forever for up to 25 fans.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
