import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FC, useEffect } from "react"
import { Submission } from "./types"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface ManageSubmissionModalProps {
  submission: Submission
  feedback: string
  onFeedbackChange: (feedback: string) => void
  onStatusChange: (status: string) => void
  onClose: () => void
  onSave: () => void
}

const ManageSubmissionModal: FC<ManageSubmissionModalProps> = ({
  submission,
  feedback,
  onFeedbackChange,
  onStatusChange,
  onClose,
  onSave,
}) => {
  const feedbackTemplates = {
    on_review: `Your component is currently under review. We'll get back to you soon with feedback.`,
    posted: `Your component has been published and is now available via direct link. However, it's not featured in public listings yet as it doesn't fully meet our quality guidelines. It's still accessible through your profile and direct links.`,
    featured: `Congratulations! Your component has been featured and is now visible on the homepage and in public listings.`,
    rejected: `Your component does not follow our quality guidelines. Please review our guidelines at https://github.com/serafimcloud/21st?tab=readme-ov-file#quality-guidelines and consider resubmitting after making the necessary improvements.`,
  }

  const hotkeyMap = {
    "1": "on_review",
    "2": "posted",
    "3": "featured",
    "4": "rejected",
  }

  const applyTemplate = (status: string) => {
    onStatusChange(status)
    onFeedbackChange(
      feedbackTemplates[status as keyof typeof feedbackTemplates],
    )
  }

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key
      if (hotkeyMap[key as keyof typeof hotkeyMap]) {
        event.preventDefault() // Prevent default to avoid number being typed
        applyTemplate(hotkeyMap[key as keyof typeof hotkeyMap])
      } else if (key === "Enter" && !event.shiftKey) {
        event.preventDefault()
        onSave()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [onSave])

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "on_review":
        return "bg-yellow-200 text-yellow-800"
      case "posted":
        return "bg-green-200 text-green-800"
      case "featured":
        return "bg-blue-200 text-blue-800"
      case "rejected":
        return "bg-red-200 text-red-800"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }

  const getHotkeyForStatus = (status: string) => {
    for (const [key, value] of Object.entries(hotkeyMap)) {
      if (value === status) return key
    }
    return ""
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Manage Submission: {submission.component_data.name}{" "}
            {submission.name && `| ${submission.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.keys(feedbackTemplates).map((status) => (
                <Badge
                  key={status}
                  variant="outline"
                  className={cn(
                    "cursor-pointer pl-1 pr-2 py-1.5",
                    getStatusBadgeClass(status),
                    (submission.submission_status || "on_review") === status
                      ? "ring-2 ring-offset-2 ring-primary"
                      : "",
                  )}
                  onClick={() => applyTemplate(status)}
                >
                  <div className="flex items-center gap-1.5">
                    <kbd className="h-4 w-4 flex items-center justify-center p-3 bg-background/80 rounded-full text-[10px] border border-border">
                      {getHotkeyForStatus(status)}
                    </kbd>
                    <span className="text-sm">
                      {status === "on_review"
                        ? "On Review"
                        : status === "posted"
                          ? "Posted"
                          : status === "featured"
                            ? "Featured"
                            : "Rejected"}
                    </span>
                  </div>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Feedback to Author</Label>
            <Textarea
              value={feedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  onSave()
                }
              }}
              placeholder="Provide feedback to the author"
              className="h-32 mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ManageSubmissionModal
