import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-24 w-full rounded-xl border border-[#0E3B24]/15 bg-white px-4 py-3 text-sm text-[#0E3B24] placeholder:text-[#0E3B24]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB627]",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";
