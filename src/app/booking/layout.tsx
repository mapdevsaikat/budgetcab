import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Ride",
  description:
    "Book intercity and airport taxi from Nashik to Mumbai, Pune, Shirdi, Malegaon, and more. Online cab booking with Budget Cabs Service.",
  alternates: {
    canonical: "/booking",
  },
  openGraph: {
    description:
      "Book intercity and airport taxi from Nashik to Mumbai, Pune, and beyond. Reliable online cab booking.",
    url: "/booking",
  },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
