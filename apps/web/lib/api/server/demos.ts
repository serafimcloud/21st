import prisma from "@/lib/prisma"
import "server-only"
import { hasUserComponentAccess } from "./components"

export const hasUserPurchasedDemo = async (
  userId: string | null,
  demoId: number,
) => {
  const demo = await prisma.demos.findUnique({
    where: {
      id: demoId,
    },
  })

  if (!demo) {
    return false
  }

  const hasPurchasedComponent = await hasUserComponentAccess(
    userId,
    demo.component_id,
  )

  return hasPurchasedComponent
}
