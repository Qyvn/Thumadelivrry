"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Soft fade-in for Next/Image with optional fill. */
export function FadeImage({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [ready, setReady] = useState(false);
  const cls = cn(
    "object-cover transition-opacity duration-700 ease-out",
    ready ? "opacity-100" : "opacity-0",
    className,
  );
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        onLoad={() => setReady(true)}
        className={cls}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 800}
      height={height ?? 600}
      priority={priority}
      sizes={sizes}
      onLoad={() => setReady(true)}
      className={cls}
    />
  );
}
