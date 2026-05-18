import { notFound } from "next/navigation";
import DiagnosticsClient from "./DiagnosticsClient";

/** Evaluate env at request time so Vercel can enable via ENABLE_DIAGNOSTICS_PAGE without a stale static 404. */
export const dynamic = "force-dynamic";

export default function DiagnosticsPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_DIAGNOSTICS_PAGE !== "true"
  ) {
    notFound();
  }

  return <DiagnosticsClient />;
}
