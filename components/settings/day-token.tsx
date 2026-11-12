"use client";

import { useState, useTransition } from "react";
import { regenerateDayToken } from "@/app/(app)/settings/day-token-action";

export function DayToken({ hasToken }: { hasToken: boolean }) {
  const [token, setToken] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      {token && (
        <input readOnly value={token} onFocus={(e) => e.currentTarget.select()} className="input font-mono text-xs" aria-label="Day Tracker token" />
      )}
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={pending}
        onClick={() => start(async () => setToken(await regenerateDayToken()))}
      >
        {hasToken ? "Make a new token (the old one stops working)" : "Make a token"}
      </button>
      {token && <p className="text-xs text-[var(--text-faint)]">Shown once. Put it in the hub as REMOTE_TOKEN.</p>}
    </div>
  );
}
