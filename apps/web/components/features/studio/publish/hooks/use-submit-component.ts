import { useState } from "react"
import { toast } from "sonner"
import { Tables } from "@/types/supabase"
import { Tag } from "@/types/global"
import { addVersionToUrl } from "@/lib/utils/url"
import { addTagsToDemo } from "@/lib/queries"
import { generateDemoSlug } from "@/components/features/publish-old/hooks/use-is-check-slug-available"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { FormData } from "../config/utils"
import { uploadToR2 } from "@/lib/r2"
import { useR2Upload } from "@/components/features/publish-old/hooks/use-r2-upload"

type ParsedCodeData = {
  componentCode: string
  demoCode: string
  componentNames: string[]
  dependencies?: Record<string, string>
  demoDependencies?: Record<string, string>
}

export const useSubmitComponent = ({
  generateRegistry,
}: {
  generateRegistry: () => Promise<{
    componentRegistryJSON: string
    demoRegistryJSON: string
  }>
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(false)
  const [publishProgress, setPublishProgress] = useState("")
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [createdDemoSlug, setCreatedDemoSlug] = useState<string>()
  const client = useClerkSupabaseClient()
  const { upload: uploadToR2ClientSide } = useR2Upload()

  const getParsedCode = async () => {
    const { componentRegistryJSON, demoRegistryJSON } = await generateRegistry()

    const componentRegistry = JSON.parse(componentRegistryJSON)
    const demoRegistry = JSON.parse(demoRegistryJSON)

    const componentCode = componentRegistry.files[0].content
    const demoCode = demoRegistry.files[0].content

    return {
      componentCode,
      demoCode,
      componentNames: [componentRegistry.name],
      dependencies: componentRegistry.dependencies.reduce(
        (acc: Record<string, string>, dep: string) => {
          acc[dep] = "latest"
          return acc
        },
        {},
      ),
      demoDependencies: demoRegistry.dependencies.reduce(
        (acc: Record<string, string>, dep: string) => {
          acc[dep] = "latest"
          return acc
        },
        {},
      ),
    }
  }

  const submitComponent = async (
    data: FormData,
    publishAsUser: { id: string; username?: string },
  ) => {
    const parsedCode = await getParsedCode()
    const { componentCode, demoCode, componentNames, dependencies } = parsedCode

    console.log("componentCode", componentCode)
    console.log("demoCode", demoCode)
    console.log("componentNames", componentNames)
    console.log("dependencies", dependencies)

    setIsSubmitting(true)
    setIsLoadingDialogOpen(true)
    setPublishProgress("Starting submission...")

    try {
      if (!publishAsUser?.id) {
        throw new Error(
          "Cannot determine user to publish as. Please ensure you are logged in.",
        )
      }
      if (!data.component_slug) {
        throw new Error("Component slug is required.")
      }
      if (!data.demos || data.demos.length === 0) {
        throw new Error("At least one demo is required.")
      }
      const demo = data.demos[0]!

      setPublishProgress("Uploading component files...")
      const baseFolder = `${publishAsUser.id}/${data.component_slug}`

      const [codeUrl, demoCodeUrl, previewImageR2Url, videoR2Url] =
        await Promise.all([
          uploadToR2({
            file: {
              name: "code.tsx",
              type: "text/plain",
              textContent: componentCode,
            },
            fileKey: `${baseFolder}/code.tsx`,
            bucketName: "components-code",
          }),
          uploadToR2({
            file: {
              name: "demo.tsx",
              type: "text/plain",
              textContent: demoCode,
            },
            fileKey: `${baseFolder}/${demo.demo_slug}/code.demo.tsx`,
            bucketName: "components-code",
          }),
          demo.preview_image_file &&
          demo.preview_image_file.size > 0 &&
          demo.preview_image_data_url
            ? uploadToR2({
                file: {
                  name: "preview.png",
                  type: demo.preview_image_file.type,
                  encodedContent: demo.preview_image_data_url.replace(
                    /^data:image\/(png|jpeg|jpg);base64,/,
                    "",
                  ),
                },
                fileKey: `${baseFolder}/${demo.demo_slug}/preview.png`,
                bucketName: "components-code",
                contentType: demo.preview_image_file.type,
              })
            : Promise.resolve(null),
          demo.preview_video_file &&
          demo.preview_video_file.size > 0 &&
          demo.preview_video_data_url
            ? uploadToR2ClientSide({
                file: demo.preview_video_file,
                fileKey: `${baseFolder}/${demo.demo_slug}/video.mp4`,
                bucketName: "components-code",
                contentType: "video/mp4",
              })
            : Promise.resolve(null),
        ])

      console.log("Actual Uploading Results:", {
        codeUrl,
        demoCodeUrl,
        previewImageR2Url,
        videoR2Url,
      })

      setPublishProgress("Creating component entry...")
      const componentData: Omit<
        Tables<"components">,
        | "id"
        | "created_at"
        | "updated_at"
        | "embedding"
        | "embedding_oai"
        | "fts"
        | "bookmarks_count"
        | "compiled_css"
        | "demo_code"
        | "demo_direct_registry_dependencies"
        | "downloads_count"
        | "likes_count"
        | "views_count"
        | "version"
        | "hunter_username"
        | "payment_url"
        | "pro_preview_image_url"
        | "registry_url"
      > = {
        name: data.name,
        component_names: parsedCode.componentNames,
        component_slug: data.component_slug,
        code: addVersionToUrl(codeUrl) || "",
        tailwind_config_extension: null,
        global_css_extension: null,
        description: data.description ?? null,
        user_id: publishAsUser.id,
        dependencies: parsedCode.dependencies || {},
        demo_dependencies: parsedCode.demoDependencies || {},
        direct_registry_dependencies: data.direct_registry_dependencies || [],
        preview_url: addVersionToUrl(previewImageR2Url),
        video_url: addVersionToUrl(videoR2Url),
        registry: data.registry,
        license: data.license,
        website_url: data.website_url || null,
        is_public: data.is_public,
        is_paid: data.is_paid || false,
        price: data.is_paid ? data.price || 5 : 0,
      }

      // Mock Supabase Component Insert
      console.log("Mock Inserting Component:", componentData)
      const insertedComponent = {
        id: `mock-component-id-${Date.now()}`,
        ...componentData,
      }
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay

      if (!data.is_public) {
        setPublishProgress("Creating submission entry...")
        console.log(
          "Mock Inserting Submission for component:",
          insertedComponent.id,
        )
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      setPublishProgress("Creating demo entry...")
      const demoSlug =
        demo.demo_slug ||
        (await generateDemoSlug(
          client,
          demo.name || "Default",
          typeof insertedComponent.id === "string"
            ? parseInt(insertedComponent.id.split("-").pop() || "0")
            : insertedComponent.id,
          publishAsUser.id,
        ))
      setCreatedDemoSlug(demoSlug)

      const demoData: Omit<
        Tables<"demos">,
        | "id"
        | "created_at"
        | "updated_at"
        | "embedding"
        | "embedding_oai"
        | "fts"
        | "bookmarks_count"
      > = {
        component_id:
          typeof insertedComponent.id === "string"
            ? parseInt(insertedComponent.id.split("-").pop() || "0")
            : insertedComponent.id,
        demo_code: addVersionToUrl(demoCodeUrl) || "",
        demo_dependencies: demo.demo_dependencies || {},
        preview_url: addVersionToUrl(previewImageR2Url),
        video_url: addVersionToUrl(videoR2Url),
        compiled_css: null,
        pro_preview_image_url: null,
        name: demo.name || "Default Demo",
        demo_direct_registry_dependencies:
          demo.demo_direct_registry_dependencies || null,
        user_id: publishAsUser.id,
        demo_slug: demoSlug,
      }

      console.log("Mock Inserting Demo:", demoData)
      const insertedDemo = { id: `mock-demo-id-${Date.now()}`, ...demoData }
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (demo.tags?.length > 0) {
        setPublishProgress("Adding tags...")
        console.log("Mock Adding Tags:", demo.tags, "to demo:", insertedDemo.id)
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      setPublishProgress("Done!")
      setIsSuccessDialogOpen(true)
    } catch (error) {
      console.error("Error submitting component:", error)
      toast.error(
        `Submission failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      setPublishProgress("Submission failed")
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setIsLoadingDialogOpen(false), 1500)
    }
  }

  return {
    isSubmitting,
    isLoadingDialogOpen,
    publishProgress,
    isSuccessDialogOpen,
    createdDemoSlug,
    submitComponent,
    setIsSuccessDialogOpen,
  }
}
