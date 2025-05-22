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

export const getDemos = async (search?: string) => {
  const demos = await prisma.demos.findMany({
    where: {
      components: {
        is_public: true,
        name: search ? { contains: search, mode: "insensitive" } : undefined,
      },
    },
    include: {
      components: {
        include: {
          users_components_user_idTousers: true,
        },
      },
    },
  })

  return demos
}
