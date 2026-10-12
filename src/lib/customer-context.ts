import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrCreateBasket } from "@/lib/orders";

export async function getCustomerShell() {
  const user = await getCurrentUser();
  let basketCount = 0;
  let locationLabel = "Set delivery location";
  let customerId: string | null = null;

  if (user?.role === "CUSTOMER") {
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: user.id },
      include: {
        addresses: { where: { isDefault: true }, take: 1 },
      },
    });
    if (profile) {
      customerId = profile.id;
      const basket = await getOrCreateBasket(profile.id);
      basketCount = basket.items.reduce((n, i) => n + i.quantity, 0);
      const addr = profile.addresses[0];
      if (addr) {
        locationLabel = `${addr.suburb}, Cornubia Flats`;
      }
    }
  }

  const zone = await prisma.deliveryZone.findUnique({
    where: { slug: "cornubia-flats" },
  });

  return { user, basketCount, locationLabel, customerId, zone };
}
