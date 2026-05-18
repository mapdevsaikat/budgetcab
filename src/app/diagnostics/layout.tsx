import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnostics",
  description: "Internal environment diagnostics for Budget Cabs Service.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function DiagnosticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
