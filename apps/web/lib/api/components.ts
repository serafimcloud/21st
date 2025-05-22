"use server"

import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { getComponentBundles, transferOwnership } from "./server/components"
import { checkIsAdmin } from "./server/users"

const getComponentBundlesSchema = z.object({
  componentId: z.number().int().positive(),
})

export const getComponentBundlesAction = async (
  input: z.infer<typeof getComponentBundlesSchema>,
) => {
  const { componentId } = getComponentBundlesSchema.parse(input)
  return getComponentBundles(componentId)
}

const transferOwnershipSchema = z.object({
  componentId: z.number().int().positive(),
  userId: z.string(),
})

export const transferOwnershipAction = async (
  input: z.infer<typeof transferOwnershipSchema>,
) => {
  const { userId: actorUserId } = await auth()
  const isAdmin = await checkIsAdmin(actorUserId)
  if (!isAdmin) {
    throw new Error("You are not authorized to transfer ownership")
  }
  const { componentId, userId } = transferOwnershipSchema.parse(input)
  return transferOwnership(componentId, userId)
}
