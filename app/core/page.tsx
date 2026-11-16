import type { Metadata } from "next";
import TinyGpuSim from "@/components/TinyGpuSim";
import { ChapterPage } from "@/components/Layout";

export const metadata: Metadata = {
  title: "Inside a core — GPU Explorer",
  description: "Run a working 4-core GPU simulator one clock tick at a time.",
};

export default function Page() {
  return (
    <ChapterPage slug="core">
      <TinyGpuSim />
    </ChapterPage>
  );
}
