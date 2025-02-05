"use client"

import { useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { useDropzone, FileWithPath } from "react-dropzone"
import type { TemplateFormData } from "../template/schema"

interface UseTemplateVideoDropzoneProps {
  form: UseFormReturn<TemplateFormData>
}

export function useTemplateVideoDropzone({
  form,
}: UseTemplateVideoDropzoneProps) {
  const [isProcessingVideo, setIsProcessingVideo] = useState(false)

  const handleFileChange = (file: FileWithPath) => {
    if (file.size > 50 * 1024 * 1024) {
      alert("File is too large. Maximum size is 50 MB.")
      return
    }

    setIsProcessingVideo(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      form.setValue("preview_video_data_url", dataUrl)
      form.setValue("preview_video_file", file)
      setIsProcessingVideo(false)
    }
    reader.readAsDataURL(file)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: FileWithPath[]) => {
      const file = acceptedFiles[0]
      if (file) {
        handleFileChange(file)
      }
    },
    accept: {
      "video/mp4": [],
      "video/quicktime": [],
    },
    multiple: false,
  })

  const removeVideo = () => {
    form.setValue("preview_video_data_url", undefined)
    form.setValue("preview_video_file", undefined)
  }

  return {
    previewVideoDataUrl: form.watch("preview_video_data_url"),
    isProcessingVideo,
    isVideoDragActive: isDragActive,
    getVideoRootProps: getRootProps,
    getVideoInputProps: getInputProps,
    removeVideo,
    openFileDialog: () => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "video/mp4,video/quicktime"
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          handleFileChange(file)
        }
      }
      input.click()
    },
  }
}
