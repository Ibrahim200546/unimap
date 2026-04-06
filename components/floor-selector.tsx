"use client";

import { FLOORS, getFloorLabel } from "@/lib/building-data";
import type { Locale } from "@/lib/i18n";

interface FloorSelectorProps {
  locale: Locale;
  currentFloor: number;
  onChange: (floor: number) => void;
}

export default function FloorSelector({
  locale,
  currentFloor,
  onChange,
}: FloorSelectorProps) {
  return (
    <div className="flex items-center overflow-hidden rounded-2xl border border-border bg-card/90 p-1 shadow-sm backdrop-blur">
      {FLOORS.map((floor) => (
        <button
          key={floor.id}
          onClick={() => onChange(floor.id)}
          className={[
            "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
            currentFloor === floor.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          ].join(" ")}
          aria-pressed={currentFloor === floor.id}
          type="button"
        >
          {getFloorLabel(floor.id, locale)}
        </button>
      ))}
    </div>
  );
}
