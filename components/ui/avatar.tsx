import { initials } from "@/lib/utils";

/** Deterministic soft color from a string. */
function hueFrom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const hue = hueFrom(name || "?");
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `hsl(${hue} 70% 92%)`,
        color: `hsl(${hue} 45% 34%)`,
        border: `1px solid hsl(${hue} 60% 86%)`,
      }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
