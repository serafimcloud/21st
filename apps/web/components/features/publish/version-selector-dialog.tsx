"use client"

import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, FlaskRound, Shield } from "lucide-react"
import { Spinner } from "@/components/icons/spinner"

import { cn } from "@/lib/utils"

interface VersionSelectorDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  username?: string
  onCreateSandbox?: () => Promise<void>
  isCreating?: boolean
}

export function VersionSelectorDialog({
  isOpen,
  onOpenChange,
  username,
  onCreateSandbox,
  isCreating = false,
}: VersionSelectorDialogProps) {
  const router = useRouter()

  // const handleStableVersion = () => {
  //   router.push("/publish")
  //   onOpenChange(false)
  // }

  const handleBetaVersion = async () => {
    if (onCreateSandbox) {
      // Don't close the dialog - let the creation finish while showing loading state
      // The parent component will handle closing the dialog after creation
      await onCreateSandbox()
    } else {
      if (username) {
        router.push(`/studio/${username}?beta=true`)
      } else {
        router.push("/studio?beta=true")
      }
      onOpenChange(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isCreating) {
          onOpenChange(open)
        }
      }}
    >
      <DialogContent
        hideCloseButton
        className="sm:max-w-[400px] bg-background p-0 rounded-xl shadow-lg border-none"
      >
        <div className="grid grid-cols-1 gap-0">
          {/* New Flow Card */}
          <div className="group p-1 pb-4 bg-muted text-foreground rounded-xl">
            <div className="flex flex-col h-full">
              <div className="flex-grow rounded-lg p-4 mb-4 border border-muted-foreground/20">
                <div className="flex flex-col items-start gap-2 mb-4 pl-2">
                  <FlaskRound className="h-7 w-7 text-foreground" />
                  <h3 className="font-semibold">Publish 2.0 (Beta)</h3>
                </div>

                <ul className="space-y-0 divide-y divide-muted-foreground/20">
                  <li className="flex items-center gap-2 py-2 px-2">
                    <Check className="h-4 w-4 text-foreground/70 shrink-0" />
                    <span className="text-sm">
                      Dedicated sandbox per project
                    </span>
                  </li>
                  <li className="flex items-center gap-2 py-2 px-2">
                    <Check className="h-4 w-4 text-foreground/70 shrink-0" />
                    <span className="text-sm">
                      Add components from 21st registry
                    </span>
                  </li>

                  <li className="flex items-center gap-2 py-2 px-2">
                    <Check className="h-4 w-4 text-foreground/70 shrink-0" />
                    <span className="text-sm">
                      Developer-friendly experience
                    </span>
                  </li>
                  <li className="flex items-center gap-2 py-2 px-2">
                    <Check className="h-4 w-4 text-foreground/70 shrink-0" />
                    <span className="text-sm">Built-in code editor</span>
                  </li>
                  <li className="flex items-center gap-2 py-2 px-2">
                    <Check className="h-4 w-4 text-foreground/70 shrink-0" />
                    <span className="text-sm">Tailwind 4 support</span>
                  </li>
                  <li className="flex items-center gap-2 py-2 px-2">
                    <Check className="h-4 w-4 text-foreground/70 shrink-0" />
                    <span className="text-sm">Draft mode</span>
                  </li>
                  <li className="flex items-start gap-2 py-2 px-2 text-amber-500">
                    <span className="shrink-0 mt-[-3] mx-1">•</span>
                    <span className="text-sm">May contain minor bugs</span>
                  </li>
                </ul>
              </div>

              <div className="mt-auto px-3">
                <Button
                  onClick={handleBetaVersion}
                  disabled={isCreating}
                  className={cn(
                    "whitespace-nowrap w-full bg-primary/80 text-primary-foreground hover:bg-primary/90 backdrop-blur-sm border-none",
                    isCreating ? "" : "pr-1.5",
                  )}
                >
                  {isCreating ? (
                    <div className="flex items-center gap-2">
                      <Spinner size={16} color="white" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <>Create Component</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
