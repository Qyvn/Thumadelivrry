/** In-repo Durban photos — Wikimedia Commons CC BY / CC BY-SA / CC0. See docs/image-credits.md */

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
};

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
  hero: photo(
    "hero-beachfront",
    "Durban beachfront",
    [768, 1280, 1920],
    "Steve Roetz",
    "CC BY 2.0",
    "https://creativecommons.org/licenses/by/2.0",
    "File:Durban beach.jpg",
  ),
  "golden-mile": photo(
    "golden-mile",
    "Golden Mile",
    [400, 800],
    "Chris Bloom",
    "CC BY-SA 2.0",
    "https://creativecommons.org/licenses/by-sa/2.0",
    "File:Golden Mile (3699002746).jpg",
  ),
  ushaka: photo(
    "ushaka",
    "uShaka Marine World",
    [400, 800],
    "Christophe Badoux",
    "CC BY-SA 3.0",
    "https://creativecommons.org/licenses/by-sa/3.0",
    "File:UShaka Marine World entrance.jpg",
  ),
  mabhida: photo(
    "mabhida",
    "Moses Mabhida Stadium",
    [400, 800],
    "South African Tourism / Roger de la Harpe",
    "CC BY 2.0",
    "https://creativecommons.org/licenses/by/2.0",
    "File:Moses Mabhida Stadium, Durban, KwaZulu Natal, South Africa (20513002075).jpg",
  ),
  umhlanga: photo(
    "umhlanga",
    "Umhlanga Rocks Lighthouse",
    [400, 800],
    "Martie Swart",
    "CC BY 2.0",
    "https://creativecommons.org/licenses/by/2.0",
    "File:Umhlanga Lighthouse (30817438183).jpg",
  ),
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
  return p.widths
    .map((w) => `/images/durban/${p.id}-${w}.webp ${w}w`)
    .join(", ");
}
