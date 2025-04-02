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
      console.log("🚀 R2 Upload Starting:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileKey,
        bucketName,
        contentType,
      })

      setIsUploading(true)
      setError(null)

      const presignedUrl = await generatePresignedUrl({
        fileKey,
        bucketName,
        contentType: contentType,
      })

      console.log("📝 Got presigned URL:", presignedUrl)

      const response = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": contentType,
        },
      })

      console.log("📤 Upload response:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const finalUrl = `${process.env.NEXT_PUBLIC_CDN_URL}/${fileKey}`
      console.log("✅ Upload successful, final URL:", finalUrl)

      return finalUrl
    } catch (err) {
      console.error("❌ R2 Upload Error:", err)
      setError(err instanceof Error ? err : new Error("Upload failed"))
      throw err
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
