import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in or create an account to book Budget Cabs Service rides from Nashik, Mumbai, Pune, and airport routes.",
  alternates: {
    canonical: "/onboarding",
  },
  openGraph: {
    description: "Access your Budget Cabs Service account to book taxi and airport transfers.",
    url: "/onboarding",
  },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
