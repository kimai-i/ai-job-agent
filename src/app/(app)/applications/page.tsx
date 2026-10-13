import type { Metadata } from "next";
import { JobsBoard } from "@/components/jobs-board";

export const metadata: Metadata = { title: "Job Applications" };

export default function ApplicationsPage() {
  return <JobsBoard mode="applications" />;
}
