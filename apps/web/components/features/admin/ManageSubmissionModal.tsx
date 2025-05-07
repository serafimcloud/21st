import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FC } from "react"
import { Submission } from "./types"

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
    rejected: `Your component does not follow our quality guidelines. Please review our guidelines at https://github.com/serafimcloud/21st?tab=readme-ov-file#quality-guidelines and consider resubmitting after making the necessary improvements.`,
    posted: `Your component has been published and is now available via direct link. However, it's not featured in public listings yet as it doesn't fully meet our quality guidelines. It's still accessible through your profile and direct links.`,
    featured: `Congratulations! Your component has been featured and is now visible on the homepage and in public listings.`,
    on_review: `Your component is currently under review. We'll get back to you soon with feedback.`,
  }

  const applyTemplate = (status: string) => {
    onStatusChange(status)
    onFeedbackChange(
      feedbackTemplates[status as keyof typeof feedbackTemplates],
    )
  }

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
      <div className="bg-card text-card-foreground rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-lg">
        <h2 className="text-xl font-bold mb-4">
          Manage Submission: {submission.component_data.name}{" "}
          {submission.name && `| ${submission.name}`}
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Status</label>
          <Select
            value={submission.submission_status || "on_review"}
            onValueChange={applyTemplate}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on_review">On Review</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Feedback to Author
          </label>
          <Textarea
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            placeholder="Provide feedback to the author"
            className="h-32"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}

export default ManageSubmissionModal
