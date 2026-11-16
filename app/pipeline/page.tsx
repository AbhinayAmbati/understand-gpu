import type { Metadata } from "next";
import GraphicsPipeline from "@/components/GraphicsPipeline";
import { ChapterPage } from "@/components/Layout";

export const metadata: Metadata = {
  title: "Drawing a frame — GPU Explorer",
  description: "Watch the graphics pipeline turn three points into a coloured triangle.",
};

export default function Page() {
  return (
    <ChapterPage slug="pipeline">
      <GraphicsPipeline />
    </ChapterPage>
  );
}
