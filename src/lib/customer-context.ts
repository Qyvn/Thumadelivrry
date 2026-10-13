import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveCustomerOrigin } from "@/lib/geo";
import { getOrCreateBasket } from "@/lib/orders";
import { getLaunchZone } from "@/lib/zones";

export async function getCustomerShell() {
  const user = await getCurrentUser();
  let basketCount = 0;
  let locationLabel = "Durban";
  let customerId: string | null = null;
  let deliveryLat: number | null = null;
  let deliveryLng: number | null = null;
  const basketQtyByProduct: Record<string, number> = {};

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
      for (const item of basket.items) {
        basketQtyByProduct[item.productId] = item.quantity;
      }
      const addr = profile.addresses[0];
      if (addr) {
        const unit = addr.unitNumber ? ` · Unit ${addr.unitNumber}` : "";
        locationLabel = `${addr.building ? `${addr.building}, ` : ""}${addr.suburb || addr.city || "Durban"}${unit}`;
        deliveryLat = addr.latitude;
        deliveryLng = addr.longitude;
      }
    }
  }

  const zone = await getLaunchZone();

  const { origin, source, radiusKm } = resolveCustomerOrigin({
    addressLat: deliveryLat,
    addressLng: deliveryLng,
    zoneBoundaryJson: zone?.boundaryJson,
  });

  return {
    user,
    basketCount,
    locationLabel,
    customerId,
    zone,
    basketQtyByProduct,
    origin,
    originSource: source,
    radiusKm,
  };
}
