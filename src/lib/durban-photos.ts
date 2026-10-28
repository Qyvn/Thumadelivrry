/** In-repo Durban photos — Wikimedia Commons CC BY / CC BY-SA / CC0, plus owner-supplied "Photo: Duban". See docs/image-credits.md */

export type DurbanPhoto = {
  id: string;
  place: string;
  /** Default webp path under /images/durban/ */
  src: string;
  widths: number[];
  author: string;
  license: string;
  licenseUrl: string;
  commonsUrl: string;
  /** Owner-supplied photo credited "Photo: Duban" */
  owner?: boolean;
  /** Explicit responsive srcset (owner photos) */
  srcSet?: string;
};

const OWNER_LICENSE = "Owner-supplied";

function owner(id: string, place: string, crop: "card" | "tile"): DurbanPhoto {
  return {
    id,
    place,
    src: `/images/duban/${id}-${crop}-800.webp`,
    widths: [400, 800],
    author: "Duban",
    license: OWNER_LICENSE,
    licenseUrl: "",
    commonsUrl: "",
    owner: true,
    srcSet: `/images/duban/${id}-${crop}-400.webp 400w, /images/duban/${id}-${crop}-800.webp 800w`,
  };
}

/** Promenade hero: tall crop on mobile, wide on desktop. */
export const HERO_PHOTO = {
  place: "Golden Mile promenade with Moses Mabhida Stadium",
  author: "Duban",
  tall: "/images/duban/promenade-hero-tall-720.webp",
  tallSet:
    "/images/duban/promenade-hero-tall-480.webp 480w, /images/duban/promenade-hero-tall-720.webp 720w, /images/duban/promenade-hero-tall-1080.webp 1080w",
  wide: "/images/duban/promenade-hero-wide-1280.webp",
  wideSet:
    "/images/duban/promenade-hero-wide-768.webp 768w, /images/duban/promenade-hero-wide-1280.webp 1280w",
} as const;

export const NIGHTLIFE_PHOTO = owner("umhlanga-night", "Umhlanga Rocks at night", "card");

function photo(
  id: string,
  place: string,
  widths: number[],
  author: string,
  license: string,
  licenseUrl: string,
  commonsFile: string,
): DurbanPhoto {
  return {
    id,
    place,
    src: `/images/durban/${id}.webp`,
    widths,
    author,
    license,
    licenseUrl,
    commonsUrl: `https://commons.wikimedia.org/wiki/${commonsFile.replace(/ /g, "_")}`,
  };
}

export const DURBAN_PHOTOS = {
  hero: owner("promenade", "Golden Mile promenade", "card"),
  "golden-mile": owner("durban-letters", "#DURBAN letters, Golden Mile", "card"),
  ushaka: owner("ushaka-gate", "uShaka Marine World entrance", "card"),
  mabhida: photo(
    "mabhida",
    "Moses Mabhida Stadium",
    [400, 800],
    "South African Tourism / Roger de la Harpe",
    "CC BY 2.0",
    "https://creativecommons.org/licenses/by/2.0",
    "File:Moses Mabhida Stadium, Durban, KwaZulu Natal, South Africa (20513002075).jpg",
  ),
  umhlanga: owner("umhlanga-night", "Umhlanga Rocks", "card"),
  "victoria-market": photo(
    "victoria-market",
    "Victoria Street Market",
    [400, 800],
    "Scotted400",
    "CC BY-SA 4.0",
    "https://creativecommons.org/licenses/by-sa/4.0",
    "File:Victoria Market, Durban.jpg",
  ),
  botanic: photo(
    "botanic",
    "Durban Botanic Gardens",
    [400, 800],
    "M. Purves",
    "CC BY-SA 3.0",
    "https://creativecommons.org/licenses/by-sa/3.0",
    "File:Durban Botanic cycads and trees.JPG",
  ),
  "thousand-hills": photo(
    "thousand-hills",
    "Valley of a Thousand Hills",
    [400, 800],
    "Jean & Nathalie",
    "CC BY 2.0",
    "https://creativecommons.org/licenses/by/2.0",
    "File:Valley of a Thousand Hills.jpg",
  ),
  "florida-road": photo(
    "florida-road",
    "Florida Road",
    [400, 800],
    "Dennis Sylvester Hurd",
    "CC BY 2.0",
    "https://creativecommons.org/licenses/by/2.0",
    "File:Along Florida Road (54331633898).jpg",
  ),
} as const;

export type DurbanPhotoId = keyof typeof DURBAN_PHOTOS;

export function photoSrcSet(p: DurbanPhoto): string {
  if (p.srcSet) return p.srcSet;
  return p.widths
    .map((w) => `/images/durban/${p.id}-${w}.webp ${w}w`)
    .join(", ");
}
