import ReleaseIndex from "@/components/ReleaseIndex";
import { getPublishedReleases } from "@/lib/db";

// Literal required by Next. Keep in step with PUBLIC_REVALIDATE_SECONDS.
export const revalidate = 300;

export default async function HomePage() {
  const releases = await getPublishedReleases();
  return <ReleaseIndex releases={releases} activeCategory="all" />;
}
