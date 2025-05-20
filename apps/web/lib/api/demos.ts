"use server"

import { getDemos } from "@/lib/api/server/demos"
import { z } from "zod"

const getDemosActionSchema = z.object({
  searchQuery: z.string().optional(),
})

// TODO: Obfuscate code
export const getDemosAction = async (
  input: z.infer<typeof getDemosActionSchema>,
) => {
  const { searchQuery } = getDemosActionSchema.parse(input)
  return getDemos(searchQuery)
}
