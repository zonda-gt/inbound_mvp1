"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureReferralSource } from "@/lib/tracking";

export default function AttributionCapture() {
  const pathname = usePathname();

  useEffect(() => {
    captureReferralSource();
  }, [pathname]);

  return null;
}
