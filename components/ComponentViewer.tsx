"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Segmented, Surface } from "@/components/ui";
import type { PartId } from "@/lib/parts";

const Gpu3D = dynamic(() => import("@/components/Gpu3D"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-mute">
      <span className="pulse-soft">Loading 3D model…</span>
    </div>
  ),
});

const VIEWS = [
  { value: "part", label: "This part" },
  { value: "card", label: "In the card" },
];

/** The 3D card, focused on one component. Clicking another part opens its page. */
export default function ComponentViewer({ id }: { id: PartId }) {
  const router = useRouter();
  const [view, setView] = useState("part");

  return (
    <Surface className="relative h-[380px] sm:h-[540px]">
      <Gpu3D
        selected={id}
        isolate={view === "part"}
        onSelect={(next) => {
          if (next !== id) router.push(`/components/${next}`);
        }}
        className="h-full rounded-[28px]"
      />
      <div className="absolute top-3 right-4">
        <Segmented label="What to show" options={VIEWS} value={view} onChange={setView} />
      </div>
    </Surface>
  );
}
