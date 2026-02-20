"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureReferralSource } from "@/lib/tracking";

export default function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    captureReferralSource();
  }, [pathname, search]);

  return null;
}
