import { prisma } from "@/lib/db";

export {
  DEFAULT_DURBAN_CITIES,
  DEFAULT_DURBAN_RADIUS_KM,
  DURBAN_CENTER,
} from "@/lib/zones-constants";

export async function getLaunchZone() {
  const settings = await prisma.platformSettings.findUnique({
    where: { id: "default" },
  });
  const slug = settings?.launchZoneSlug ?? "durban";
  const zone = await prisma.deliveryZone.findUnique({ where: { slug } });
  if (zone) return zone;
  return prisma.deliveryZone.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
}
