import type { Metadata } from "next";
import CpuVsGpu from "@/components/CpuVsGpu";
import { ChapterPage } from "@/components/Layout";

export const metadata: Metadata = {
  title: "CPU vs GPU — GPU Explorer",
  description: "Race a few fast CPU cores against many simple GPU cores.",
};

export default function Page() {
  return (
    <ChapterPage slug="parallel">
      <CpuVsGpu />
    </ChapterPage>
  );
}
