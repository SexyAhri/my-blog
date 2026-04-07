import AnalyticsClient from "./AnalyticsClient";
import {
  extractGoogleAnalyticsId,
  getPublicSiteSettings,
} from "@/lib/public-settings";

export default async function Analytics() {
  const settings = await getPublicSiteSettings();
  const gaId = extractGoogleAnalyticsId(settings.siteAnalytics);

  return <AnalyticsClient gaId={gaId} />;
}
