import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FC } from "react"
import { Submission } from "./types"

interface EditDemoModalProps {
  submission: Submission
  demoName: string
  demoSlug: string
  onDemoNameChange: (name: string) => void
  onDemoSlugChange: (slug: string) => void
  onClose: () => void
  onSave: () => void
}

const EditDemoModal: FC<EditDemoModalProps> = ({
  submission,
  demoName,
  demoSlug,
  onDemoNameChange,
  onDemoSlugChange,
  onClose,
  onSave,
}) => {
  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
      <div className="bg-card text-card-foreground rounded-lg p-6 max-w-md w-full border shadow-lg">
        <h2 className="text-xl font-bold mb-4">Edit Demo Information</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Demo Name</label>
          <Input
            value={demoName}
            onChange={(e) => onDemoNameChange(e.target.value)}
            placeholder="Demo name"
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Demo Slug</label>
          <Input
            value={demoSlug}
            onChange={(e) => onDemoSlugChange(e.target.value)}
            placeholder="demo-slug"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            URL will be: /{submission.user_data.username}/
            {submission.component_data.component_slug}/{demoSlug}
          </p>
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

export default EditDemoModal
