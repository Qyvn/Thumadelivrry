import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-24 w-full rounded-xl border border-[#18221B]/15 bg-white px-4 py-3 text-sm text-[#18221B] placeholder:text-[#18221B]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0F27B]",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";
