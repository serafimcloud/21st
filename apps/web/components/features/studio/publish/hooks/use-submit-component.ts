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

export const useSubmitComponent = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(false)
  const [publishProgress, setPublishProgress] = useState("")
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [createdDemoSlug, setCreatedDemoSlug] = useState<string>()
  const client = useClerkSupabaseClient()
  const { upload: uploadToR2ClientSide } = useR2Upload()

  const getParsedCode = async (registryResult: {
    componentRegistryJSON: string
    demoRegistryJSON: string
  }) => {
    const { componentRegistryJSON, demoRegistryJSON } = registryResult

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

  const submitComponent = async ({
    data,
    publishAsUser,
    updateComponentNameAndImport,
    generateRegistry,
    bundleDemo,
    sandboxId,
    onSuccess,
  }: {
    data: FormData
    publishAsUser: { id: string; username?: string }
    updateComponentNameAndImport: (newSlug: string) => Promise<void>
    generateRegistry: (slug?: string) => Promise<
      | {
          componentRegistryJSON: string
          demoRegistryJSON: string
        }
      | undefined
    >
    bundleDemo: () => Promise<string | undefined>
    sandboxId: string
    onSuccess: () => void
  }) => {
    setIsSubmitting(true)
    setIsLoadingDialogOpen(true)
    setPublishProgress("Bundling component...")

    console.log("data", data)

    // Ensure component slug is provided before proceeding
    if (!data.component_slug) {
      toast.error("Component slug is required before submitting.")
      setIsSubmitting(false)
      setIsLoadingDialogOpen(false)
      return
    }

    try {
      // 1. Rename component file and update imports
      setPublishProgress("Updating component name and imports...")
      await updateComponentNameAndImport(data.component_slug)

      // 2. Generate registry using the slug
      setPublishProgress("Bundling component...")
      const resultOfGenerateRegistry = await generateRegistry(
        data.component_slug,
      )
      if (!resultOfGenerateRegistry) {
        toast.error("Failed to bundle component; Please try again.")
        // Potentially revert the rename?
        throw new Error("Failed to generate registry after renaming.") // Throw to signify failure
      }
      const parsedCode = await getParsedCode(resultOfGenerateRegistry)
      const { componentCode, demoCode, componentNames, dependencies } =
        parsedCode

      // 3. Bundle the demo
      const bundleDemoResult = await bundleDemo()
      if (!bundleDemoResult) {
        toast.error("Failed to bundle demo; Please try again.")
        throw new Error("Failed to bundle demo.") // Throw to signify failure
      }
      const contentOfHtml = bundleDemoResult

      console.log("componentCode", componentCode)
      console.log("demoCode", demoCode)
      console.log("componentNames", componentNames)
      console.log("dependencies", dependencies)

      let componentIdToUse: string | null = null
      let existingDemoId: string | null = null

      // Proceed with the rest of the submission logic (checking sandbox, uploading, DB operations)
      if (!publishAsUser?.id) {
        throw new Error(
          "Cannot determine user to publish as. Please ensure you are logged in.",
        )
      }
      if (!sandboxId) {
        throw new Error("Sandbox ID is required.")
      }
      if (!data.demos || data.demos.length === 0) {
        throw new Error("At least one demo is required.")
      }
      const demo = data.demos[0]!

      console.log("BEFORE DATA sandboxId", sandboxId)

      // 1. Check if sandbox is already linked to a component
      setPublishProgress("Checking sandbox status...")
      const { data: sandboxData, error: sandboxError } = await client
        .from("sandboxes")
        .select("component_id")
        .eq("id", sandboxId)
        .maybeSingle()

      if (sandboxError) {
        console.error("Error fetching sandbox:", sandboxError)
        throw new Error(
          `Failed to fetch sandbox details: ${sandboxError.message}`,
        )
      }

      if (sandboxData?.component_id) {
        componentIdToUse = sandboxData.component_id
        setPublishProgress("Found existing component link. Preparing update...")
        // Optionally fetch the existing demo ID if needed for update logic
        const { data: existingDemoData, error: demoFetchError } = await client
          .from("demos")
          .select("id")
          .eq("component_id", componentIdToUse)
          .order("created_at", { ascending: true }) // Get the first demo
          .limit(1)
          .single()

        if (demoFetchError && demoFetchError.code !== "PGRST116") {
          // Ignore 'not found' error
          console.error("Error fetching existing demo:", demoFetchError)
          // Decide how to handle this - fail, or proceed to create a new demo?
          // For now, let's proceed assuming we might create a new one if needed, or update logic handles null demoId
        }
        existingDemoId = existingDemoData?.id ?? null
      } else {
        setPublishProgress(
          "No existing component link found. Preparing creation...",
        )
      }

      setPublishProgress("Uploading component files...")
      const baseFolder = `${publishAsUser.username}/${data.slug}`

      const [
        codeUrl,
        demoCodeUrl,
        previewImageR2Url,
        videoR2Url,
        bundleHtmlUrl,
      ] = await Promise.all([
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
        uploadToR2({
          file: {
            name: "bundle.html",
            type: "text/html",
            textContent: contentOfHtml,
          },
          fileKey: `${baseFolder}/${demo.demo_slug}/bundle.html`,
          bucketName: "components-code",
          contentType: "text/html",
        }),
      ])

      console.log("Actual Uploading Results:", {
        codeUrl,
        demoCodeUrl,
        previewImageR2Url,
        videoR2Url,
        bundleHtmlUrl,
      })

      setPublishProgress(
        componentIdToUse
          ? "Updating component entry..."
          : "Creating component entry...",
      )
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
        sandbox_id: sandboxId,
      }

      let finalComponent: Tables<"components"> | null = null

      if (componentIdToUse) {
        // Update existing component
        console.log(
          `Attempting to update component with ID: ${componentIdToUse}`,
        )
        const { data: updatedComponent, error: updateComponentError } =
          await client
            .from("components")
            .update(componentData)
            .eq("id", componentIdToUse)
            .select()

        console.log("Update component result:", {
          updatedComponent,
          updateComponentError,
        })

        if (updateComponentError) {
          console.error("Error updating component:", updateComponentError)
          throw updateComponentError
        }
        if (!updatedComponent) {
          console.error("Update component failed: No data returned.") // Log specific error
          throw new Error("Failed to update component, no data returned.")
        }
        finalComponent = updatedComponent
        console.log("Successfully updated component:", finalComponent)
      } else {
        // Insert new component
        console.log(
          "Attempting to insert new component with data:",
          componentData,
        )
        const { data: insertedComponent, error: insertComponentError } =
          await client
            .from("components")
            .insert(componentData)
            .select()
            .single()

        console.log("Insert component result:", {
          insertedComponent,
          insertComponentError,
        })

        if (insertComponentError) {
          console.error("Error inserting component:", insertComponentError)
          throw insertComponentError
        }
        if (!insertedComponent) {
          console.error("Insert component failed: No data returned.") // Log specific error
          throw new Error("Failed to insert component, no data returned.")
        }
        finalComponent = insertedComponent
        componentIdToUse = String(finalComponent!.id) // Convert number to string and assert non-null
        console.log("Successfully created component:", finalComponent)

        // Link sandbox to the new component
        setPublishProgress("Linking sandbox to new component...")
        const { error: updateSandboxError } = await client
          .from("sandboxes")
          .update({ component_id: componentIdToUse })
          .eq("id", sandboxId)

        if (updateSandboxError) {
          console.error("Error updating sandbox link:", updateSandboxError)
          // Non-fatal? Log error and continue? Or throw?
          // Let's log and continue for now, but this might need review
          toast.warning("Failed to link sandbox to the new component.")
        } else {
          console.log(
            `Sandbox ${sandboxId} linked to component ${componentIdToUse}`,
          )
        }

        // Handle submission entry only for new, non-public components
        if (!data.is_public) {
          setPublishProgress("Creating submission entry...")
          const { error: submissionError } = await client
            .from("submissions")
            .insert({
              component_id: componentIdToUse,
              status: "on_review",
            })
          if (submissionError) {
            console.error("Error inserting submission:", submissionError)
            throw submissionError // Throw as this seems critical for review process
          }
          console.log(
            "Submission entry created for component:",
            componentIdToUse,
          )
        }
      } // End of create/update component block

      // Ensure we have a component ID before proceeding to demo
      if (!componentIdToUse) {
        throw new Error("Component ID is missing after create/update.")
      }

      console.log("-------------")
      console.log("-------------")
      console.log("-------------")
      console.log("-------------")
      console.log("------WURUP-------")
      console.log("sandboxData", sandboxData)
      console.log("componentIdToUse", componentIdToUse)

      // Ensure the sandbox is linked to the component
      if (!sandboxData?.component_id) {
        setPublishProgress("Updating sandbox link...")
        const { error: updateSandboxError } = await client
          .from("sandboxes")
          .update({ component_id: componentIdToUse })
          .eq("id", sandboxId)

        if (updateSandboxError) {
          console.error("Error updating sandbox link:", updateSandboxError)
          toast.warning("Failed to update sandbox component link.")
        } else {
          console.log(
            `Sandbox ${sandboxId} link updated with component ${componentIdToUse}`,
          )
        }
      }

      // Prepare Demo Data (common for create/update)
      setPublishProgress(
        existingDemoId ? "Updating demo entry..." : "Creating demo entry...",
      )
      const demoSlug =
        demo.demo_slug ||
        (await generateDemoSlug(
          client,
          demo.name || "Default",
          Number(componentIdToUse), // Convert string to number for generateDemoSlug
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
        component_id: Number(componentIdToUse), // Convert string to number for demoData
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
        bundle_html_url: bundleHtmlUrl,
      }

      let finalDemo: Tables<"demos"> | null = null

      if (existingDemoId) {
        // Update existing demo
        console.log(`Attempting to update demo with ID: ${existingDemoId}`)
        const { data: updatedDemo, error: updateDemoError } = await client
          .from("demos")
          .update(demoData)
          .eq("id", existingDemoId)
          .select()
          .single()

        console.log("Update demo result:", { updatedDemo, updateDemoError })

        if (updateDemoError) {
          console.error("Error updating demo:", updateDemoError)
          throw updateDemoError
        }
        if (!updatedDemo) {
          console.error("Update demo failed: No data returned.") // Log specific error
          throw new Error("Failed to update demo, no data returned.")
        }
        finalDemo = updatedDemo
        console.log("Successfully updated demo:", finalDemo)
      } else {
        // Insert new demo
        console.log("Attempting to insert new demo with data:", demoData)
        const { data: insertedDemo, error: insertDemoError } = await client
          .from("demos")
          .insert(demoData)
          .select()
          .single()

        console.log("Insert demo result:", { insertedDemo, insertDemoError })

        if (insertDemoError) {
          console.error("Error inserting demo:", insertDemoError)
          throw insertDemoError
        }
        if (!insertedDemo) {
          console.error("Insert demo failed: No data returned.") // Log specific error
          throw new Error("Failed to insert demo, no data returned.")
        }
        finalDemo = insertedDemo
        console.log("Successfully created demo:", finalDemo)
      }

      if (!finalDemo) {
        console.error("Final demo object is null after create/update attempts.") // Log if somehow finalDemo is still null
        throw new Error("Demo operation failed.") // Should not happen if errors above are thrown
      }

      if (demo.tags?.length > 0) {
        setPublishProgress("Updating tags...")
        await addTagsToDemo(
          client,
          finalDemo.id, // Use the final demo ID
          demo.tags.filter((tag): tag is Tag => !!tag && !!tag.slug) as Tag[], // Ensure tags are valid
        )
        console.log("Tags updated for demo:", finalDemo.id)
      }

      setPublishProgress("Done!")
      setIsSuccessDialogOpen(true)

      // Log final state
      console.log("Final component state:", finalComponent!)
      console.log("Final demo state:", finalDemo!)
      if (!data.is_public && !componentIdToUse) {
        // Only log submission if it was newly created
        const { data: submission } = await client
          .from("submissions")
          .select()
          .eq("component_id", componentIdToUse)
          .single()
        console.log("Newly inserted submission:", submission)
      }
    } catch (error) {
      console.error("Error submitting component:", error)
      toast.error(
        `Submission failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      setPublishProgress("Submission failed")
      // Consider adding rollback logic here if needed, e.g., renaming the file back
    } finally {
      setIsSubmitting(false)
      onSuccess() // Call onSuccess regardless of success/failure?
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
