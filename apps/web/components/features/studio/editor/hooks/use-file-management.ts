import { useState, useCallback } from "react"

// Create a file content cache that persists across component remounts
const fileContentCache = new Map<string, string>()

// Define a type for the active preview
export type ActivePreview = {
  type: "regular" | "unknown"
  filePath: string // The file path (always set)
  componentName?: string // Only used for unknown components
}

/**
 * Hook for managing file content in the editor
 */
export function useFileManagement() {
  const [componentCode, setComponentCode] = useState("// Paste your code here")
  const [initialCompiledCss, setInitialCompiledCss] = useState<string | null>(
    null,
  )
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(null)
  const [actionRequiredFiles, setActionRequiredFiles] = useState<string[]>([])

  // Helper function to generate a simple App.tsx that can handle demo files with both named and default exports
  const generateAppTsx = useCallback(() => {
    console.log("[generateAppTsx] Generating App.tsx with demo import")
    return `import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { RouterProvider } from 'next/router';
import './styles.css';
import DefaultExport, * as NamedExports from './demo';

// Log what's available in the demo file for debugging
console.log('Demo components loaded:', {
  defaultExport: DefaultExport,
  namedExports: Object.keys(NamedExports).filter(k => k !== 'default')
});

// Combine named exports and default export components
const demoComponentNames = [
  ...(DefaultExport && typeof DefaultExport === 'object' ? Object.keys(DefaultExport) : []),
  ...Object.keys(NamedExports).filter(key => 
    typeof NamedExports[key] === 'function' && key !== 'default'
  )
];

console.log('Available demo component names:', demoComponentNames);

const DemoComponents = {
  ...(DefaultExport && typeof DefaultExport === 'object' ? DefaultExport : {}),
  ...(typeof DefaultExport === 'function' ? { Demo: DefaultExport } : {}),
  ...Object.fromEntries(
    Object.entries(NamedExports).filter(([key, value]) => 
      typeof value === 'function' && key !== 'default'
    )
  )
};

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Handle both object of components and direct function component export
  const getComponent = () => {
    if (demoComponentNames.length > 0) {
      return DemoComponents[demoComponentNames[currentIndex]];
    } else if (typeof DefaultExport === 'function') {
      return DefaultExport;
    } else {
      return () => <div className="p-6 text-center">Add components to demo.tsx</div>;
    }
  };
  
  const CurrentComponent = getComponent();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && demoComponentNames.length > 1) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setCurrentIndex(prev => (prev + 1) % demoComponentNames.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setCurrentIndex(prev => (prev - 1 + demoComponentNames.length) % demoComponentNames.length);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <RouterProvider>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
          {demoComponentNames.length > 1 && (
            <div className="self-end mb-4">
              <select 
                value={demoComponentNames[currentIndex]} 
                onChange={(e) => {
                  const idx = demoComponentNames.indexOf(e.target.value);
                  if (idx !== -1) setCurrentIndex(idx);
                }}
                className="p-2 border rounded bg-background text-foreground"
              >
                {demoComponentNames.map(name => (
                  <option key={name} value={name}>
                    {name.replace(/([A-Z])/g, ' $1').trim()}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex items-center justify-center w-full">
            <CurrentComponent />
          </div>
        </div>
      </RouterProvider>
    </ThemeProvider>
  );
}`
  }, [])

  // Set the component code and also update cache
  const setComponentCodeWithCache = useCallback(
    (code: string, path?: string) => {
      const filePath = path || activePreview?.filePath
      setComponentCode(code)

      // Store in cache if we have a valid path
      if (filePath) {
        console.log("[useFileManagement] Caching file content:", {
          path: filePath,
          codeLength: code.length,
        })
        fileContentCache.set(filePath, code)
      }
    },
    [activePreview?.filePath],
  )

  // Helper function to get cached content
  const getCachedFileContent = useCallback((path: string) => {
    return fileContentCache.get(path)
  }, [])

  // Unified handler for preview selection
  const handlePreviewSelect = useCallback(
    (newPreview: ActivePreview, files: Record<string, any>) => {
      // First check if this is the same as the current preview to avoid unnecessary updates
      if (
        activePreview?.filePath === newPreview.filePath &&
        activePreview.type === newPreview.type
      ) {
        return
      }

      // Get the file content before changing the active preview
      const fileContent = files[newPreview.filePath]
      const newCode = fileContent
        ? typeof fileContent === "string"
          ? fileContent
          : fileContent.code
        : null

      // Set the active preview
      setActivePreview(newPreview)

      // If we have valid code, update the component code
      if (newCode) {
        console.log(
          `[handlePreviewSelect] Updating component code for path: ${newPreview.filePath}`,
        )
        setComponentCode(newCode)

        // Also update the cache
        fileContentCache.set(newPreview.filePath, newCode)
      } else {
        console.warn(
          `[handlePreviewSelect] No content found for path: ${newPreview.filePath}`,
        )
      }
    },
    [activePreview, setComponentCode],
  )

  // Helper to check if a file is an unresolved dependency
  const isUnresolvedDependency = useCallback(
    (path: string, processedData: any) => {
      return (
        processedData?.unresolvedDependencyImports?.some(
          (comp: any) => comp.path === path,
        ) ?? false
      )
    },
    [],
  )

  // Handle file changes from Sandpack editor
  const handleFileChange = useCallback(
    (
      path: string,
      fileContent: string,
      files: Record<string, any>,
      forceRecompile: () => void,
    ) => {
      console.log(
        `[handleFileChange] File ${path} changed, updating files state`,
      )

      // If this is the demo file, make sure we update our files state
      if (path === "/demo.tsx") {
        console.log(
          "[handleFileChange] Demo file changed, length:",
          fileContent.length,
        )

        // Cache the changes
        fileContentCache.set(path, fileContent)

        // Update the files object directly
        files[path] = { code: fileContent }

        // Force CSS recompilation to pick up the changes
        forceRecompile()
      }
    },
    [],
  )

  return {
    componentCode,
    activePreview,
    actionRequiredFiles,
    initialCompiledCss,
    generateAppTsx,
    setComponentCode: setComponentCodeWithCache,
    getCachedFileContent,
    handlePreviewSelect,
    isUnresolvedDependency,
    handleFileChange,
    setInitialCompiledCss,
    setActionRequiredFiles,
    fileContentCache,
  }
}
