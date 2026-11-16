import type { Metadata } from "next";
import Roadmap from "@/components/Roadmap";
import { ChapterPage } from "@/components/Layout";

export const metadata: Metadata = {
  title: "Build your own — GPU Explorer",
  description: "The steps from logic gates to a tiny GPU on real hardware.",
};

export default function Page() {
  return (
    <ChapterPage slug="build">
      <Roadmap />
    </ChapterPage>
  );
}
