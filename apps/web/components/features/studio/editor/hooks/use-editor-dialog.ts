import { useEffect } from "react"
import {
  defaultGlobalCss as globalCss,
  defaultTailwindConfig as tailwindConfig,
} from "@/lib/defaults"
import { useDialogState } from "./use-dialog-state"
import { useFileManagement, ActivePreview } from "./use-file-management"
import { useDependencies } from "./use-dependencies"
import { useComponentProcessing } from "./use-component-processing"
import { useSandpackConfig } from "./use-sandpack-config"
import { useCssCompiler } from "./use-css-compiler"

interface UsePublishDialogProps {
  userId: string
}

export function usePublishDialog({ userId }: UsePublishDialogProps) {
  // Dialog state
  const {
    open,
    isProcessing,
    isPublishing,
    setIsProcessing,
    handleOpenChange,
  } = useDialogState()

  // File management
  const {
    componentCode,
    activePreview,
    actionRequiredFiles,
    initialCompiledCss,
    generateAppTsx,
    setComponentCode: setComponentCodeWithCache,
    getCachedFileContent,
    handlePreviewSelect: handlePreviewSelectBase,
    isUnresolvedDependency,
    handleFileChange: handleFileChangeBase,
    setInitialCompiledCss,
    setActionRequiredFiles,
    fileContentCache,
  } = useFileManagement()

  // Dependencies management
  const {
    registryDependencies,
    npmDependenciesOfRegistryDependencies,
    loadingShadcnComponents,
    loadDependencies,
    resolveDependencies,
    setLoadingShadcnComponents,
  } = useDependencies()

  // Component processing
  const {
    processedData,
    getComponentFilePath,
    handleProcessComponent: processComponentBase,
    setProcessedData,
  } = useComponentProcessing({
    userId,
    setIsProcessing,
    setLoadingShadcnComponents,
    setActionRequiredFiles,
    handlePreviewSelect: (preview, files) =>
      handlePreviewSelectBase(preview, files),
    loadDependencies,
    resolveDependencies,
  })

  // Sandpack configuration
  const { files, sandpackConfig } = useSandpackConfig({
    componentPath: getComponentFilePath(),
    componentCode,
    processedData,
    registryDependencies,
    npmDependenciesOfRegistryDependencies,
    activePreviewFilePath: activePreview?.filePath || null,
    initialCompiledCss,
    generateStylesCss: () => globalCss,
    generateAppTsx,
    fileContentCache,
    isProcessing,
  })

  // CSS compiler - will automatically update styles.css in files object
  const { compiledCss, isCssCompiling, forceRecompile } = useCssCompiler({
    componentCode,
    processedData,
    isProcessing,
    registryDependencies,
    files,
    globalCss,
    tailwindConfig,
    getComponentFilePath,
  })

  // Update the initial compiled CSS when a new CSS is compiled
  useEffect(() => {
    if (compiledCss) {
      setInitialCompiledCss(compiledCss)
    }
  }, [compiledCss, setInitialCompiledCss])

  // Process component wrapper
  const handleProcessComponent = () => {
    if (!componentCode.trim()) return

    // Store the current code to prevent it from being lost during processing
    const currentCode = componentCode

    // Process the component with the stored code
    processComponentBase(currentCode)
  }

  // Preview selection wrapper with files
  const handlePreviewSelect = (newPreview: ActivePreview) => {
    // Make sure we have the file content before selecting
    const fileContent = files[newPreview.filePath]
    // Extract the code properly regardless of the type
    const fileCode =
      typeof fileContent === "string"
        ? fileContent
        : fileContent?.code || componentCode

    // Create a files object with the current component code
    const filesWithCode = {
      ...files,
      [newPreview.filePath]: { code: fileCode },
    }

    handlePreviewSelectBase(newPreview, filesWithCode)
  }

  // Handle file change wrapper
  const handleFileChange = (path: string, fileContent: string) => {
    // Create a files copy we can pass to the base handler
    const filesCopy = { ...files }

    handleFileChangeBase(path, fileContent, filesCopy, forceRecompile)
  }

  return {
    open,
    componentCode,
    processedData,
    isProcessing,
    isPublishing,
    activePreview,
    loadingShadcnComponents,
    actionRequiredFiles,
    compiledCss,
    isCssCompiling,
    handleOpenChange,
    handleProcessComponent,
    handlePreviewSelect,
    setComponentCode: setComponentCodeWithCache,
    getCachedFileContent,
    sandpackConfig,
    getComponentFilePath,
    isUnresolvedDependency: (path: string) =>
      isUnresolvedDependency(path, processedData),
    handleFileChange,
  }
}
