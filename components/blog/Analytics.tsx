"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getOrCreateVisitorId, shouldTrackPageView } from "@/lib/visitor";

export default function Analytics() {
  const [gaId, setGaId] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/settings/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.code) {
          const match = data.code.match(/G-[A-Z0-9]+/);
          if (match) {
            setGaId(match[0]);
          }
        }
      })
      .catch(console.error);
  }, []);

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

  if (!gaId) return null;

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