import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded-xl border border-[#18221B]/15 bg-white px-4 text-sm text-[#18221B] placeholder:text-[#18221B]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0F27B]",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
