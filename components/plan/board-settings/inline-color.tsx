"use client";

import { useState, useTransition } from "react";

export function InlineColor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (color: string) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [color, setColor] = useState(value);
  const [, startTransition] = useTransition();

  return (
    <input
      type="color"
      value={color}
      disabled={disabled}
      onChange={(e) => {
        const next = e.target.value;
        setColor(next);
        startTransition(() => {
          onChange(next);
        });
      }}
      className="h-7 w-7 cursor-pointer rounded-md border border-[var(--border-strong)] bg-transparent p-0.5 disabled:cursor-not-allowed"
      aria-label="Change color"
    />
  );
}
