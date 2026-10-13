/** Greater Durban CBD — default centre for the metro delivery radius. */
export const DURBAN_CENTER = { lat: -29.8587, lng: 31.0218 } as const;

/** Default delivery radius covering greater Durban (coastal + inland suburbs). */
export const DEFAULT_DURBAN_RADIUS_KM = 40;

/**
 * Text fallback cities when an address has no lat/lng yet.
 * Admins can override via boundaryJson.allowedCities.
 */
export const DEFAULT_DURBAN_CITIES = [
  "durban",
  "umhlanga",
  "pinetown",
  "ballito",
  "westville",
  "chatsworth",
  "phoenix",
  "hillcrest",
  "amanzimtoti",
  "kwamashu",
  "umlazi",
  "queensburgh",
  "new germany",
  "berea",
  "morningside",
  "cornubia",
  "mount edgecombe",
  "la lucia",
  "durban north",
  "bluff",
  "isipingo",
] as const;
