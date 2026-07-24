"use client";

import { cn } from "@/lib/utils";

/** A submit button that asks for confirmation before allowing the form to submit. */
export function ConfirmButton({
  confirm = "Are you sure?",
  className,
  children,
  title,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { confirm?: string }) {
  return (
    <button
      type="submit"
      title={title}
      className={cn(className)}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
      {...props}
    >
      {children}
    </button>
  );
}
