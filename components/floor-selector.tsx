"use client";

import { FLOORS } from "@/lib/building-data";

interface FloorSelectorProps {
  currentFloor: number;
  onChange: (floor: number) => void;
}

export default function FloorSelector({
  currentFloor,
  onChange,
}: FloorSelectorProps) {
  return (
    <div className="flex items-center bg-card rounded-xl shadow-lg border border-border overflow-hidden">
      {FLOORS.map((floor) => (
        <button
          key={floor.id}
          onClick={() => onChange(floor.id)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            currentFloor === floor.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          aria-pressed={currentFloor === floor.id}
          type="button"
        >
          {floor.label}
        </button>
      ))}
    </div>
  );
}
