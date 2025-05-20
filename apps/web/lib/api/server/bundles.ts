import prisma from "@/lib/prisma"
import {
  bundle_items,
  bundle_plans,
  bundle_purchases,
  bundles,
  components,
  demos,
  users,
} from "@/prisma/client"
import "server-only"

export type BundleExpanded = bundles & {
  users: users
  bundle_items: (bundle_items & {
    components: components & { demos: demos[] }
  })[]
  bundle_plans: bundle_plans[]
  bundle_purchases: bundle_purchases[]
}

const expandBundles = async (
  actorUserId: string | null,
  bundleIds: number[],
) => {
  const bundles = await prisma.bundles.findMany({
    where: {
      id: { in: bundleIds },
    },
    orderBy: {
      created_at: "desc",
    },
    include: {
      users: true,
      bundle_items: {
        include: {
          components: {
            include: {
              demos: true,
            },
          },
        },
      },
      bundle_plans: {
        orderBy: {
          type: "asc",
        },
      },
      bundle_purchases: {
        where: {
          user_id: actorUserId ?? "",
        },
        orderBy: {
          created_at: "desc",
        },
      },
    },
  })

  return bundles
}

export const getBundles = async (
  actorUserId: string | null,
  authorId: string | undefined = undefined,
  searchQuery: string | undefined = undefined,
  onlyOwned: boolean = false,
  offset: number | undefined = undefined,
  limit: number | undefined = undefined,
): Promise<BundleExpanded[]> => {
  let bundleIds: number[] = []

  if (!onlyOwned) {
    let filters = []
    if (authorId) {
      filters.push({ user_id: authorId, is_public: true }) // Bundle is public
      if (actorUserId === authorId) {
        filters.push({ user_id: actorUserId }) // Bundle is owned by the actor
      }
    } else {
      filters.push({ is_public: true }) // Bundle is public
      filters.push({
        bundle_purchases: { some: { user_id: actorUserId ?? "" } }, // Bundle is purchased by the actor
      })
    }

    const result = await prisma.bundles.findMany({
      select: {
        id: true,
      },
      where: {
        OR: filters,
        name: { contains: searchQuery, mode: "insensitive" },
      },
      skip: offset,
      take: limit,
    })
    bundleIds = result.map((bundle) => bundle.id)
  } else {
    const result = await prisma.bundle_purchases.findMany({
      select: {
        bundle_id: true,
      },
      where: {
        user_id: actorUserId ?? "",
      },
      skip: offset,
      take: limit,
    })
    bundleIds = result.map((bundle) => bundle.bundle_id)
  }

  const bundles = await expandBundles(actorUserId, bundleIds)

  return bundles
}
