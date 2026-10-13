import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { CompassIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Job Discovery" };

export default function DiscoveryPage() {
  return (
    <ComingSoon
      title="Job Discovery"
      description="Find new job postings that match your profile."
      icon={CompassIcon}
      planned={[
        "Saved searches across job platforms",
        "Review discovered jobs before they are tracked",
        "Duplicate detection against existing applications",
      ]}
    />
  );
}
