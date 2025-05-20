"use server"

import { z } from "zod"
import { getComponentBundles } from "./server/components"

const getComponentBundlesSchema = z.object({
  componentId: z.number().int().positive(),
})

export const getComponentBundlesAction = async (
  input: z.infer<typeof getComponentBundlesSchema>,
) => {
  const { componentId } = getComponentBundlesSchema.parse(input)
  return getComponentBundles(componentId)
}
