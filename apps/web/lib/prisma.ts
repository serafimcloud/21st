import { PrismaClient } from "@/prisma/client"

console.log("DATABASE_URL", process.env.DATABASE_URL)
console.log("DIRECT_DATABASE_URL", process.env.DIRECT_DATABASE_URL)

let prisma: PrismaClient
try {
  prisma = new PrismaClient()
} catch (error) {
  console.error("Failed to connect to database", JSON.stringify(error, null, 2))
}

export default prisma!
