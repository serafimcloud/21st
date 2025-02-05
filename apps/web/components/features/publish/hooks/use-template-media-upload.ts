import { useState, useRef } from "react"
import { UseFormReturn } from "react-hook-form"
import type { TemplateFormData } from "../template/schema"
import React from "react"
import { useR2Upload } from "../hooks/use-r2-upload"

async function convertVideoToMP4(file: File): Promise<File> {
  const videoFormData = new FormData()
  videoFormData.append("video", file)

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/convert`,
      {
        method: "POST",
        body: videoFormData,
      },
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to process video")
    }

    const processedVideoBlob = await response.blob()

    return new File(
      [processedVideoBlob],
      file.name.replace(/\.[^/.]+$/, ".mp4"),
      {
        type: "video/mp4",
      },
    )
  } catch (error) {
    return new File([file], file.name, { type: file.type })
  }
}

export function useTemplateMediaUpload(form: UseFormReturn<TemplateFormData>) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessingVideo, setIsProcessingVideo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { upload: uploadToR2ClientSide } = useR2Upload()

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video",
  ) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    const maxSize = type === "image" ? 5 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size > maxSize) {
      const sizeInMb = maxSize / (1024 * 1024)
      throw new Error(`File is too large. Maximum size is ${sizeInMb} MB`)
    }

    try {
      const previewUrl = URL.createObjectURL(file)

      if (type === "image") {
        form.setValue("preview_image_data_url", previewUrl)
        form.setValue("preview_image_file", file)
      } else {
        setIsProcessingVideo(true)
        form.setValue("preview_video_data_url", previewUrl)
        form.setValue("preview_video_file", file)
      }
    } catch (error) {
      throw error
    } finally {
      if (type === "video") {
        setIsProcessingVideo(false)
      }
    }
  }

  const uploadToStorage = async (
    file: File,
    path: string,
    contentType: string,
  ) => {
    if (contentType.startsWith("video/")) {
      try {
        const convertedFile = await convertVideoToMP4(file)
        file = convertedFile
        contentType = "video/mp4"
      } catch (error) {}
    }

    return await uploadToR2ClientSide({
      file,
      fileKey: path,
      bucketName: "components-code",
      contentType,
    })
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent, type: "image" | "video") => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (!file) return

    const maxSize = type === "image" ? 5 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size > maxSize) {
      const sizeInMb = maxSize / (1024 * 1024)
      throw new Error(`File is too large. Maximum size is ${sizeInMb} MB`)
    }

    try {
      const previewUrl = URL.createObjectURL(file)

      if (type === "image") {
        form.setValue("preview_image_data_url", previewUrl)
        form.setValue("preview_image_file", file)
      } else {
        setIsProcessingVideo(true)
        form.setValue("preview_video_data_url", previewUrl)
        form.setValue("preview_video_file", file)
      }
    } catch (error) {
      throw error
    } finally {
      if (type === "video") {
        setIsProcessingVideo(false)
      }
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const cleanup = () => {
    const imageUrl = form.getValues("preview_image_data_url")
    const videoUrl = form.getValues("preview_video_data_url")

    if (imageUrl && imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl)
    }
    if (videoUrl && videoUrl.startsWith("blob:")) {
      URL.revokeObjectURL(videoUrl)
    }
  }

  React.useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  return {
    isDragging,
    isProcessingVideo,
    fileInputRef,
    uploadToStorage,
    handleFileChange,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleClick,
  }
}
