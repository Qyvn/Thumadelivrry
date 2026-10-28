import type { DurbanPhoto } from "@/lib/durban-photos";

export function PhotoCredit({
  photo,
  className = "",
}: {
  photo: DurbanPhoto;
  className?: string;
}) {
  if (photo.owner) {
    return <p className={`text-[10px] leading-snug text-white/75 ${className}`}>Photo: Duban</p>;
  }
  return (
    <p className={`text-[10px] leading-snug text-white/70 ${className}`}>
      Photo: {photo.author} ·{" "}
      <a
        href={photo.licenseUrl}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-white"
      >
        {photo.license}
      </a>
      {" · "}
      <a
        href={photo.commonsUrl}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-white"
      >
        Commons
      </a>
    </p>
  );
}
