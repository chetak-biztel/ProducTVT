import { cn } from "@/lib/utils";

export function Pill({
  color,
  children,
  dot = true,
  className,
}: {
  color?: string;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("pill", className)} style={color ? ({ ["--pc" as string]: color } as React.CSSProperties) : undefined}>
      {dot && <span className="pill-dot" />}
      {children}
    </span>
  );
}
