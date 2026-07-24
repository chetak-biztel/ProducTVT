"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  className,
  variant = "accent",
  pendingText,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "accent" | "outline" | "ghost";
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  const variantClass = variant === "accent" ? "btn-accent" : variant === "outline" ? "btn-outline" : "btn-ghost";
  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      className={cn("btn", variantClass, className)}
      {...props}
    >
      {pending && <Loader2 className="animate-spin" size={15} />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
