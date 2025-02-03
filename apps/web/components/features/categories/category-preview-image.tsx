"use client"

import Image from "next/image"
import { useState } from "react"

interface CategoryPreviewImageProps {
  src: string
  alt: string
  fallbackSrc?: string
  className?: string
}

export function CategoryPreviewImage({
  src,
  alt,
  fallbackSrc = "/placeholder.svg",
  className,
}: CategoryPreviewImageProps) {
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

export default CategoryPreviewImage
