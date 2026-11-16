import type { Metadata } from "next";
import GpuAnatomy from "@/components/GpuAnatomy";
import { ChapterPage } from "@/components/Layout";

export const metadata: Metadata = {
  title: "How it works — GPU Explorer",
  description: "Follow one job through a graphics card in nine animated steps.",
};

export default function Page() {
  return (
    <ChapterPage slug="how-it-works">
      <GpuAnatomy />
    </ChapterPage>
  );
}
