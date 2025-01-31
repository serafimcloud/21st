"use client"

import Image from "next/image"
import { useState } from "react"

interface SectionPreviewImageProps {
  src: string
  alt: string
  fallbackSrc?: string
  className?: string
}

export function SectionPreviewImage({
  src,
  alt,
  fallbackSrc = "/placeholder.svg",
  className,
}: SectionPreviewImageProps) {
  const [error, setError] = useState(false)

  return (
    <Image
      src={error ? fallbackSrc : src}
      alt={alt}
      width={400}
      height={300}
      className={className}
      onError={() => setError(true)}
      priority={true}
    />
  )
}

export default SectionPreviewImage 