"use client";

import { Suspense } from "react";
import OtpPageContent from "./OtpPageContent";

export const dynamic = "force-dynamic";

export default function OtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OtpPageContent />
    </Suspense>
  );
}
