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
import { Check, Beaker } from "lucide-react"
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Choose Publishing Method</DialogTitle>
          <DialogDescription>
            Select which method you'd like to use to publish your component
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="flex flex-col gap-4 border rounded-lg p-6">
            <div className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-blue-500" />
              <h3 className="font-medium">Beta Version</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Our new publishing experience with support for Tailwind 4 and
              drafts. May contain some bugs as it's still in development.
            </p>
            <Button
              onClick={handleBetaVersion}
              className="mt-auto w-full transition-all"
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

          <div className="flex flex-col gap-4 border border-border rounded-lg p-6">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <h3 className="font-medium">Stable Version</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Our traditional publishing experience. More stable but doesn't
              support Tailwind 4 and drafts.
            </p>
            <Button
              onClick={handleStableVersion}
              variant="outline"
              className="mt-auto"
              disabled={isCreating}
            >
              Use Stable
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
