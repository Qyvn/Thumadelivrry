/** Curated Duban guide picks — from docs/durban-research.md. No invented reviews. */

export type GuidePick = {
  id: string;
  name: string;
  area: string;
  why: string;
  category: "BEACH" | "LANDMARK" | "MARKET" | "NATURE" | "CULTURE" | "FOOD";
  sourceUrl: string;
  sourceLabel: string;
  /** CSS gradient for tile — no venue photos */
  tile: string;
};

export const EXPLORE_PICKS: GuidePick[] = [
  {
    id: "golden-mile",
    name: "Golden Mile",
    area: "Central Beachfront",
    why: "Promenade and central beaches that anchor Durban’s beach tourism.",
    category: "BEACH",
    sourceUrl: "https://visitdurban.travel/page/central-beaches",
    sourceLabel: "Durban Tourism",
    tile: "linear-gradient(160deg,#0a0a0a 0%,#0e3b24 70%,#1e88c8 140%)",
  },
  {
    id: "ushaka",
    name: "uShaka Marine World",
    area: "Point / Golden Mile",
    why: "Aquarium and Wet ’n Wild waterpark on the Golden Mile.",
    category: "LANDMARK",
    sourceUrl: "https://ushakamarine.com/",
    sourceLabel: "uShaka Marine World",
    tile: "linear-gradient(160deg,#0a0a0a 0%,#0b3d5c 65%,#1e88c8 120%)",
  },
  {
    id: "mabhida",
    name: "Moses Mabhida Stadium",
    area: "Stamford Hill",
    why: "Iconic arch with SkyCar / Adventure Walk and promenade tours.",
    category: "LANDMARK",
    sourceUrl: "https://visitdurban.travel/space/moses-mabhida-stadium",
    sourceLabel: "Durban Tourism",
    tile: "linear-gradient(160deg,#0a0a0a 0%,#0e3b24 60%,#f26b1d 130%)",
  },
  {
    id: "umhlanga",
    name: "Umhlanga Promenade & Lighthouse",
    area: "Umhlanga Rocks",
    why: "Coastal walk past the landmark lighthouse toward the lagoon reserve.",
    category: "BEACH",
    sourceUrl: "https://www.umhlangatourism.co.za/UMHLANGA-BROCHURE-2025.pdf",
    sourceLabel: "Umhlanga Tourism 2025",
    tile: "linear-gradient(160deg,#0a0a0a 0%,#1e88c8 75%,#ffb627 140%)",
  },
  {
    id: "victoria-market",
    name: "Victoria Street Market",
    area: "CBD / Indian Quarter",
    why: "Spices, crafts and Indian Quarter food culture.",
    category: "MARKET",
    sourceUrl: "https://www.victoriastreetmarket.co.za/",
    sourceLabel: "Victoria Street Market",
    tile: "linear-gradient(160deg,#0a0a0a 0%,#f26b1d 80%)",
  },
  {
    id: "botanic",
    name: "Durban Botanic Gardens",
    area: "Berea",
    why: "Historic free botanic garden — Africa’s oldest surviving.",
    category: "NATURE",
    sourceUrl: "https://durbanbotanicgardens.org.za/",
    sourceLabel: "Durban Botanic Gardens",
    tile: "linear-gradient(160deg,#0a0a0a 0%,#0e3b24 80%)",
  },
  {
    id: "1000-hills",
    name: "Valley of a Thousand Hills",
    area: "~30 min west of CBD",
    why: "Hills, hiking and cultural experiences just outside the city.",
    category: "NATURE",
    sourceUrl: "https://visitdurban.travel/location/1000-hills-tourism-cto",
    sourceLabel: "Durban Tourism / 1000 Hills",
    tile: "linear-gradient(160deg,#0a0a0a 0%,#14502f 70%,#8b5a2b 130%)",
  },
  {
    id: "florida-road",
    name: "Florida Road",
    area: "Morningside",
    why: "Dining and nightlife strip of restaurants, bars and galleries.",
    category: "CULTURE",
    sourceUrl: "https://visitdurban.travel/space/florida-road",
    sourceLabel: "Durban Tourism",
    tile: "linear-gradient(160deg,#0a0a0a 0%,#2a1748 55%,#f26b1d 130%)",
  },
];

export type WhatsOnItem = {
  id: string;
  title: string;
  whenLabel: string;
  /** ISO date for sorting — start of range */
  sortDate: string;
  area: string;
  blurb: string;
  sourceUrl: string;
  sourceLabel: string;
  status: "upcoming" | "happening" | "recent";
};

/** Snapshot for product UI — keep in sync with docs/durban-research.md What's on */
export const WHATS_ON: WhatsOnItem[] = [
  {
    id: "halloween-iol",
    title: "Halloween weekend across Durban & Ballito",
    whenLabel: "30–31 Oct 2026",
    sortDate: "2026-10-30",
    area: "Giba Gorge · Florida Rd · Ballito",
    blurb: "IOL roundup of night runs, mazes and parties — check each venue before you go.",
    sourceUrl:
      "https://iol.co.za/entertainment/whats-on/durban/2026-10-22-durban-is-getting-spooky-five-halloween-events-to-get-your-blood-pumping/",
    sourceLabel: "IOL · 22 Oct 2026",
    status: "upcoming",
  },
  {
    id: "diwali-suncoast",
    title: "Durban Diwali Festival",
    whenLabel: "30 Oct – 1 Nov 2026",
    sortDate: "2026-10-30",
    area: "Suncoast beachfront",
    blurb: "Culture, food and fireworks at Suncoast (Tsogo Sun listing).",
    sourceUrl: "https://www.tsogosun.com/whatson/suncoast-durban-diwali-festival/",
    sourceLabel: "Tsogo Sun Suncoast",
    status: "upcoming",
  },
  {
    id: "bayede",
    title: "Bayede Tour Durban",
    whenLabel: "30 Oct 2026",
    sortDate: "2026-10-30",
    area: "Durban Central",
    blurb: "Listed on the official Durban Tourism upcoming-events calendar.",
    sourceUrl: "https://visitdurban.travel/page/upcoming-events",
    sourceLabel: "Durban Tourism",
    status: "upcoming",
  },
  {
    id: "mthunzi",
    title: "A Night With Mthunzi — Durban",
    whenLabel: "30 Oct 2026",
    sortDate: "2026-10-30",
    area: "Durban",
    blurb: "Listed on Durban Tourism upcoming events.",
    sourceUrl: "https://visitdurban.travel/page/upcoming-events",
    sourceLabel: "Durban Tourism",
    status: "upcoming",
  },
  {
    id: "ainaj",
    title: "Africa Is Not A Jungle (Black Coffee)",
    whenLabel: "7 Nov 2026",
    sortDate: "2026-11-07",
    area: "Kings Park, Stamford Hill",
    blurb: "Daytime outdoor festival headlined by Black Coffee — 18+ (IOL).",
    sourceUrl:
      "https://iol.co.za/entertainment/celebrity-news/2026-10-01-black-coffee-to-headline-africa-is-not-a-jungle-in-durban-in-november-2026/",
    sourceLabel: "IOL · 1 Oct 2026",
    status: "upcoming",
  },
  {
    id: "theatre-sea",
    title: "Theatre by the Sea",
    whenLabel: "25 Oct 2026 (recent)",
    sortDate: "2026-10-25",
    area: "Port Natal Maritime Museum",
    blurb: "Inaugural ocean-inspired cultural performances (IOL).",
    sourceUrl:
      "https://iol.co.za/entertainment/events/2026-10-23-inaugural-theatre-by-the-sea-brings-cultural-and-ocean-inspired-performances-to-durban/",
    sourceLabel: "IOL · 23 Oct 2026",
    status: "recent",
  },
];

export const DUBAN_ADS = [
  {
    id: "list-home",
    text: "List your home",
    href: "/homes/list",
  },
  {
    id: "shop",
    text: "List your shop · THUMA",
    href: "/merchant/apply",
  },
  {
    id: "advertise",
    text: "Advertise · WhatsApp",
    href: "https://wa.me/27645527661?text=Hi%20Duban%20—%20I%20want%20to%20advertise",
  },
] as const;
