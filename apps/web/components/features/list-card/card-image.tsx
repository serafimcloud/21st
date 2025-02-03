"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface ComponentPreviewImageProps {
  src: string
  alt: string
  fallbackSrc: string
  className?: string
}

export default function ComponentPreviewImage({
  src,
  alt,
  fallbackSrc,
  className,
}: ComponentPreviewImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isPlaceholder, setIsPlaceholder] = useState(src === fallbackSrc)

  useEffect(() => {
    setImgSrc(src)
    setIsPlaceholder(src === fallbackSrc)
  }, [src, fallbackSrc])

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className={className}
      onError={() => {
        setImgSrc(fallbackSrc)
        setIsPlaceholder(true)
      }}
      style={{
        objectFit: "cover",
        backgroundColor: isPlaceholder ? "transparent" : "",
      }}
    />
  )
}
