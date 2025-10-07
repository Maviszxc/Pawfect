"use client";

import { Suspense } from "react";
import OtpPageContent from "./OtpPageContent";

export const dynamic = "force-dynamic";

export default function OtpPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center p-10 text-gray-600">Loading...</div>
      }
    >
      <OtpPageContent />
    </Suspense>
  );
}
