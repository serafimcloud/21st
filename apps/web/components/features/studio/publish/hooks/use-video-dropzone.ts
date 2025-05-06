import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { UseFormReturn } from "react-hook-form"
import type { FormData } from "../config/utils"

async function convertVideoToMP4(file: File): Promise<File> {
  const videoFormData = new FormData()
  videoFormData.append("video", file)

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
}

export function useVideoDropzone({
  form,
  demoIndex,
}: {
  form: UseFormReturn<FormData>
  demoIndex: number
}) {
  const [isProcessingVideo, setIsProcessingVideo] = useState(false)
  const previewVideoDataUrl = form.watch(
    `demos.${demoIndex}.preview_video_data_url`,
  )

  const handleVideoChange = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      alert("File is too large. Maximum size is 50 MB.")
      return
    }

    try {
      setIsProcessingVideo(true)
      const previewUrl = URL.createObjectURL(file)

      console.log("🎥 Before setting video file:", {
        file,
        previewUrl,
      })

      form.setValue(`demos.${demoIndex}.preview_video_data_url`, previewUrl)
      form.setValue(`demos.${demoIndex}.preview_video_file`, file)

      const processedFile = await convertVideoToMP4(file)
      console.log("🎥 After processing video:", {
        processedFile,
        size: processedFile.size,
        type: processedFile.type,
      })

      form.setValue(`demos.${demoIndex}.preview_video_file`, processedFile)
    } catch (error) {
      console.error("Error processing video:", error)
      alert("Error processing video. Please try again.")
      form.setValue(`demos.${demoIndex}.preview_video_data_url`, undefined)
      form.setValue(`demos.${demoIndex}.preview_video_file`, undefined)
    } finally {
      setIsProcessingVideo(false)
    }
  }

  const removeVideo = () => {
    const videoUrl = form.getValues(`demos.${demoIndex}.preview_video_data_url`)
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }
    form.setValue(`demos.${demoIndex}.preview_video_data_url`, undefined)
    form.setValue(`demos.${demoIndex}.preview_video_file`, undefined)
  }

  const {
    getRootProps: getVideoRootProps,
    getInputProps: getVideoInputProps,
    isDragActive: isVideoDragActive,
  } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleVideoChange(acceptedFiles[0] as File)
      }
    },
    accept: {
      "video/quicktime": [],
      "video/mp4": [],
    },
    multiple: false,
  })

  const openFileDialog = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "video/quicktime,video/mp4"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleVideoChange(file)
      }
    }
    input.click()
  }

  return {
    previewVideoDataUrl,
    isProcessingVideo,
    isVideoDragActive,
    getVideoRootProps,
    getVideoInputProps,
    handleVideoChange,
    removeVideo,
    openFileDialog,
  }
}
