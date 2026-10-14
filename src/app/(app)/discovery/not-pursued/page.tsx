import type { Metadata } from "next";
import { JobsBoard } from "@/components/jobs-board";

export const metadata: Metadata = { title: "Not pursued" };

export default function NotPursuedPage() {
  return <JobsBoard mode="not-pursued" />;
}
