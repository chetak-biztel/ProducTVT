"use client";

import { useState } from "react";

export function ColorInput({
  name,
  defaultValue = "#2563eb",
}: {
  name: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-[var(--border-strong)] bg-transparent p-1"
        aria-label="Pick a color"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        pattern="^#[0-9a-fA-F]{6}$"
        className="input font-mono text-sm"
      />
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
