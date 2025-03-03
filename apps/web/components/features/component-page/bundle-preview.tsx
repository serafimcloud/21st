import React, { useState, useEffect } from "react"
import { BundleStatus } from "@/hooks/use-bundle-demo"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface BundlePreviewProps {
  bundleStatus: BundleStatus
  className?: string
  isFullScreen?: boolean
}

const BundlePreview: React.FC<BundlePreviewProps> = ({
  bundleStatus,
  className,
  isFullScreen = false,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingText, setLoadingText] = useState("Загрузка бандла...")

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingText(
          "Загрузка занимает больше времени, чем обычно. Возможно, стоит обновить страницу...",
        )
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [isLoading])

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleIframeError = () => {
    setError("Ошибка загрузки бандла")
    setIsLoading(false)
  }

  if (!bundleStatus.hasBundle || !bundleStatus.urls) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-muted-foreground">
          Бандл еще не сгенерирован для этого компонента
        </p>
      </div>
    )
  }

  return (
    <motion.div
      layout="position"
      className={cn(
        "flex-grow h-full relative rounded-lg overflow-hidden bg-white",
        className,
      )}
      transition={{
        layout: {
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1],
        },
      }}
    >
      {error ? (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <p className="text-muted-foreground text-sm">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setIsLoading(true)
              // Перезагрузка iframe
              const iframe = document.getElementById(
                "bundle-iframe",
              ) as HTMLIFrameElement
              if (iframe) {
                iframe.src = bundleStatus.urls.htmlUrl
              }
            }}
            className="text-sm underline text-muted-foreground hover:text-foreground"
          >
            Попробовать снова
          </button>
        </div>
      ) : (
        <iframe
          id="bundle-iframe"
          src={bundleStatus.urls.htmlUrl}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="Предпросмотр компонента"
          sandbox="allow-scripts allow-same-origin"
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <LoadingSpinner text={loadingText} />
        </div>
      )}
    </motion.div>
  )
}

export default BundlePreview
