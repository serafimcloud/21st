import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { PlusCircle } from "lucide-react"
import { Spinner } from "@/components/icons/spinner"
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackProviderProps,
  useSandpack,
} from "@codesandbox/sandpack-react"
import { useTheme } from "next-themes"

// Custom component that monitors code changes in the editor
function CodeEditorWithUpdates() {
  const { sandpack } = useSandpack()

  // When files change in sandpack (from user editing), update the parent
  useEffect(() => {
    const activeFile = sandpack.activeFile
    const code = sandpack.files[activeFile]?.code || ""

    // Update the parent state using the updateFile to notify parent
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("SANDPACK_CODE_CHANGE", { detail: { code } }),
      )
    }
  }, [sandpack.files, sandpack.activeFile])

  return <SandpackCodeEditor />
}

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
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const [sandpackKey, setSandpackKey] = useState(Date.now())

  // Listen for code changes from the Sandpack editor
  useEffect(() => {
    const handleCodeChange = (event: CustomEvent) => {
      const { code } = event.detail
      setComponentCode(code)
    }

    window.addEventListener(
      "SANDPACK_CODE_CHANGE",
      handleCodeChange as EventListener,
    )

    return () => {
      window.removeEventListener(
        "SANDPACK_CODE_CHANGE",
        handleCodeChange as EventListener,
      )
    }
  }, [])

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

  const defaultCode = `export default function Component() {
  return (
    <div>
      {/* Your component code here */}
    </div>
  )
}`

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setComponentCode("")
      setProcessedData(null)
    } else {
      // Force re-mount of Sandpack when dialog opens
      setSandpackKey(Date.now())
    }
  }

  const sandpackFiles = {
    "/App.tsx": componentCode || defaultCode,
  }

  const providerProps: SandpackProviderProps = {
    theme: isDarkTheme ? "dark" : "light",
    template: "react-ts",
    files: sandpackFiles,
    options: {
      activeFile: "/App.tsx",
      visibleFiles: ["/App.tsx"],
    },
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Publish Component
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[800px] h-[80vh] flex flex-col"
        hideCloseButton
      >
        <DialogHeader className="flex flex-row items-start justify-between border-b pb-4">
          <div>
            <DialogTitle>Publish New Component</DialogTitle>
            <DialogDescription>
              Enter your component code below. Make sure it follows our
              guidelines and includes all necessary imports.
            </DialogDescription>
          </div>
          <Button
            onClick={handlePreprocess}
            disabled={isProcessing || !componentCode.trim()}
            className="ml-auto !mt-0"
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
        </DialogHeader>

        <div className="flex-grow overflow-hidden flex flex-col h-full py-4">
          <div className="h-full min-h-[500px] rounded-md border overflow-hidden">
            <SandpackProvider key={sandpackKey} {...providerProps}>
              <CodeEditorWithUpdates />
            </SandpackProvider>
          </div>

          {processedData && (
            <div className="mt-4 rounded-md border p-4 overflow-auto max-h-[200px]">
              <h3 className="mb-2 font-medium">Processed Component Data:</h3>
              <pre className="text-xs">
                {JSON.stringify(processedData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
