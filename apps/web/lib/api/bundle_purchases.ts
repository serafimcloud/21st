"use server"

import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { hasUserComponentAccess } from "./server/components"

const hasUserComponentAccessSchema = z.object({
  componentId: z.number().int().nonnegative(),
})

export const hasUserComponentAccessAction = async (
  input: z.infer<typeof hasUserComponentAccessSchema>,
) => {
  const { componentId } = hasUserComponentAccessSchema.parse(input)
  const { userId } = await auth()
  return hasUserComponentAccess(userId, componentId)
}
