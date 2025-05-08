import { useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, Loader2, ShieldAlert, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
}: DeleteAccountDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDeleteAccount() {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete account")
      }

      toast.success("Your account data has been deleted")

      // Show message about needing to delete the Clerk account
      toast.success("Please visit your account settings to complete deletion", {
        duration: 5000,
        action: {
          label: "Go to Account Settings",
          onClick: () => window.open(result.clerkAccountUrl, "_blank"),
        },
      })
    } catch (error) {
      console.error("Delete account error:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account",
      )
    } finally {
      setIsDeleting(false)
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[450px] p-0 gap-0 overflow-hidden border-destructive/20">
        <div className="bg-destructive/5 p-6 border-b border-destructive/10">
          <AlertDialogHeader className="gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold text-destructive">
                Delete Account Permanently
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-destructive/80">
              This action cannot be undone. Please read carefully before
              proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">
              Deleting your account will:
            </h4>
            <ul className="space-y-2">
              {[
                "Permanently remove all your profile information",
                "Delete all your saved components and projects",
                "Remove your access to any paid features",
                "Cannot be undone or recovered",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <div className="mt-0.5 h-5 w-5 flex-shrink-0 flex items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={cn(
              "rounded-md border border-destructive/30 bg-destructive/5 p-4",
              "flex items-start gap-3",
            )}
          >
            <Trash2 className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-sm text-destructive">
                Are you absolutely sure you want to proceed?
              </p>
              <p className="text-xs text-muted-foreground">
                Once deleted, your data cannot be recovered by our support team.
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-border/60" />

        <div className="p-6 pt-4 flex justify-between">
          <Button
            variant="ghost"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              "Delete Permanently"
            )}
          </Button>

          <Button
            variant="default"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
