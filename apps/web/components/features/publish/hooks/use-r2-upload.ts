"use client"

import { generatePresignedUrl } from "@/lib/r2"
import { useState } from "react"

export const useR2Upload = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const upload = async ({
    file,
    fileKey,
    bucketName,
    contentType = "text/plain",
  }: {
    file: File
    fileKey: string
    bucketName: string
    contentType?: string
  }) => {
    try {
      setIsUploading(true)
      setError(null)

      const presignedUrl = await generatePresignedUrl({
        fileKey,
        bucketName,
        contentType: contentType,
      })

      const response = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": contentType,
        },
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }
      return `${process.env.NEXT_PUBLIC_CDN_URL}/${fileKey}`
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Upload failed"))
    } finally {
      setIsUploading(false)
    }
  }

  return {
    upload,
    isUploading,
    error,
  }
}
