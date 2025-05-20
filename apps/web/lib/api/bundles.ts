"use server"

import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import prisma from "../prisma"
import { BundleExpanded, getBundles } from "./server/bundles"

export type { BundleExpanded }

const getBundlesActionSchema = z.object({
  authorId: z.string().optional(),
  onlyOwned: z.boolean().optional(),
  searchQuery: z.string().optional(),
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().nonnegative().optional(),
})

export const getBundlesAction = async (
  input: z.infer<typeof getBundlesActionSchema>,
): Promise<BundleExpanded[]> => {
  const { authorId, searchQuery, onlyOwned, offset, limit } =
    getBundlesActionSchema.parse(input)

  const { userId } = await auth()
  let bundles = await getBundles(
    userId,
    authorId,
    searchQuery,
    onlyOwned,
    offset,
    limit,
  )
  const purchasedBundles = await prisma.bundle_purchases.findMany({
    where: {
      user_id: userId ?? "",
      status: "paid",
    },
  })

  // Obfuscate sources for not purchased bundles
  bundles.forEach((bundle) => {
    const isPurchased = purchasedBundles.some(
      (purchase) => purchase.bundle_id === bundle.id,
    )
    if (!isPurchased) {
      bundle.bundle_items.forEach((item) => {
        item.components.code = ""
        item.components.registry_url = ""
        item.components.index_css_url = ""
        item.components.demos.forEach((demo) => {
          demo.demo_code = ""
        })
      })
    }
  })

  return bundles
}
