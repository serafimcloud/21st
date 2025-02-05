import { useState, useRef } from "react"
import { UseFormReturn } from "react-hook-form"
import type { TemplateFormData } from "../template/schema"
import React from "react"
import { useR2Upload } from "../hooks/use-r2-upload"

async function convertVideoToMP4(file: File): Promise<File> {
  console.log("Starting video conversion")
  const videoFormData = new FormData()
  videoFormData.append("video", file)

  try {
    console.log(
      "Sending request to conversion server:",
      process.env.NEXT_PUBLIC_BACKEND_URL,
    )
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/convert`,
      {
        method: "POST",
        body: videoFormData,
      },
    )

    console.log("Conversion response status:", response.status)
    if (!response.ok) {
      const error = await response.json()
      console.error("Conversion error:", error)
      throw new Error(error.message || "Failed to process video")
    }

    const processedVideoBlob = await response.blob()
    console.log("Received converted video blob:", processedVideoBlob)

    return new File(
      [processedVideoBlob],
      file.name.replace(/\.[^/.]+$/, ".mp4"),
      {
        type: "video/mp4",
      },
    )
  } catch (error) {
    console.error("Video conversion failed:", error)
    // Если конвертация не удалась, используем оригинальный файл
    console.log("Using original file as fallback")
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
    console.log("handleFileChange called with type:", type)
    const file = e.target.files?.[0]
    console.log("Selected file:", file)
    if (!file) {
      console.log("No file selected")
      return
    }

    // Проверяем размер файла
    const maxSize = type === "image" ? 5 * 1024 * 1024 : 50 * 1024 * 1024
    console.log("File size:", file.size, "Max size:", maxSize)
    if (file.size > maxSize) {
      const sizeInMb = maxSize / (1024 * 1024)
      console.error(`File is too large. Maximum size is ${sizeInMb} MB`)
      throw new Error(`File is too large. Maximum size is ${sizeInMb} MB`)
    }

    try {
      // Создаем URL для превью
      const previewUrl = URL.createObjectURL(file)
      console.log("Created preview URL:", previewUrl)

      if (type === "image") {
        form.setValue("preview_image_data_url", previewUrl)
        form.setValue("preview_image_file", file)
      } else {
        setIsProcessingVideo(true)
        form.setValue("preview_video_data_url", previewUrl)
        form.setValue("preview_video_file", file)
      }
    } catch (error) {
      console.error("Error processing file:", error)
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
    // Если это видео, конвертируем его перед загрузкой
    if (contentType.startsWith("video/")) {
      try {
        console.log("Converting video before upload")
        const convertedFile = await convertVideoToMP4(file)
        file = convertedFile
        contentType = "video/mp4"
      } catch (error) {
        console.warn("Video conversion failed, using original file:", error)
      }
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
      console.log("Created preview URL from drop:", previewUrl)

      if (type === "image") {
        form.setValue("preview_image_data_url", previewUrl)
        form.setValue("preview_image_file", file)
      } else {
        setIsProcessingVideo(true)
        form.setValue("preview_video_data_url", previewUrl)
        form.setValue("preview_video_file", file)
      }
    } catch (error) {
      console.error("Error processing file:", error)
      throw error
    } finally {
      if (type === "video") {
        setIsProcessingVideo(false)
      }
    }
  }

  const handleClick = () => {
    console.log("handleClick called")
    console.log("fileInputRef:", fileInputRef.current)
    fileInputRef.current?.click()
  }

  // Очистка URL при удалении файла
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

  // Очищаем URL при размонтировании компонента
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
