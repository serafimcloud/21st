import React from "react"
import { UseFormReturn } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import UploadIcon from "@/components/icons/upload"
import { cn } from "@/lib/utils"
import type { TemplateFormData } from "./schema"
import { useTemplateMediaUpload } from "../hooks/use-template-media-upload"

interface TemplateDetailsFormProps {
  form: UseFormReturn<TemplateFormData>
  onNameChange: (name: string) => void
}

export function TemplateDetailsForm({
  form,
  onNameChange,
}: TemplateDetailsFormProps) {
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const previewImageDataUrl = form.watch("preview_image_data_url")
  const previewVideoDataUrl = form.watch("preview_video_data_url")

  const {
    isDragging,
    fileInputRef,
    handleFileChange,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleClick,
  } = useTemplateMediaUpload(form)

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*"
      fileInputRef.current.onchange = (e) => handleFileChange(e as any, "image")
      handleClick()
    }
  }

  const handleVideoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "video/mp4,video/quicktime"
      fileInputRef.current.onchange = (e) => handleFileChange(e as any, "video")
      handleClick()
    }
  }

  const handleVideoRemove = () => {
    const videoUrl = form.getValues("preview_video_data_url")
    if (videoUrl && videoUrl.startsWith("blob:")) {
      URL.revokeObjectURL(videoUrl)
    }
    form.setValue("preview_video_data_url", undefined)
    form.setValue("preview_video_file", undefined)
  }

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/mp4,video/quicktime"
      />

      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <Input
              id="name"
              placeholder="Enter template name"
              {...field}
              onChange={(e) => onNameChange(e.target.value)}
            />
          )}
        />
        <p
          className="text-xs text-muted-foreground"
          role="region"
          aria-live="polite"
        >
          A descriptive name for your template
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="template_slug">
          Template Slug <span className="text-destructive">*</span>
        </Label>
        <FormField
          control={form.control}
          name="template_slug"
          render={({ field }) => (
            <Input
              id="template_slug"
              placeholder="my-awesome-template"
              {...field}
            />
          )}
        />
        <p
          className="text-xs text-muted-foreground"
          role="region"
          aria-live="polite"
        >
          A unique URL-friendly identifier for your template
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <Textarea
              id="description"
              placeholder="Describe your template"
              {...field}
            />
          )}
        />
        <p
          className="text-xs text-muted-foreground"
          role="region"
          aria-live="polite"
        >
          A detailed description of your template and its features
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preview">
          Preview Image <span className="text-destructive">*</span>
        </Label>
        {!previewImageDataUrl ? (
          <div
            className={cn(
              "flex flex-col !justify-between w-full border border-dashed bg-background rounded-md p-8 text-center cursor-pointer hover:border-gray-400 transition-colors relative",
              isDragging && "ring-2 ring-primary ring-offset-2",
            )}
            onDragEnter={(e) => handleDragEnter(e)}
            onDragLeave={(e) => handleDragLeave(e)}
            onDragOver={(e) => handleDragOver(e)}
            onDrop={(e) => handleDrop(e, "image")}
            onClick={handleImageClick}
          >
            <UploadIcon />
            <p className="mt-2 text-xs font-medium">
              Click to upload or drag and drop
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPEG (max. 5MB)
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "w-full border rounded-md p-2 flex items-center gap-2 relative",
              isDarkTheme ? "border-gray-600" : "border-gray-300",
            )}
          >
            <div className="w-40 h-32 relative">
              <img
                src={previewImageDataUrl}
                alt="Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                className="rounded-sm border shadow-sm"
              />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={handleImageClick}>
                  Change
                </Button>
              </div>
            </div>
          </div>
        )}
        <p
          className="text-xs text-muted-foreground"
          role="region"
          aria-live="polite"
        >
          A high-quality preview image that showcases your template
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="video">Preview Video</Label>
        {!previewVideoDataUrl ? (
          <div
            className={cn(
              "flex flex-col !justify-between w-full border border-dashed bg-background rounded-md p-8 text-center cursor-pointer hover:border-gray-400 transition-colors relative",
              isDragging && "ring-2 ring-primary ring-offset-2",
            )}
            onDragEnter={(e) => handleDragEnter(e)}
            onDragLeave={(e) => handleDragLeave(e)}
            onDragOver={(e) => handleDragOver(e)}
            onDrop={(e) => handleDrop(e, "video")}
            onClick={handleVideoClick}
          >
            <UploadIcon />
            <p className="mt-2 text-xs font-medium">
              Click to upload or drag and drop
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              MOV, MP4 (max. 50MB)
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "w-full border rounded-md p-2 flex items-center gap-2 relative",
              isDarkTheme ? "border-gray-600" : "border-gray-300",
            )}
          >
            <div className="w-40 h-32 relative">
              <video
                src={previewVideoDataUrl}
                controls
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                className="rounded-sm border shadow-sm"
              />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={handleVideoClick}>
                  Change Video
                </Button>
                <Button variant="outline" onClick={handleVideoRemove}>
                  Remove Video
                </Button>
              </div>
            </div>
          </div>
        )}
        <p
          className="text-xs text-muted-foreground"
          role="region"
          aria-live="polite"
        >
          A short video demonstrating your template's features and interactions
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website_preview_url">
          Demo URL <span className="text-destructive">*</span>
        </Label>
        <FormField
          control={form.control}
          name="website_preview_url"
          render={({ field }) => (
            <Input
              id="website_preview_url"
              placeholder="https://example.com"
              {...field}
            />
          )}
        />
        <p
          className="text-xs text-muted-foreground"
          role="region"
          aria-live="polite"
        >
          A live preview URL where users can see your template in action
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_url">
          Payment URL <span className="text-destructive">*</span>
        </Label>
        <FormField
          control={form.control}
          name="payment_url"
          render={({ field }) => (
            <Input
              id="payment_url"
              placeholder="https://example.com/buy"
              {...field}
            />
          )}
        />
        <p
          className="text-xs text-muted-foreground"
          role="region"
          aria-live="polite"
        >
          The URL where users can purchase or download your template
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">
          Price <span className="text-destructive">*</span>
        </Label>
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <Input
              id="price"
              type="number"
              min="0"
              step="1"
              placeholder="49"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          )}
        />
        <p
          className="text-xs text-muted-foreground"
          role="region"
          aria-live="polite"
        >
          Set the price in USD (use 0 for free templates)
        </p>
      </div>
    </div>
  )
}
