"use client";

import { cn } from "@/lib/utils";
import { useFeedback } from "@/components/ui/feedback";

/** A submit button that asks for confirmation (in the app's own dialog) before submitting its form. */
export function ConfirmButton({
  confirm: message = "Are you sure?",
  className,
  children,
  title,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { confirm?: string }) {
  const { confirm } = useFeedback();

  return (
    <button
      type="submit"
      title={title}
      className={cn(className)}
      onClick={async (e) => {
        e.preventDefault();
        const button = e.currentTarget;
        // Passing the button keeps its name/value in the submitted form data; doesn't re-fire onClick.
        if (await confirm(message, { confirmText: "Delete", danger: true })) button.form?.requestSubmit(button);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
