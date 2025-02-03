"use client"

import { useEffect, useRef, useState } from "react"

interface CategoryVideoPreviewProps {
  videoUrl: string
}

export function CategoryVideoPreview({ videoUrl }: CategoryVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!videoRef.current) return

    if (isHovered) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [isHovered])

  return (
    <div
      className="absolute inset-0 z-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        playsInline
        loop
        className="w-full h-full object-cover"
      />
    </div>
  )
}

export default CategoryVideoPreview
