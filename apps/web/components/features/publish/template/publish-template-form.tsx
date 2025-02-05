"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"

import { Form } from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { usePublishAs } from "../hooks/use-publish-as"
import { makeSlugFromName } from "../hooks/use-is-check-slug-available"
import { useTemplateDraft } from "../hooks/use-template-draft"
import { useTemplateMediaUpload } from "../hooks/use-template-media-upload"
import { LoadingDialog } from "@/components/ui/loading-dialog"
import { useR2Upload } from "../hooks/use-r2-upload"
import { uploadToR2 } from "@/lib/r2"

import { templateFormSchema, type TemplateFormData } from "./schema"
import { TemplateDetailsForm } from "./template-details-form"

function PublishTemplateForm() {
  const { user } = useUser()
  const client = useClerkSupabaseClient()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [publishProgress, setPublishProgress] = useState("")

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      template_slug: "",
      description: "",
      preview_url: "",
      website_preview_url: "",
      payment_url: "",
      price: 0,
      publish_as_username: user?.username || "",
    },
  })

  const { hasDraft, restoreDraft, clearDraft } = useTemplateDraft(form)
  const { uploadToStorage } = useTemplateMediaUpload(form)
  const { upload: uploadToR2ClientSide } = useR2Upload()

  const publishAsUsername = form.watch("publish_as_username") || ""
  const { isAdmin, user: publishAsUser } = usePublishAs({
    username: publishAsUsername,
  })

  const onSubmit = async (data: TemplateFormData) => {
    console.log("Current user:", user)
    console.log("PublishAsUser:", publishAsUser)
    console.log("Is admin:", isAdmin)
    console.log("PublishAsUsername:", publishAsUsername)

    // Определяем пользователя для публикации
    let effectiveUserId: string | undefined
    let effectiveUsername: string | undefined

    if (isAdmin && publishAsUsername && publishAsUser) {
      // Для админа используем ID указанного пользователя
      effectiveUserId = publishAsUser.id
      effectiveUsername = publishAsUsername
    } else if (user) {
      // Для обычного пользователя используем его собственный ID
      effectiveUserId = user.id
      effectiveUsername = user.username || undefined
    }

    // Проверяем наличие ID пользователя
    if (!effectiveUserId || !effectiveUsername) {
      toast.error("No effective user found")
      console.error("No effective user found:", {
        userId: user?.id,
        username: user?.username,
        publishAsUserId: publishAsUser?.id,
        publishAsUsername,
        isAdmin,
      })
      return
    }

    setIsSubmitting(true)
    setPublishProgress("Getting user data...")

    try {
      // Получаем UUID пользователя из таблицы public.users
      const { data: userData, error: userError } = await client
        .from("users")
        .select("id")
        .eq("username", effectiveUsername)
        .single()

      if (userError || !userData) {
        throw new Error("Failed to get user data")
      }

      const userUuid = userData.id
      setPublishProgress("Uploading files...")

      const baseFolder = `${effectiveUserId}/${data.template_slug}`

      // Логируем данные перед загрузкой
      console.log("Upload data:", {
        baseFolder,
        hasImageFile: !!data.preview_image_file,
        hasVideoFile: !!data.preview_video_file,
        userUuid,
      })

      let previewImageUrl = data.preview_url
      let videoUrl = null

      // Загружаем файлы только если они есть
      if (data.preview_image_file) {
        previewImageUrl = await uploadToStorage(
          data.preview_image_file,
          `${baseFolder}/preview${getFileExtension(data.preview_image_file)}`,
          data.preview_image_file.type,
        )
      }

      if (data.preview_video_file) {
        try {
          videoUrl = await uploadToR2ClientSide({
            file: data.preview_video_file,
            fileKey: `${baseFolder}/video.mp4`,
            bucketName: "components-code",
            contentType: "video/mp4",
          })
        } catch (error) {
          console.error("Error uploading video:", error)
          throw new Error("Failed to upload video")
        }
      }

      setPublishProgress("Creating template...")

      // Логируем данные перед созданием записи
      console.log("Template data:", {
        ...data,
        user_id: userUuid,
        previewImageUrl,
        videoUrl,
      })

      const { error } = await client.from("templates").insert({
        name: data.name,
        template_slug: data.template_slug,
        description: data.description,
        preview_url: previewImageUrl || "",
        video_url: videoUrl || null,
        website_preview_url: data.website_preview_url,
        payment_url: data.payment_url,
        price: data.price,
        user_id: userUuid,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        downloads_count: 0,
      })

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      clearDraft()
      toast.success("Template published successfully")
      router.push("/?tab=templates")
    } catch (error) {
      console.error("Error publishing template:", error)
      toast.error(
        error instanceof Error ? error.message : "Error publishing template",
      )
    } finally {
      setIsSubmitting(false)
      setPublishProgress("")
    }
  }

  const handleNameChange = (name: string) => {
    form.setValue("name", name)
    form.setValue("template_slug", makeSlugFromName(name))
  }

  // Вспомогательная функция для получения расширения файла
  const getFileExtension = (file: File | undefined): string => {
    if (!file?.name) return ""
    const parts = file.name.split(".")
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : ""
  }

  return (
    <div className="absolute inset-x-0 top-0 bg-background px-2 sm:px-4 md:px-0">
      <Card className="w-full max-w-[800px] mx-auto mt-4 sm:mt-20 p-4 sm:p-6 md:p-8 border-none mb-20 shadow-none">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-medium">New template</h2>
                {hasDraft() && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      restoreDraft()
                      toast.success("Draft restored")
                    }}
                  >
                    Restore Draft
                  </Button>
                )}
              </div>

              {isAdmin && (
                <div className="mb-6">
                  <Label htmlFor="publish-as">Publish as</Label>
                  <Input
                    id="publish-as"
                    placeholder="Enter username"
                    value={publishAsUsername}
                    onChange={(e) =>
                      form.setValue("publish_as_username", e.target.value)
                    }
                  />
                </div>
              )}

              <TemplateDetailsForm
                form={form}
                onNameChange={handleNameChange}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              size="lg"
            >
              Publish Template
            </Button>
          </form>
        </Form>
      </Card>

      <LoadingDialog isOpen={isSubmitting} message={publishProgress} />
    </div>
  )
}

export { PublishTemplateForm }
