import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { FileTextIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Cover Letters" };

export default function CoverLettersPage() {
  return (
    <ComingSoon
      title="Cover Letters"
      description="Draft tailored cover letters for qualified jobs."
      icon={FileTextIcon}
      planned={[
        "AI drafts based on the job posting",
        "Edit and approve drafts in the app",
        "Nothing is sent without your explicit approval",
      ]}
    />
  );
}
