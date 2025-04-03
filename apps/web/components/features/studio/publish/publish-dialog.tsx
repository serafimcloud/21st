import { useState, useCallback, useMemo, useEffect } from "react"
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
  SandpackLayout,
  SandpackFileExplorer,
  SandpackFiles,
  useActiveCode,
  useSandpack,
  OpenInCodeSandboxButton,
} from "@codesandbox/sandpack-react"
import { useTheme } from "next-themes"

// Controlled component for code editing
function CodeEditor({
  onCodeChange,
  componentPath,
}: {
  onCodeChange: (code: string) => void
  componentPath: string
}) {
  const { code } = useActiveCode()
  const { sandpack } = useSandpack()

  useEffect(() => {
    if (code && sandpack.activeFile === componentPath) {
      onCodeChange(code)
    }
  }, [code, onCodeChange, sandpack.activeFile, componentPath])

  return (
    <SandpackCodeEditor
      showTabs={true}
      showLineNumbers={true}
      showInlineErrors={true}
      className="h-full"
      style={{ height: "100%" }}
      initMode="immediate"
    />
  )
}

// File explorer with controlled selection
function FileExplorer() {
  const { sandpack } = useSandpack()

  return (
    <div className="w-64 border-r overflow-auto">
      <div className="p-2 text-xs font-medium text-muted-foreground">
        Project Files
      </div>
      <SandpackFileExplorer />
    </div>
  )
}

interface PublishDialogProps {
  userId: string
}

export function PublishDialog({ userId }: PublishDialogProps) {
  // Dialog state
  const [open, setOpen] = useState(false)

  // Component data
  const [componentCode, setComponentCode] = useState("")
  const [processedData, setProcessedData] = useState<any>(null)

  // UI state
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // Services
  const router = useRouter()
  const supabase = useClerkSupabaseClient()
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"

  // Get component file path
  const getComponentFilePath = useCallback(() => {
    if (!processedData) return "/src/components/ui/component.tsx"

    const registryType = processedData.registryType || "ui"
    const fileName = processedData.slug
      ? `${processedData.slug}.tsx`
      : "component.tsx"
    return `/src/components/${registryType}/${fileName}`
  }, [processedData])

  // Create files structure
  const files = useMemo(() => {
    const componentPath = getComponentFilePath()
    const files: SandpackFiles = {
      [componentPath]: {
        code: componentCode,
      },
      "/package.json": {
        code: JSON.stringify(
          {
            name: "component-project",
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0",
              ...(processedData?.npmDependencies || []).reduce(
                (acc: Record<string, string>, dep: string) => ({
                  ...acc,
                  [dep]: "latest",
                }),
                {},
              ),
            },
          },
          null,
          2,
        ),
      },
      "/index.html": {
        code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Preview</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      },
      "/index.tsx": {
        code: `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
      },
      "/styles.css": {
        code: `* {
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
    "Helvetica Neue", sans-serif;
  margin: 0;
  padding: 1rem;
}`,
      },
      "/tsconfig.json": {
        code: JSON.stringify(
          {
            compilerOptions: {
              target: "es5",
              lib: ["dom", "dom.iterable", "esnext"],
              allowJs: true,
              skipLibCheck: true,
              esModuleInterop: true,
              allowSyntheticDefaultImports: true,
              strict: true,
              forceConsistentCasingInFileNames: true,
              noFallthroughCasesInSwitch: true,
              module: "esnext",
              moduleResolution: "node",
              resolveJsonModule: true,
              isolatedModules: true,
              noEmit: true,
              jsx: "react-jsx",
            },
            include: ["src"],
          },
          null,
          2,
        ),
      },
      "/App.tsx": {
        code: processedData
          ? `import ${processedData.componentName || "Component"} from "./src/components/${
              processedData.registryType || "ui"
            }/${processedData.slug?.replace(".tsx", "") || "component"}";

export default function App() {
  return (
    <div className="container">
      <${processedData.componentName || "Component"} />
    </div>
  );
}`
          : `import Component from "${getComponentFilePath().replace(".tsx", "")}";

export default function App() {
  return (
    <div className="container">
      <Component />
    </div>
  );
}`,
      },
    }
    return files
  }, [componentCode, processedData, getComponentFilePath])

  // Reset dialog state
  const resetState = useCallback(() => {
    setComponentCode("")
    setProcessedData(null)
    setIsProcessing(false)
    setIsPublishing(false)
  }, [])

  // Handle dialog open/close
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen)
      if (!isOpen) resetState()
    },
    [resetState],
  )

  // Process component
  const handleProcessComponent = async () => {
    if (!componentCode.trim()) {
      toast.error("Please enter component code")
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch("/api/studio/preprocess-component", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: componentCode, userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process component")
      }

      const data = await response.json()
      setProcessedData(data)
      toast.success("Component processed successfully")
    } catch (error) {
      toast.error(
        `Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
      console.error("Error processing component:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Publish component
  const handlePublishComponent = async () => {
    if (!componentCode.trim() || !processedData) {
      toast.error("Component must be processed before publishing")
      return
    }

    setIsPublishing(true)

    try {
      const { error } = await supabase.from("components").insert({
        code: componentCode,
        name: processedData.componentName || "New Component",
        component_names: {},
        component_slug: processedData.slug || "new-component",
        preview_url: "https://placeholder.com",
        user_id: userId,
        direct_registry_dependencies: {},
        demo_direct_registry_dependencies: {},
      })

      if (error) throw error

      toast.success("Component published successfully")
      setOpen(false)
      resetState()
      router.refresh()
    } catch (error) {
      toast.error(
        `Publishing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    } finally {
      setIsPublishing(false)
    }
  }

  // Sandpack configuration
  const sandpackConfig = useMemo(
    () => ({
      files,
      options: {
        activeFile: getComponentFilePath(),
        visibleFiles: Object.keys(files),
        recompileMode: "delayed" as const,
        recompileDelay: 300,
      },
      template: "react-ts" as const,
      theme: isDarkTheme ? ("dark" as const) : ("light" as const),
      customSetup: {
        dependencies:
          processedData?.npmDependencies?.reduce(
            (acc: Record<string, string>, dep: string) => ({
              ...acc,
              [dep]: "latest",
            }),
            {},
          ) || {},
      },
    }),
    [files, getComponentFilePath, isDarkTheme, processedData?.npmDependencies],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Publish Component
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[90vw] h-[80vh] flex flex-col"
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
            onClick={handleProcessComponent}
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
          {processedData && (
            <div className="mb-2 px-2 py-1 bg-muted text-muted-foreground text-xs rounded flex items-center">
              <span className="font-medium">Component processed:</span>
              <span className="ml-1">
                {processedData.componentName || "Component"}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {processedData.registryType || "ui"}/
                {processedData.slug || "component"}
              </span>
            </div>
          )}

          <div className="h-full min-h-[400px] rounded-md border overflow-hidden flex-grow">
            <SandpackProvider {...sandpackConfig}>
              <OpenInCodeSandboxButton />
              <SandpackLayout style={{ height: "100%" }}>
                <div className="flex w-full h-full">
                  <div className="w-64 border-r border-border">
                    <FileExplorer />
                  </div>
                  <div className="flex-1">
                    <CodeEditor
                      componentPath={getComponentFilePath()}
                      onCodeChange={setComponentCode}
                    />
                  </div>
                </div>
              </SandpackLayout>
            </SandpackProvider>
          </div>

          <div className="mt-4 flex justify-end">
            {processedData && (
              <Button
                onClick={handlePublishComponent}
                disabled={isPublishing || !componentCode.trim()}
                className="ml-2"
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
