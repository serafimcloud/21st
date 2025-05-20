import prisma from "@/lib/prisma"
import "server-only"

export const getPurchasesWithBundles = async (userId: string | null) => {
  if (!userId) {
    return []
  }

  const purchases = await prisma.bundle_purchases.findMany({
    where: { user_id: userId },
    include: {
      bundles: {
        include: {
          bundle_items: true, // include all items (components) in the bundle
        },
      },
      bundle_plans: true, // include plan info (can be null)
    },
    orderBy: { created_at: "desc" },
  })
  return purchases
}

export const isComponentPaid = async (componentId: number) => {
  const items = await prisma.bundle_items.findFirst({
    where: { component_id: componentId },
  })
  return !!items
}
