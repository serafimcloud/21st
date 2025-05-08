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
import { ExternalLink, Check } from "lucide-react"
import { useAtom } from "jotai"
import { userStateAtom } from "@/lib/store/user-store"
import { partnerModalOpenAtom } from "@/app/studio/[username]/analytics/page.client"

export function PartnerProgramModal() {
  const [open, setOpen] = useAtom(partnerModalOpenAtom)
  const [userState] = useAtom(userStateAtom)
  const isPartner = userState?.profile?.is_partner || false

  // Debug information
  console.log("Partner Program Modal - isPartner:", isPartner)
  console.log("Partner Program Modal - userState:", userState?.profile)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isPartner ? "Partner Program Status" : "Join our Partner Program"}
          </DialogTitle>
          <DialogDescription>
            {isPartner
              ? "You are currently part of the 21st.dev Partner Program"
              : "Earn revenue when your components are viewed and used on 21st.dev"}
          </DialogDescription>
        </DialogHeader>

        {isPartner ? (
          <div className="space-y-4 py-2 text-sm">
            <div className="flex items-center gap-2 text-green-500">
              <Check className="h-5 w-5" />
              <p className="font-medium">Active Partner Status</p>
            </div>
            <p>
              Thank you for being part of our partner program. Your components
              are eligible to earn revenue when they are viewed and used by
              others.
            </p>
            <p>
              You can view your earnings and analytics in the Analytics section.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2 text-sm">
            <p>
              At 21st.dev, we believe in supporting our component authors. When
              users view and use your components, or when Magic MCP draws
              inspiration from your designs, you earn a share of the revenue.
            </p>
            <p>
              To join our partner program and start monetizing your components,
              book a short call with our team to discuss the details.
            </p>
          </div>
        )}

        <DialogFooter className="sm:justify-start">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-0 w-full sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="sm:mr-2"
            >
              {isPartner ? "Close" : "Cancel"}
            </Button>

            {!isPartner && (
              <Button
                type="button"
                onClick={() => {
                  window.open("https://cal.com/serafimcloud/21st.dev", "_blank")
                }}
                className="gap-2"
              >
                Book a Call
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
