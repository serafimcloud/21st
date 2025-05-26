import { PrismaClient } from "@/prisma/client"

console.log(JSON.stringify(process.env, null, 2))

const prisma = new PrismaClient()

export default prisma
