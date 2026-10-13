import type { Metadata } from "next";
import { ApplicationsView } from "./applications-view";

export const metadata: Metadata = { title: "Job Applications" };

export default function ApplicationsPage() {
  return <ApplicationsView />;
}
