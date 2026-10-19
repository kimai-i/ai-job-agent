import type { Metadata } from "next";
import { JobsBoard } from "@/components/jobs-board";

export const metadata: Metadata = { title: "Employer Replied" };

export default function RepliesPage() {
  return <JobsBoard mode="replies" />;
}
