"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getOrCreateVisitorId, shouldTrackPageView } from "@/lib/visitor";

interface AnalyticsClientProps {
  gaId: string | null;
}

export default function AnalyticsClient({ gaId }: AnalyticsClientProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/posts/")) {
      return;
    }

    if (!shouldTrackPageView(pathname)) {
      return;
    }

    fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        visitorId: getOrCreateVisitorId(),
      }),
    }).catch(() => {});
  }, [pathname]);

  if (!gaId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
