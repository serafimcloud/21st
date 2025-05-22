import { generateDemoSlug } from "@/components/features/publish/hooks/use-is-check-slug-available"
import { useR2Upload } from "@/components/features/publish/hooks/use-r2-upload"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { addTagsToDemo } from "@/lib/queries"
import { uploadToR2 } from "@/lib/r2"
import { Tag } from "@/types/global"
import { Tables } from "@/types/supabase"
import { useState } from "react"
import { toast } from "sonner"
import { FormData } from "../config/utils"

type ParsedCodeData = {
  componentCode: string
  demoCode: string
  componentNames: string[]
  dependencies?: Record<string, string>
  demoDependencies?: Record<string, string>
}

type FileUploadResult = {
  codeUrl: string
  demoCodeUrl: string
  previewImageR2Url: string | null
  videoR2Url: string | null
  bundleHtmlUrl: string
  registryJsonUrl: string
  indexCssUrl: string | null
}

type StepContext = {
  supabase: ReturnType<typeof useClerkSupabaseClient>
  form: FormData
  publishAsUser: { id: string; username?: string }
  sandboxId: string
  updateComponentNameAndImport: (newSlug: string) => Promise<void>
  optimizeComponentAndDemo: (componentSlug: string) => Promise<void>
  generateRegistry: (slug?: string) => Promise<
    | {
        componentRegistryJSON: string
        demoRegistryJSON: string
      }
    | undefined
  >
  bundleDemo: () => Promise<string | undefined>
  reconnectSandbox: () => Promise<void>
  uploadToR2ClientSide: ReturnType<typeof useR2Upload>["upload"]
  getParsedCode: (registryResult: {
    componentRegistryJSON: string
    demoRegistryJSON: string
  }) => Promise<ParsedCodeData>
  setPublishProgress: (message: string) => void
  setCreatedDemoSlug: (slug: string) => void
  setIsSuccessDialogOpen: (isOpen: boolean) => void
}

type SubmissionProcessState = {
  parsedCodeData?: ParsedCodeData
  contentOfHtml?: string
  componentIdToUse: number | null
  existingDemoId: number | null
  sandboxData?: any
  fileUploadResult?: FileUploadResult
  finalComponent: Tables<"components"> | null
  finalDemo: Tables<"demos"> | null
  demoSlug?: string
  isNewComponent: boolean
  componentRegistryJSON?: string
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

  async function _initializeAndValidateInput(
    context: StepContext,
    state: SubmissionProcessState,
  ): Promise<SubmissionProcessState> {
    await context.reconnectSandbox()

    if (!context.form.component_slug) {
      toast.error("Component slug is required before submitting.")
      throw new Error("Component slug is required")
    }

    if (!context.publishAsUser?.id) {
      throw new Error(
        "Cannot determine user to publish as. Please ensure you are logged in.",
      )
    }

    if (!context.sandboxId) {
      throw new Error("Sandbox ID is required.")
    }

    if (!context.form.demos || context.form.demos.length === 0) {
      throw new Error("At least one demo is required.")
    }

    return state
  }

  async function _stepUpdateComponentNameAndImports(
    context: StepContext,
    state: SubmissionProcessState,
  ): Promise<SubmissionProcessState> {
    context.setPublishProgress("Updating component name and imports...")
    try {
      await context.updateComponentNameAndImport(context.form.component_slug)
    } catch (error) {
      console.error("Error updating component name and imports:", error)
      toast.error("Renaming component failed; but we will continue")
    }
    return state
  }

  async function _stepOptimizeComponent(
    context: StepContext,
    state: SubmissionProcessState,
  ): Promise<SubmissionProcessState> {
    context.setPublishProgress("Optimizing component code...")
    try {
      await context.optimizeComponentAndDemo(context.form.component_slug)
      console.log(
        `Successfully optimized code for ${context.form.component_slug}`,
      )
    } catch (error) {
      console.error("Error during component optimization:", error)
      toast.error("Failed to optimize component code.")
      // Continue with the process even if optimization fails
    }
    return state
  }

  async function _stepGenerateRegistryAndParseCode(
    context: StepContext,
    state: SubmissionProcessState,
  ): Promise<SubmissionProcessState> {
    context.setPublishProgress("Building component...")
    const resultOfGenerateRegistry = await context.generateRegistry(
      context.form.component_slug,
    )

    if (!resultOfGenerateRegistry) {
      toast.error("Failed to bundle component; Please try again.")
      throw new Error("Failed to generate registry after renaming.")
    }

    const parsedCode = await context.getParsedCode(resultOfGenerateRegistry)
    return {
      ...state,
      parsedCodeData: parsedCode,
      componentRegistryJSON: resultOfGenerateRegistry.componentRegistryJSON,
    }
  }

  async function _stepBundleDemo(
    context: StepContext,
    state: SubmissionProcessState,
  ): Promise<SubmissionProcessState> {
    const bundleDemoResult = await context.bundleDemo()
    if (!bundleDemoResult) {
      toast.error("Failed to bundle demo; Please try again.")
      throw new Error("Failed to bundle demo.")
    }

    return { ...state, contentOfHtml: bundleDemoResult }
  }

  async function _stepFetchSandboxAndExistingInfo(
    context: StepContext,
    state: SubmissionProcessState,
  ): Promise<SubmissionProcessState> {
    context.setPublishProgress("Checking sandbox status...")
    const { data: sandboxData, error: sandboxError } = await context.supabase
      .from("sandboxes")
      .select("component_id")
      .eq("id", context.sandboxId)
      .maybeSingle()

    if (sandboxError) {
      console.error("Error fetching sandbox:", sandboxError)
      throw new Error(
        `Failed to fetch sandbox details: ${sandboxError.message}`,
      )
    }

    let componentIdToUse: number | null = null
    let existingDemoId: number | null = null
    let isNewComponent = true

    if (
      sandboxData?.component_id !== null &&
      sandboxData?.component_id !== undefined
    ) {
      componentIdToUse = sandboxData.component_id
      isNewComponent = false

      context.setPublishProgress(
        "Found existing component link. Preparing update...",
      )

      const { data: existingDemoData, error: demoFetchError } =
        await context.supabase
          .from("demos")
          .select("id")
          .eq("component_id", componentIdToUse)
          .order("created_at", { ascending: true })
          .limit(1)
          .single()

      if (demoFetchError && demoFetchError.code !== "PGRST116") {
        console.error("Error fetching existing demo:", demoFetchError)
      }

      existingDemoId = existingDemoData?.id ?? null
    } else {
      context.setPublishProgress(
        "No existing component link found. Preparing creation...",
      )
    }

    return {
      ...state,
      componentIdToUse,
      existingDemoId,
      sandboxData,
      isNewComponent,
    }
  }

  async function _stepUploadFiles(
    context: StepContext,
    state: SubmissionProcessState,
  ): Promise<SubmissionProcessState> {
    if (!state.parsedCodeData) throw new Error("Missing parsed code data")
    if (!state.componentRegistryJSON) throw new Error("Missing registry JSON")

    context.setPublishProgress("Uploading component files...")
    const demo = context.form.demos[0]!
    const baseFolder = `${context.publishAsUser.username}/${context.form.component_slug}`
    const { componentCode, demoCode } = state.parsedCodeData

    console.log("demo", demo)

    const generateIndexCss = (registryJson: string): string | undefined => {
      try {
        const reg = JSON.parse(registryJson)
        const { cssVars = {}, css = {} } = reg
        const themeVars: Record<string, string> = cssVars.theme ?? {}
        const lightVars: Record<string, string> = cssVars.light ?? {}
        const darkVars: Record<string, string> = cssVars.dark ?? {}

        const hasCustomVars =
          Object.keys(themeVars).length > 0 ||
          Object.keys(lightVars).length > 0 ||
          Object.keys(darkVars).length > 0
        const hasCustomCss = Object.keys(css).length > 0

        if (!hasCustomVars && !hasCustomCss) {
          return undefined
        }

        const lines: string[] = []
        lines.push('@import "tailwindcss";')
        lines.push('@import "tw-animate-css";\n')

        if (Object.keys(themeVars).length) {
          lines.push("@theme inline {")
          Object.entries(themeVars).forEach(([k, v]) =>
            lines.push(`  ${k}: ${v};`),
          )
          lines.push("}\n")
        }

        const writeVarBlock = (
          selector: string,
          vars: Record<string, string>,
        ) => {
          if (!Object.keys(vars).length) return
          lines.push(`${selector} {`)
          Object.entries(vars).forEach(([k, v]) => lines.push(`  ${k}: ${v};`))
          lines.push("}\n")
        }

        writeVarBlock(":root", lightVars)
        writeVarBlock(".dark", darkVars)

        Object.entries(css as Record<string, any>).forEach(
          ([selector, steps]) => {
            lines.push(`\n${selector} {`)
            if (steps && typeof steps === "object") {
              Object.entries(steps as Record<string, any>).forEach(
                ([step, styles]) => {
                  lines.push(`  ${step} {`)
                  if (styles && typeof styles === "object") {
                    Object.entries(styles as Record<string, any>).forEach(
                      ([prop, val]) => {
                        lines.push(`    ${prop}: ${val};`)
                      },
                    )
                  }
                  lines.push("  }")
                },
              )
            }
            lines.push("}")
          },
        )

        return lines.join("\n")
      } catch (e) {
        console.error("Failed to generate index.css", e)
        return undefined
      }
    }

    const indexCssContent: string | undefined = generateIndexCss(
      state.componentRegistryJSON,
    )
    const hasIndexCss = typeof indexCssContent === "string"

    const [
      codeUrl,
      demoCodeUrl,
      previewImageR2Url,
      videoR2Url,
      bundleHtmlUrl,
      registryJsonUrl,
      indexCssUrl,
    ] = await Promise.all([
      uploadToR2({
        file: {
          name: "code.tsx",
          type: "text/plain",
          textContent: componentCode,
        },
        fileKey: `${baseFolder}/code.${Date.now()}.tsx`,
        bucketName: "components-code",
      }),
      uploadToR2({
        file: {
          name: "demo.tsx",
          type: "text/plain",
          textContent: demoCode,
        },
        fileKey: `${baseFolder}/${demo.demo_slug}/code.demo.${Date.now()}.tsx`,
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
            fileKey: `${baseFolder}/${demo.demo_slug}/preview.${Date.now()}.png`,
            bucketName: "components-code",
            contentType: demo.preview_image_file.type,
          })
        : Promise.resolve(null),
      demo.preview_video_file &&
      demo.preview_video_file.size > 0 &&
      demo.preview_video_data_url
        ? context.uploadToR2ClientSide({
            file: demo.preview_video_file,
            fileKey: `${baseFolder}/${demo.demo_slug}/video.${Date.now()}.mp4`,
            bucketName: "components-code",
            contentType: "video/mp4",
          })
        : Promise.resolve(null),
      uploadToR2({
        file: {
          name: "bundle.html",
          type: "text/html",
          textContent: state.contentOfHtml!,
        },
        fileKey: `${baseFolder}/${demo.demo_slug}/bundle.${Date.now()}.html`,
        bucketName: "components-code",
        contentType: "text/html",
      }),
      uploadToR2({
        file: {
          name: "registry.json",
          type: "application/json",
          textContent: state.componentRegistryJSON,
        },
        fileKey: `${baseFolder}/registry.${Date.now()}.json`,
        bucketName: "components-code",
        contentType: "application/json",
      }),
      hasIndexCss
        ? uploadToR2({
            file: {
              name: "index.css",
              type: "text/css",
              textContent: indexCssContent,
            },
            fileKey: `${baseFolder}/index.${Date.now()}.css`,
            bucketName: "components-code",
            contentType: "text/css",
          })
        : Promise.resolve(null),
    ])

    return {
      ...state,
      fileUploadResult: {
        codeUrl,
        demoCodeUrl,
        previewImageR2Url,
        videoR2Url,
        bundleHtmlUrl,
        registryJsonUrl,
        indexCssUrl,
      },
    }
  }

  async function _stepUpsertComponent(
    context: StepContext,
    state: SubmissionProcessState,
  ): Promise<SubmissionProcessState> {
    if (!state.parsedCodeData || !state.fileUploadResult) {
      throw new Error("Missing required data for component creation/update")
    }

    const { componentIdToUse } = state
    const {
      codeUrl,
      previewImageR2Url,
      videoR2Url,
      registryJsonUrl,
      indexCssUrl,
    } = state.fileUploadResult
    const { parsedCodeData } = state

    context.setPublishProgress(
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
    > = {
      name: context.form.name,
      component_names: parsedCodeData.componentNames,
      component_slug: context.form.component_slug,
      code: codeUrl || "",
      tailwind_config_extension: null,
      global_css_extension: null,
      description: context.form.description ?? null,
      user_id: context.publishAsUser.id,
      dependencies: parsedCodeData.dependencies || {},
      demo_dependencies: parsedCodeData.demoDependencies || {},
      direct_registry_dependencies: (() => {
        const initialDeps = context.form.direct_registry_dependencies || []
        let registryDeps: string[] = []
        try {
          if (state.componentRegistryJSON) {
            const parsed = JSON.parse(state.componentRegistryJSON) as {
              registryDependencies?: string[]
            }
            if (Array.isArray(parsed.registryDependencies)) {
              registryDeps = parsed.registryDependencies.map((d) =>
                d.replace("https://21st.dev/r/", ""),
              )
            }
          }
        } catch (err) {
          console.error("Failed to parse registryDependencies", err)
        }
        return Array.from(new Set([...initialDeps, ...registryDeps]))
      })(),
      preview_url: previewImageR2Url || "",
      video_url: videoR2Url || "",
      registry: context.form.registry,
      license: context.form.license,
      website_url: context.form.website_url || null,
      is_public: context.form.is_public,
      sandbox_id: context.sandboxId,
      registry_url: registryJsonUrl,
      index_css_url: indexCssUrl || null,
    }

    let finalComponent: Tables<"components"> | null = null
    let updatedComponentId = componentIdToUse

    if (componentIdToUse) {
      const { data: updatedComponent, error: updateComponentError } =
        await context.supabase
          .from("components")
          .update(componentData)
          .eq("id", componentIdToUse)
          .select()

      if (updateComponentError) {
        console.error("Error updating component:", updateComponentError)
        throw updateComponentError
      }

      finalComponent = (
        updatedComponent && updatedComponent.length > 0
          ? updatedComponent[0]
          : null
      ) as Tables<"components"> | null

      if (!finalComponent) {
        console.error("Update component failed: No data returned.")
        throw new Error("Failed to update component, no data returned.")
      }
    } else {
      const { data: insertedComponent, error: insertComponentError } =
        await context.supabase
          .from("components")
          .insert(componentData)
          .select()
          .single()

      if (insertComponentError) {
        console.error("Error inserting component:", insertComponentError)
        throw insertComponentError
      }

      finalComponent = insertedComponent as Tables<"components"> | null

      if (!finalComponent) {
        console.error("Insert component failed: No data returned.")
        throw new Error("Failed to insert component, no data returned.")
      }

      updatedComponentId = finalComponent.id
    }

    return {
      ...state,
      componentIdToUse: updatedComponentId,
      finalComponent,
    }
  }

  async function _stepManageSandboxLinkAndSubmission(
    context: StepContext,
    state: SubmissionProcessState,
  ): Promise<SubmissionProcessState> {
    const { componentIdToUse, sandboxData } = state

    if (!componentIdToUse) {
      throw new Error("Component ID is missing after create/update.")
    }

    // Link sandbox to component if it's a new component
    if (state.isNewComponent) {
      context.setPublishProgress("Linking sandbox to new component...")
      const { error: updateSandboxError } = await context.supabase
        .from("sandboxes")
        .update({ component_id: componentIdToUse })
        .eq("id", context.sandboxId)

      if (updateSandboxError) {
        console.error("Error updating sandbox link:", updateSandboxError)
        toast.warning("Failed to link sandbox to the new component.")
      }
    }

    // Create or update submission entry for private components
    if (typeof componentIdToUse === "number") {
      context.setPublishProgress("Ensuring submission status is on review…")

      const { data: existingSubmission, error: submissionFetchError } =
        await context.supabase
          .from("submissions")
          .select("id,status")
          .eq("component_id", componentIdToUse)
          .maybeSingle()

      if (submissionFetchError && submissionFetchError.code !== "PGRST116") {
        console.error("Error fetching submission:", submissionFetchError)
        throw submissionFetchError
      }

      if (!existingSubmission) {
        const { error: insertError } = await context.supabase
          .from("submissions")
          .insert({ component_id: componentIdToUse, status: "on_review" })

        if (insertError) {
          console.error("Error inserting submission:", insertError)
          throw insertError
        }
      } else {
        const { error: updateError } = await context.supabase
          .from("submissions")
          .update({ status: "on_review", moderators_feedback: null })
          .eq("id", existingSubmission.id)

        if (updateError) {
          console.error("Error updating submission:", updateError)
          throw updateError
        }
      }
    }

    // Update sandbox link if needed
    if (!sandboxData?.component_id) {
      context.setPublishProgress("Updating sandbox link...")
      const { error: updateSandboxError } = await context.supabase
        .from("sandboxes")
        .update({ component_id: componentIdToUse })
        .eq("id", context.sandboxId)

      if (updateSandboxError) {
        console.error("Error updating sandbox link:", updateSandboxError)
        toast.warning("Failed to update sandbox component link.")
      }
    }

    return state
  }

  async function _stepUpsertDemo(
    context: StepContext,
    state: SubmissionProcessState,
  ): Promise<SubmissionProcessState> {
    if (!state.componentIdToUse || !state.fileUploadResult) {
      throw new Error("Missing required data for demo creation/update")
    }

    const { existingDemoId, componentIdToUse } = state
    const { demoCodeUrl, previewImageR2Url, videoR2Url, bundleHtmlUrl } =
      state.fileUploadResult

    context.setPublishProgress(
      existingDemoId ? "Updating demo entry..." : "Creating demo entry...",
    )

    const demo = context.form.demos[0]!
    const demoSlug =
      demo.demo_slug ||
      (await generateDemoSlug(
        context.supabase,
        demo.name || "Default",
        componentIdToUse,
        context.publishAsUser.id,
      ))

    context.setCreatedDemoSlug(demoSlug)

    const demoData: Omit<
      Tables<"demos">,
      | "id"
      | "created_at"
      | "updated_at"
      | "embedding"
      | "embedding_oai"
      | "fts"
      | "bookmarks_count"
      // make them optional, if already exists to not upload it (r2 link will be empty)
      | "preview_url"
      | "video_url"
    > = {
      component_id: componentIdToUse,
      demo_code: demoCodeUrl,
      demo_dependencies: demo.demo_dependencies || {},
      ...(previewImageR2Url && {
        preview_url: previewImageR2Url,
      }),
      ...(videoR2Url && {
        video_url: videoR2Url,
      }),
      compiled_css: null,
      pro_preview_image_url: null,
      name: demo.name || "Default Demo",
      demo_direct_registry_dependencies:
        demo.demo_direct_registry_dependencies || null,
      user_id: context.publishAsUser.id,
      demo_slug: demoSlug,
      bundle_html_url: bundleHtmlUrl,
      bundle_hash: null,
    }

    let finalDemo: Tables<"demos"> | null = null

    if (existingDemoId) {
      const { data: updatedDemo, error: updateDemoError } =
        await context.supabase
          .from("demos")
          .update(demoData)
          .eq("id", existingDemoId)
          .select()

      if (updateDemoError) {
        console.error("Error updating demo:", updateDemoError)
        throw updateDemoError
      }

      finalDemo = (
        updatedDemo && updatedDemo.length > 0 ? updatedDemo[0] : null
      ) as Tables<"demos"> | null

      if (!finalDemo) {
        console.error("Update demo failed: No data returned.")
        throw new Error("Failed to update demo, no data returned.")
      }
    } else {
      const { data: insertedDemo, error: insertDemoError } =
        await context.supabase.from("demos").insert(demoData).select().single()

      if (insertDemoError) {
        console.error("Error inserting demo:", insertDemoError)
        throw insertDemoError
      }

      finalDemo = insertedDemo as Tables<"demos"> | null

      if (!finalDemo) {
        console.error("Insert demo failed: No data returned.")
        throw new Error("Failed to insert demo, no data returned.")
      }
    }

    return {
      ...state,
      finalDemo,
      demoSlug,
    }
  }

  async function _stepUpdateDemoTags(
    context: StepContext,
    state: SubmissionProcessState,
  ): Promise<SubmissionProcessState> {
    const demo = context.form.demos[0]!

    if (demo.tags?.length > 0 && state.finalDemo) {
      context.setPublishProgress("Updating tags...")
      await addTagsToDemo(
        context.supabase,
        state.finalDemo.id,
        demo.tags.filter((tag): tag is Tag => !!tag && !!tag.slug) as Tag[],
      )
    }

    return state
  }

  const submitComponent = async ({
    data,
    publishAsUser,
    updateComponentNameAndImport,
    optimizeComponentAndDemo,
    generateRegistry,
    bundleDemo,
    sandboxId,
    reconnectSandbox,
  }: {
    data: FormData
    publishAsUser: { id: string; username?: string }
    updateComponentNameAndImport: (newSlug: string) => Promise<void>
    optimizeComponentAndDemo?: (componentSlug: string) => Promise<void>
    generateRegistry: (slug?: string) => Promise<
      | {
          componentRegistryJSON: string
          demoRegistryJSON: string
        }
      | undefined
    >
    bundleDemo: () => Promise<string | undefined>
    sandboxId: string
    reconnectSandbox: () => Promise<void>
  }) => {
    setIsSubmitting(true)
    setIsLoadingDialogOpen(true)
    setPublishProgress("Bundling component...")

    // Create the step context with all dependencies and parameters needed
    const stepContext: StepContext = {
      supabase: client,
      form: data,
      publishAsUser,
      sandboxId,
      updateComponentNameAndImport,
      optimizeComponentAndDemo: optimizeComponentAndDemo || (async () => {}),
      generateRegistry,
      bundleDemo,
      reconnectSandbox,
      uploadToR2ClientSide,
      getParsedCode,
      setPublishProgress,
      setCreatedDemoSlug,
      setIsSuccessDialogOpen,
    }

    // Initialize process state
    let submissionState: SubmissionProcessState = {
      componentIdToUse: null,
      existingDemoId: null,
      finalComponent: null,
      finalDemo: null,
      isNewComponent: true,
    }

    try {
      // Execute all steps in sequence, passing context and updating the state
      submissionState = await _initializeAndValidateInput(
        stepContext,
        submissionState,
      )
      console.log("after _initializeAndValidateInput state", submissionState)
      submissionState = await _stepUpdateComponentNameAndImports(
        stepContext,
        submissionState,
      )
      console.log(
        "after _stepUpdateComponentNameAndImports state",
        submissionState,
      )

      // Add optimization step
      submissionState = await _stepOptimizeComponent(
        stepContext,
        submissionState,
      )
      console.log("after _stepOptimizeComponent state", submissionState)

      submissionState = await _stepGenerateRegistryAndParseCode(
        stepContext,
        submissionState,
      )
      console.log(
        "after _stepGenerateRegistryAndParseCode state",
        submissionState,
      )
      submissionState = await _stepBundleDemo(stepContext, submissionState)
      console.log("after _stepBundleDemo state", submissionState)
      submissionState = await _stepFetchSandboxAndExistingInfo(
        stepContext,
        submissionState,
      )
      console.log(
        "after _stepFetchSandboxAndExistingInfo state",
        submissionState,
      )
      submissionState = await _stepUploadFiles(stepContext, submissionState)
      console.log("after _stepUploadFiles state", submissionState)
      submissionState = await _stepUpsertComponent(stepContext, submissionState)
      console.log("after _stepUpsertComponent state", submissionState)
      submissionState = await _stepManageSandboxLinkAndSubmission(
        stepContext,
        submissionState,
      )
      submissionState = await _stepUpsertDemo(stepContext, submissionState)
      console.log("after _stepUpsertDemo state", submissionState)
      submissionState = await _stepUpdateDemoTags(stepContext, submissionState)
      console.log("after _stepUpdateDemoTags state", submissionState)

      // Final success handling
      setPublishProgress("Done!")
      setIsSuccessDialogOpen(true)

      // Check submission status for private components
      if (
        !data.is_public &&
        typeof submissionState.componentIdToUse === "number"
      ) {
        await client
          .from("submissions")
          .select()
          .eq("component_id", submissionState.componentIdToUse)
          .single()
      }
    } catch (error) {
      console.error("Error submitting component:", error)
      toast.error(
        `Please try again. Submission failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      setPublishProgress("Submission failed; Please try again.")
      setTimeout(() => setIsLoadingDialogOpen(false), 1500)
    } finally {
      setIsSubmitting(false)
      await reconnectSandbox()
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
