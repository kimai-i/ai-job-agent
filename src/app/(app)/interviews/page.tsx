import type { Metadata } from "next";
import { JobsBoard } from "@/components/jobs-board";

export const metadata: Metadata = { title: "Scheduled Interview" };

export default function InterviewsPage() {
  return <JobsBoard mode="interviews" />;
}
