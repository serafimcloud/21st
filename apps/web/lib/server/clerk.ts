"use server"

import { verifyToken } from "@clerk/nextjs/server"

export const verifyJwtToken = async (jwt: string) => {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY is not set")
  }

  return verifyToken(jwt, {
    secretKey: process.env.CLERK_SECRET_KEY,
  })
}
