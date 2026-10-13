import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { SparklesIcon } from "@/components/icons";

export const metadata: Metadata = { title: "AI Qualification" };

export default function QualificationPage() {
  return (
    <ComingSoon
      title="AI Qualification"
      description="Score how well each job fits your skills and preferences."
      icon={SparklesIcon}
      planned={[
        "Fit score with reasoning for each job",
        "Rate, time zone and job type checks",
        "You approve every result before it changes a status",
      ]}
    />
  );
}
