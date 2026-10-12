export const BROWSE_CATEGORIES = [
  {
    slug: "groceries",
    name: "Groceries & Essentials",
    description: "Everyday staples from approved merchants",
    icon: "cart",
  },
  {
    slug: "food",
    name: "Food & Takeaways",
    description: "Meals from participating kitchens",
    icon: "utensils",
  },
  {
    slug: "drinks",
    name: "Drinks & Snacks",
    description: "Beverages and light bites",
    icon: "cup",
  },
  {
    slug: "household",
    name: "Household Products",
    description: "Cleaning and home basics",
    icon: "home",
  },
  {
    slug: "personal-care",
    name: "Personal Care",
    description: "Everyday personal essentials",
    icon: "heart",
  },
  {
    slug: "local",
    name: "Local Shops",
    description: "Neighbourhood merchants when available",
    icon: "store",
  },
] as const;

export type BrowseCategorySlug = (typeof BROWSE_CATEGORIES)[number]["slug"];

export function browseCategoryBySlug(slug: string) {
  return BROWSE_CATEGORIES.find((c) => c.slug === slug);
}
