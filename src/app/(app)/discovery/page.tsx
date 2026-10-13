import type { Metadata } from "next";
import { JobsBoard } from "@/components/jobs-board";

export const metadata: Metadata = { title: "Job Discovery" };

export default function DiscoveryPage() {
  return <JobsBoard mode="discovery" />;
}
