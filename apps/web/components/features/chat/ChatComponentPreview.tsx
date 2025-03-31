import { Spinner } from "@/components/icons/spinner"
import { motion } from "motion/react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface ChatComponentPreviewProps {
  generating: boolean
  componentGenerated: boolean
}

export function ChatComponentPreview({
  generating,
  componentGenerated,
}: ChatComponentPreviewProps) {
  const [selectedVersion, setSelectedVersion] = useState(0)

  // Define different source URLs for each version
  const previewSources = [
    "https://cdn.21st.dev/bundled/1526.html", // Version 1
    "https://cdn.21st.dev/bundled/1313.html", // Version 2
    "https://cdn.21st.dev/bundled/829.html", // Version 3
  ]

  // Handle keyboard shortcuts for switching versions
  useEffect(() => {
    if (!componentGenerated) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") setSelectedVersion(0)
      if (e.key === "2") setSelectedVersion(1)
      if (e.key === "3") setSelectedVersion(2)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [componentGenerated])

  if (generating) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!componentGenerated) {
    return (
      <div className="flex h-full items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg">
        <div className="text-center p-6">
          <h3 className="text-lg font-medium mb-2">Component Preview</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Describe the UI component you want to build in the input field
            below. Once generated, the preview will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full rounded-lg shadow-base overflow-hidden">
      {/* Main preview area - shows the currently selected version */}
      <div className="flex-1 relative">
        <iframe
          src={previewSources[selectedVersion]}
          className="w-full h-full border-0"
          title="Component Preview"
        />
      </div>

      {/* Sidebar with version options */}
      <div className="w-64 border-l border-border/30 p-4 flex flex-col gap-4 bg-muted/30">
        <div className="text-center mb-2">
          <h3 className="text-sm font-medium">Versions</h3>
          <p className="text-muted-foreground text-xs mt-1">
            Press 1-3 to switch between versions
          </p>
        </div>

        {[0, 1, 2].map((version) => (
          <motion.div
            key={version}
            className={cn(
              "h-32 border rounded-md overflow-hidden cursor-pointer relative",
              selectedVersion === version
                ? "border-primary ring-1 ring-primary"
                : "border-border/50",
            )}
            onClick={() => setSelectedVersion(version)}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full relative overflow-hidden">
                <div
                  className="absolute"
                  style={{
                    width: "300%",
                    height: "300%",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%) scale(0.33)",
                  }}
                >
                  <iframe
                    src={previewSources[version]}
                    className="w-full h-full border-0 pointer-events-none"
                    title={`Version ${version + 1}`}
                  />
                </div>
              </div>
            </div>
            <div className="absolute bottom-1 right-1 text-xs font-medium bg-background/80 text-foreground px-1.5 py-0.5 rounded-sm z-10">
              {version + 1}
            </div>
            {selectedVersion === version && (
              <div className="absolute inset-0 ring-2 ring-primary/50 pointer-events-none z-10" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
