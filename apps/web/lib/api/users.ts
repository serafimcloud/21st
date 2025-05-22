"use server"

import { z } from "zod"
import { getUsers } from "./server/users"

const getUsersActionSchema = z.object({
  searchQuery: z.string().optional(),
})

export async function getUsersAction(
  input: z.infer<typeof getUsersActionSchema>,
) {
  const { searchQuery } = getUsersActionSchema.parse(input)
  return getUsers({ searchQuery })
}
