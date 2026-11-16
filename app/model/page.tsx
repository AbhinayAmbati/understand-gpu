import type { Metadata } from "next";
import GpuModelExplorer from "@/components/GpuModelExplorer";
import { ChapterPage } from "@/components/Layout";

export const metadata: Metadata = {
  title: "3D model — GPU Explorer",
  description: "Turn, open up and explore a 3D graphics card part by part.",
};

export default function Page() {
  return (
    <ChapterPage slug="model">
      <GpuModelExplorer />
    </ChapterPage>
  );
}
