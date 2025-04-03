import { useState, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import type { SandpackFiles } from "@codesandbox/sandpack-react"

interface UsePublishDialogProps {
  userId: string
}

export function usePublishDialog({ userId }: UsePublishDialogProps) {
  // Dialog state
  const [open, setOpen] = useState(false)
  const [componentCode, setComponentCode] = useState("")
  const [processedData, setProcessedData] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
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

  return {
    open,
    componentCode,
    processedData,
    isProcessing,
    isPublishing,
    handleOpenChange,
    handleProcessComponent,
    setComponentCode,
    sandpackConfig,
    getComponentFilePath,
  }
}
