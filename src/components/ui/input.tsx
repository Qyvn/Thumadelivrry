import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded-xl border border-[#0E3B24]/15 bg-white px-4 text-sm text-[#0E3B24] placeholder:text-[#0E3B24]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB627]",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
