import { HomeFeed } from "@/components/HomeFeed";
import { SiteHeader } from "@/components/SiteHeader";
import { getLatestData } from "@/lib/content";

export default function Home() {
  const latest = getLatestData();

  return (
    <>
      <SiteHeader updatedCount={latest.updatedCount} />
      <main className="page-shell compact">
        <HomeFeed items={latest.items} />
      </main>
    </>
  );
}
