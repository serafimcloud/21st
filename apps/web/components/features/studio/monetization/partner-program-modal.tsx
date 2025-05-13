"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ExternalLink, Check, AlertCircle } from "lucide-react"
import { useAtom } from "jotai"
import { userStateAtom } from "@/lib/store/user-store"
import { partnerModalOpenAtom } from "@/app/studio/[username]/analytics/page.client"
import { useQuery } from "@tanstack/react-query"
import { useClerkSupabaseClient } from "@/lib/clerk"

export function PartnerProgramModal() {
  const [open, setOpen] = useAtom(partnerModalOpenAtom)
  const [userState] = useAtom(userStateAtom)
  const isPartner = userState?.profile?.is_partner || false
  const userId = userState?.profile?.id
  const supabase = useClerkSupabaseClient()

  // Fetch published components count
  const { data: userComponentsCounts } = useQuery({
    queryKey: ["user-components-counts", userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase.rpc("get_user_components_counts", {
        p_user_id: userId,
      })
      if (error) throw error
      return data as {
        published_count: number
        demos_count: number
        liked_count: number
      }
    },
    enabled: !!userId && !isPartner,
    staleTime: 30 * 1000,
    retry: false,
  })

  const publishedCount = userComponentsCounts?.published_count || 0
  const hasEnoughComponents = publishedCount >= 5

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isPartner ? "Partner Program Status" : "Join Partner Program"}
          </DialogTitle>
        </DialogHeader>

        {isPartner ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-500">
              <Check className="h-5 w-5" />
              <p>Active Partner Status</p>
            </div>
            <p>
              Your components are eligible to earn revenue when viewed and used
              by others.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p>
              Earn revenue when users view and use your components, or when
              Magic MCP draws inspiration from your designs.
            </p>

            {!hasEnoughComponents && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-700 dark:text-amber-400">
                    You need at least 5 published components to join the partner
                    program. You currently have {publishedCount}{" "}
                    {publishedCount === 1 ? "component" : "components"}.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {isPartner ? "Close" : "Cancel"}
            </Button>

            {!isPartner && (
              <Button
                onClick={() => {
                  window.open("https://cal.com/serafimcloud/21st.dev", "_blank")
                }}
                className="gap-2"
                disabled={!hasEnoughComponents}
              >
                Book an onboarding call
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
