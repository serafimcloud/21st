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
import { Spinner } from "@/components/icons/spinner"

interface PublishDialogProps {
  userId: string
}

export function PublishDialog({ userId }: PublishDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [componentCode, setComponentCode] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedData, setProcessedData] = useState<any>(null)
  const supabase = useClerkSupabaseClient()
  const router = useRouter()

  const handlePreprocess = async () => {
    if (!componentCode.trim()) {
      toast.error("Please enter component code")
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/studio/preprocess-component", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: componentCode,
          userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process component")
      }

      const data = await response.json()
      setProcessedData(data)
      toast.success("Component processed successfully")
    } catch (error) {
      toast.error("Failed to process component")
      console.error("Error processing component:", error)
    } finally {
      setIsProcessing(false)
    }
  }

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
        name: processedData?.componentName || "New Component", // Use processed data if available
        component_names: {}, // Required field
        component_slug: processedData?.slug || "new-component", // Use processed slug if available
        preview_url: "https://placeholder.com", // Required field
        user_id: userId, // Use the target user ID
        direct_registry_dependencies: {}, // Required field
        demo_direct_registry_dependencies: {}, // Required field
      })

      if (error) throw error

      toast.success("Component published successfully")
      setIsOpen(false)
      setComponentCode("")
      setProcessedData(null)
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

          <div className="flex gap-2">
            <Button
              onClick={handlePreprocess}
              disabled={isProcessing || !componentCode.trim()}
              className="flex-1"
              variant="outline"
            >
              {isProcessing ? (
                <>
                  <span className="mr-2">
                    <Spinner size={16} />
                  </span>
                  Processing...
                </>
              ) : (
                "Process Component"
              )}
            </Button>

            <Button
              onClick={handlePublish}
              disabled={isPublishing || !componentCode.trim()}
              className="flex-1"
            >
              {isPublishing ? (
                <>
                  <span className="mr-2">
                    <Spinner size={16} />
                  </span>
                  Publishing...
                </>
              ) : (
                "Publish Component"
              )}
            </Button>
          </div>

          {processedData && (
            <div className="mt-4 rounded-md border p-4">
              <h3 className="mb-2 font-medium">Processed Component Data:</h3>
              <pre className="max-h-[200px] overflow-auto rounded-md bg-slate-100 p-2 text-xs">
                {JSON.stringify(processedData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
