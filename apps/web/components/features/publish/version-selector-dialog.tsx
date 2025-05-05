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
import { Check } from "lucide-react"
import { Spinner } from "@/components/icons/spinner"

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
      <DialogContent className="sm:max-w-[500px] bg-background ring-1 ring-border rounded-xl shadow-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Choose Publishing Method
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Select which method you'd like to use to publish your component
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="group">
            <div className="flex flex-col justify-between rounded-lg bg-muted/50 p-4 h-full border">
              <div>
                <div className="mb-3">
                  <h3 className="text-lg font-semibold">Beta Version</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-400" />
                    Tailwind 4 support
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-400" />
                    Draft mode
                  </li>
                  <li className="flex items-center gap-2 text-yellow-600/70 dark:text-yellow-500/70">
                    <span className="text-sm">•</span>
                    May contain minor bugs
                  </li>
                </ul>
              </div>
              <Button
                onClick={handleBetaVersion}
                className="mt-4 w-full"
                disabled={isCreating}
              >
                <div className="flex items-center gap-2 justify-center">
                  {isCreating ? (
                    <>
                      <Spinner size={16} color="white" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Use Beta</span>
                  )}
                </div>
              </Button>
            </div>
          </div>

          <div className="group">
            <div className="flex flex-col justify-between rounded-lg bg-muted/50 p-4 h-full border">
              <div>
                <div className="mb-3">
                  <h3 className="text-lg font-semibold">Stable Version</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    Proven reliability
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    Traditional workflow
                  </li>
                  <li className="flex items-center gap-2 text-yellow-600/70 dark:text-yellow-500/70">
                    <span className="text-sm">•</span>
                    No Tailwind 4 support
                  </li>
                </ul>
              </div>
              <Button
                onClick={handleStableVersion}
                variant="outline"
                className="mt-4 w-full"
                disabled={isCreating}
              >
                Use Stable
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
