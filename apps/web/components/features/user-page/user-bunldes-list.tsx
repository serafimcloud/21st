import { useClerkSupabaseClient } from "@/lib/clerk"
import { useAtom } from "jotai"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { BundlesLayout } from "../bundles/bundles-layout"
import { userPageSearchAtom } from "./user-page-header"

export function UserBundlesList({ userId }: { userId: string }) {
  const [searchQuery, setSearchQuery] = useAtom(userPageSearchAtom)
  const supabase = useClerkSupabaseClient()
  const router = useRouter()

  useEffect(() => {
    return () => {
      setSearchQuery("")
    }
  }, [])

  useHotkeys(
    "mod+enter",
    (e) => {
      e.preventDefault()
      handleGlobalSearch()
    },
    {
      enableOnFormTags: true,
      preventDefault: true,
    },
    [searchQuery],
  )

  const handleGlobalSearch = () => {
    if (!searchQuery) return
    router.push(`/q/${encodeURIComponent(searchQuery)}`)
  }

  return <BundlesLayout onlyOwned={true} searchQuery={searchQuery} />
}
