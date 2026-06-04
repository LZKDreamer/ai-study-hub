import { HomeFeed } from "@/components/HomeFeed";
import { SiteHeader } from "@/components/SiteHeader";
import { getLastUpdatedLabel, getLatestData } from "@/lib/content";

export default function Home() {
  const latest = getLatestData();

  return (
    <>
      <SiteHeader lastUpdatedLabel={getLastUpdatedLabel(latest)} />
      <main className="page-shell compact">
        <HomeFeed items={latest.items} />
      </main>
    </>
  );
}
