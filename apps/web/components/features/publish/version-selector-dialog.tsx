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

  const handleStableVersion = () => {
    router.push("/publish")
    onOpenChange(false)
  }

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
        className="sm:max-w-[650px] bg-background p-0 rounded-xl shadow-lg border-none"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          {/* Beta Version - Dark Card */}
          <div className="group p-1 pr-0 pb-4 bg-black text-white rounded-l-xl">
            <div className="flex flex-col h-full">
              <div className="flex-grow rounded-l-lg bg-gradient-to-b from-white/5 to-white/10 p-4 mb-4 border border-r-transparent border-white/10">
                <div className="flex flex-col items-start gap-2 mb-4 pl-2">
                  <FlaskRound className="h-7 w-7 text-white" />
                  <h3 className="font-semibold">Beta Version</h3>
                </div>

                <ul className="space-y-0 divide-y divide-white/10">
                  <li className="flex items-center gap-2 py-2 px-2">
                    <Check className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-sm">Tailwind 4 support</span>
                  </li>
                  <li className="flex items-center gap-2 py-2 px-2">
                    <Check className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-sm">Draft mode</span>
                  </li>
                  <li className="flex items-center gap-2 py-2 px-2">
                    <Check className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-sm">Developer-friendly</span>
                  </li>
                  <li className="flex items-start gap-2 py-2 px-2 text-yellow-400">
                    <span className="shrink-0 mt-[-3] mx-1">•</span>
                    <span className="text-sm">May contain minor bugs</span>
                  </li>
                  <li className="flex items-start gap-2 py-2 px-2 text-yellow-400">
                    <span className="shrink-0 mt-[-3] mx-1">•</span>
                    <span className="text-sm">
                      Doesn't support component dependencies
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-auto pl-2 pr-3">
                <Button
                  onClick={handleBetaVersion}
                  disabled={isCreating}
                  className={cn(
                    "whitespace-nowrap w-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border-none",
                    isCreating ? "" : "pr-1.5",
                  )}
                >
                  {isCreating ? (
                    <div className="flex items-center gap-2">
                      <Spinner size={16} color="white" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <>Continue</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Stable Version - Light Card */}
          <div className="group p-1 pl-0 pb-4 bg-gray-100 text-black rounded-r-xl dark:bg-gray-50">
            <div className="flex flex-col h-full">
              <div className="flex-grow rounded-r-lg bg-gradient-to-b from-black/[0.02] to-black/[0.05] p-4 mb-4 border border-l-transparent border-black/10">
                <div className="flex flex-col items-start gap-2 mb-4 pl-2">
                  <Shield className="h-7 w-7 text-black" />
                  <h3 className="font-semibold">Stable Version</h3>
                </div>

                <ul className="space-y-0 divide-y divide-black/10">
                  <li className="flex items-center gap-2 py-2 px-2">
                    <Check className="h-4 w-4 text-gray-600 shrink-0" />
                    <span className="text-sm">
                      Supports component dependencies
                    </span>
                  </li>
                  <li className="flex items-center gap-2 py-2 px-2">
                    <Check className="h-4 w-4 text-gray-600 shrink-0" />
                    <span className="text-sm">Support multiple demos</span>
                  </li>
                  <li className="flex items-center gap-2 py-2 px-2">
                    <Check className="h-4 w-4 text-gray-600 shrink-0" />
                    <span className="text-sm">Non-developer friendly</span>
                  </li>
                  <li className="flex items-center gap-2 py-2 px-2 text-yellow-600">
                    <span className="shrink-0 mt-[-3] mx-1">•</span>
                    <span className="text-sm">No Tailwind 4 support</span>
                  </li>
                  <li className="flex items-center gap-2 py-2 px-2 text-yellow-600">
                    <span className="shrink-0 mt-[-3] mx-1">•</span>
                    <span className="text-sm">No draft mode</span>
                  </li>
                </ul>
              </div>

              <div className="mt-auto pl-3 pr-2">
                <Button
                  onClick={handleStableVersion}
                  variant="outline"
                  className="w-full whitespace-nowrap bg-black/5 text-black hover:bg-black/10 backdrop-blur-sm border border-black/20"
                  disabled={isCreating}
                >
                  <span>Continue</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
