import { FC, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash, AlertCircle } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type DeleteMode = "submission" | "component" | null

interface DeleteComponentDialogProps {
  isOpen: boolean
  onClose: () => void
  onDelete: (mode: DeleteMode) => Promise<void>
  componentName: string
  isDeleting: boolean
}

const DeleteComponentDialog: FC<DeleteComponentDialogProps> = ({
  isOpen,
  onClose,
  onDelete,
  componentName,
  isDeleting,
}) => {
  const [deleteMode, setDeleteMode] = useState<DeleteMode>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteMode) {
      setError("Please select a deletion mode")
      return
    }

    try {
      setError(null)
      await onDelete(deleteMode)
    } catch (err) {
      setError("Failed to delete component. Please try again.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash size={18} />
            Delete Component
          </DialogTitle>
          <DialogDescription>
            You are about to delete "{componentName}". This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="delete-mode">Delete mode</Label>
            <Select
              onValueChange={(value) => setDeleteMode(value as DeleteMode)}
            >
              <SelectTrigger id="delete-mode">
                <SelectValue placeholder="Select deletion mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submission">
                  Remove from submissions only
                </SelectItem>
                <SelectItem value="component">
                  Delete component completely
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {deleteMode === "submission"
                ? "This will only remove the component from the submissions list, but keep the component itself."
                : deleteMode === "component"
                  ? "This will permanently delete the component, all its demos, and code from the database."
                  : "Please select a deletion mode"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!deleteMode || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteComponentDialog
