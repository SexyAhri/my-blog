"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export default function Analytics() {
  const [analyticsCode, setAnalyticsCode] = useState<string | null>(null);

  useEffect(() => {
    // 从设置中获取统计代码
    fetch("/api/settings/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.code) {
          setAnalyticsCode(data.code);
        }
      })
      .catch(console.error);
  }, []);

  if (!analyticsCode) return null;

  // 提取 Google Analytics ID
  const gaMatch = analyticsCode.match(/gtag\/js\?id=(G-[A-Z0-9]+)/);
  const gaId = gaMatch ? gaMatch[1] : null;

  if (gaId) {
    // Google Analytics
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

  // 其他统计代码（百度等）- 直接注入
  return (
    <Script id="analytics-code" strategy="afterInteractive">
      {analyticsCode}
    </Script>
  );
}
