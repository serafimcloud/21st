import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { PlusCircle } from "lucide-react"

interface PublishDialogProps {
  userId: string
}

export function PublishDialog({ userId }: PublishDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [componentCode, setComponentCode] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)
  const supabase = useClerkSupabaseClient()
  const router = useRouter()

  const handlePublish = async () => {
    if (!componentCode.trim()) {
      toast.error("Please enter component code")
      return
    }

    setIsPublishing(true)
    try {
      // Here you would add the logic to parse and validate the component code
      // Then save it to the database
      const { error } = await supabase.from("components").insert({
        code: componentCode,
        name: "New Component", // Required field
        component_names: {}, // Required field
        component_slug: "new-component", // Required field
        preview_url: "https://placeholder.com", // Required field
        user_id: userId, // Use the target user ID
        direct_registry_dependencies: {}, // Required field
        demo_direct_registry_dependencies: {}, // Required field
      })

      if (error) throw error

      toast.success("Component published successfully")
      setIsOpen(false)
      setComponentCode("")
      router.refresh()
    } catch (error) {
      toast.error("Failed to publish component")
      console.error("Error publishing component:", error)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Publish Component
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Publish New Component</DialogTitle>
          <DialogDescription>
            Paste your component code below. Make sure it follows our guidelines
            and includes all necessary imports.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Paste your component code here..."
            value={componentCode}
            onChange={(e) => setComponentCode(e.target.value)}
            className="h-[400px] font-mono"
          />
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            className="w-full"
          >
            {isPublishing ? "Publishing..." : "Publish Component"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
