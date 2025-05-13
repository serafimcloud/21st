"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ComponentDetailsForm } from "../features/publish/components/forms/component-form"
import {
  Component,
  User,
  Tag,
  DemoWithComponent,
  Demo,
  DemoWithTags,
} from "@/types/global"
import { useForm } from "react-hook-form"
import { FormData } from "../features/publish/config/utils"
import { uploadToR2 } from "@/lib/r2"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-media-query"
import { DemoDetailsForm } from "../features/publish/components/forms/demo-form"
import { Button } from "@/components/ui/button"
import { ExternalLink, LoaderCircle } from "lucide-react"
import { EditCodeFileCard } from "../features/publish/components/edit-code-file-card"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { CodeEditorDialog } from "./code-editor-dialog"
import { addVersionToUrl } from "@/lib/utils/url"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { atom, useAtom } from "jotai"
import { useR2Upload } from "@/components/features/publish/hooks/use-r2-upload"
import { useRouter } from "next/navigation"
import ShortUUID from "short-uuid"
import { AMPLITUDE_EVENTS, trackEvent } from "@/lib/amplitude"
import { useUser } from "@clerk/nextjs"

// Helper function to safely fetch file content
const safeFetchFile = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch from ${url}`)
    }
    return await response.text()
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error)

    // Try alternative R2 domain if CDN URL fails
    if (url.includes("cdn.21st.dev")) {
      try {
        const r2Url = url.replace(
          "https://cdn.21st.dev/",
          "https://pub-d2a7943f757e46d59fd4e364dbae76ae.r2.dev/",
        )
        console.log(`Trying alternative R2 URL: ${r2Url}`)
        const r2Response = await fetch(r2Url)
        if (!r2Response.ok) {
          throw new Error(`Failed to fetch from ${r2Url}`)
        }
        return await r2Response.text()
      } catch (r2Error) {
        console.error(`Error fetching from R2:`, r2Error)
        throw new Error(
          `Failed to fetch file content from both CDN and R2 URLs`,
        )
      }
    }

    throw error
  }
}

const cleanInitialUrl = (url: string | null) => {
  if (!url) return ""
  return url.replace(/^(https?:\/\/)+(www\.)?/, "")
}

const sanitizeDependencies = (deps: unknown): string[] =>
  Array.isArray(deps) ? deps.filter(Boolean) : []

interface CommonEditorProps {
  code: string
  demoCode: string
  componentSlug: string
  registryToPublish: string
  customTailwindConfig?: string
  customGlobalCss?: string
  currentState: {
    code: string
    demoCode: string
    directRegistryDependencies: string[]
    demoDirectRegistryDependencies: string[]
    tailwindConfig?: string
    globalsCss?: string
  }
}

export const isEditingCodeAtom = atom(false)

export function EditComponentDialog({
  component,
  demo,
  isOpen,
  setIsOpen,
  onUpdate,
}: {
  component: DemoWithComponent | (Component & { user: User })
  demo: DemoWithTags
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onUpdate: (
    _updatedData: Partial<Component>,
    demoUpdates: Partial<Demo> & { demo_tags?: Tag[] },
  ) => Promise<void>
}) {
  const isMobile = useIsMobile()
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const componentData =
    "component" in component ? component.component : component
  const router = useRouter()
  const { user } = useUser()

  const [, setIsEditingCodeState] = useAtom(isEditingCodeAtom)
  const [isEditingCode, setIsEditingCode] = useState(false)
  const [isEditingDemo, setIsEditingDemo] = useState(false)
  const [isEditingStyles, setIsEditingStyles] = useState(false)
  const [componentCode, setComponentCode] = useState("")
  const [demoCode, setDemoCode] = useState("")
  const [tailwindConfig, setTailwindConfig] = useState<string>()
  const [globalCss, setGlobalCss] = useState<string>()
  const [activeStyleTab] = useState<string>("tailwind")
  const [isVideoUploading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isTagsUpdating, setIsTagsUpdating] = useState(false)

  const handleOpenSandbox = () => {
    if (componentData.sandbox_id) {
      const shortSandboxId = ShortUUID().fromUUID(componentData.sandbox_id)
      const username =
        componentData.user.display_username || componentData.user.username

      // Close the dialog before navigating
      setIsOpen(false)

      // Navigate with mode=edit parameter
      router.push(`/studio/${username}/sandbox/${shortSandboxId}?mode=edit`)

      trackEvent(AMPLITUDE_EVENTS.EDIT_COMPONENT, {
        componentId: componentData.id,
        componentName: componentData.name,
        userId: user?.id,
        sandboxId: componentData.sandbox_id,
        shortSandboxId,
        editType: "sandbox",
      })
    }
  }

  const form = useForm<FormData>({
    defaultValues: {
      name: componentData.name,
      code: componentData.code,
      component_slug: componentData.component_slug,
      direct_registry_dependencies: [],
      demos: [
        {
          name: demo.name || "",
          demo_code: componentData.demo_code || "",
          demo_slug: "component" in component ? component.demo_slug : "default",
          preview_image_data_url: demo.preview_url || "",
          preview_video_data_url: demo.video_url || "",
          tags: demo.tags || [],
          demo_direct_registry_dependencies: [],
        },
      ],
      description: componentData.description ?? "",
      license: componentData.license,
      website_url: cleanInitialUrl(componentData.website_url ?? ""),
      is_public: true,
      unknown_dependencies: [],
      registry: componentData.registry,
      slug_available: true,
    },
  })

  const uploadToR2Mutation = useMutation({
    mutationFn: async ({ file, fileKey }: { file: File; fileKey: string }) => {
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64Content = buffer.toString("base64")
      return uploadToR2({
        file: {
          name: fileKey,
          type: file.type,
          encodedContent: base64Content,
        },
        fileKey: fileKey,
        bucketName: "components-code",
        contentType: file.type,
      })
    },
    onError: (error) => {
      console.error("Failed to upload to R2:", error)
    },
  })

  const { upload: uploadToR2ClientSide } = useR2Upload()

  const updateMutation = useMutation<
    void,
    Error,
    {
      componentId: number
      updatedData: Partial<Component>
      demoUpdates: Partial<Demo> & { demo_tags?: Tag[] }
    }
  >({
    mutationFn: async ({ componentId, updatedData, demoUpdates }) => {
      await onUpdate(updatedData, {
        id: demo?.id,
        ...(demo?.id ? demoUpdates : {}),
      })
    },
    onSuccess: () => {
      setIsOpen(false)
    },
    onError: (error) => {
      toast.error("Failed to update component. Please try again.", {
        description: error.message,
      })
    },
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const formData = form.getValues()
    const formDemo = formData.demos[0]

    const componentUpdates: Partial<Component> = {}
    const demoUpdates: Partial<Demo & { demo_tags?: Tag[] }> = {}

    if (formData.name !== componentData.name) {
      componentUpdates.name = formData.name
    }
    if (formData.description !== componentData.description) {
      componentUpdates.description = formData.description
    }
    if (formData.license !== componentData.license) {
      componentUpdates.license = formData.license
    }
    if (formData.website_url !== componentData.website_url) {
      componentUpdates.website_url = formData.website_url
    }

    if (
      formDemo?.preview_image_file instanceof File &&
      formDemo.preview_image_file.size > 0
    ) {
      const fileExtension = formDemo.preview_image_file.name.split(".").pop()
      const baseFolder = `${componentData.user.id}/${componentData.component_slug}`
      const demoSlug =
        "component" in component ? component.demo_slug : "default"
      const demoFolder = `${baseFolder}/${demoSlug}`
      const timestamp = Date.now()
      const fileKey = `${demoFolder}/preview.${timestamp}.${fileExtension}`

      try {
        const previewImageUrl = await uploadToR2Mutation.mutateAsync({
          file: formDemo.preview_image_file,
          fileKey,
        })
        demoUpdates.preview_url = previewImageUrl
      } catch (error) {
        console.error("Failed to upload image:", error)
        toast.error("Failed to upload image. Please try again.")
        return
      }
    }

    if (
      formDemo?.preview_video_file &&
      formDemo.preview_video_file instanceof File &&
      formDemo.preview_video_file.size > 0
    ) {
      setIsUploading(true)
      toast.info("Processing video file...")

      const baseFolder = `${componentData.user.id}/${componentData.component_slug}`
      const demoSlug =
        "component" in component ? component.demo_slug : "default"
      const demoFolder = `${baseFolder}/${demoSlug}`
      const timestamp = Date.now()
      const fileKey = `${demoFolder}/video.${timestamp}.mp4`

      try {
        const videoUrl = await uploadToR2ClientSide({
          file: formDemo.preview_video_file,
          fileKey,
          bucketName: "components-code",
          contentType: "video/mp4",
        })

        toast.success("Video uploaded successfully!")
        demoUpdates.video_url = videoUrl
      } catch (error) {
        console.error("Failed to upload video:", error)
        toast.error("Failed to upload video. Please try again.")
        return
      } finally {
        setIsUploading(false)
      }
    }

    const currentDemoTags = demo.tags || []
    const newDemoTags = formDemo?.tags || []

    if (
      JSON.stringify(currentDemoTags.map((t) => t.id).sort()) !==
      JSON.stringify(newDemoTags.map((t) => t.id).sort())
    ) {
      setIsTagsUpdating(true)
      toast.loading("Updating tags...")

      try {
        const { error } = await supabase.rpc("update_demo_tags", {
          p_demo_id: demo.id,
          p_tags: newDemoTags,
        })

        if (error) throw error

        toast.success("Tags updated successfully")
        return
      } catch (error) {
        console.error("Error updating tags:", error)
        toast.error("Failed to update tags")
      } finally {
        setIsTagsUpdating(false)
      }
      return
    }

    if (
      Object.keys(componentUpdates).length > 0 ||
      Object.keys(demoUpdates).length > 0
    ) {
      try {
        await updateMutation.mutateAsync({
          componentId: componentData.id,
          updatedData: componentUpdates,
          demoUpdates: {
            id: demo.id,
            ...demoUpdates,
          },
        })
      } catch (error) {
        console.error("Failed to save updates:", error)
        toast.error("Failed to save changes. Please try again.")
      }
    } else {
      setIsOpen(false)
      toast.info("No changes were made")
    }
  }

  const handleEditCode = async () => {
    try {
      // Use the safe fetch helper for all URLs
      const code = await safeFetchFile(componentData.code)
      const demoCode = await safeFetchFile(demo.demo_code)

      let tailwindConfig = ""
      let globalCss = ""

      if (componentData.tailwind_config_extension) {
        tailwindConfig = await safeFetchFile(
          componentData.tailwind_config_extension,
        )
      }

      if (componentData.global_css_extension) {
        globalCss = await safeFetchFile(componentData.global_css_extension)
      }

      setComponentCode(code)
      setDemoCode(demoCode)
      setTailwindConfig(tailwindConfig)
      setGlobalCss(globalCss)
      setIsEditingCode(true)
      setIsEditingCodeState(true)
    } catch (error) {
      console.error("Error fetching component code:", error)
      toast.error("Failed to load component code")
    }
  }

  const handleEditDemo = async () => {
    try {
      // Use the safe fetch helper for all URLs
      const componentCode = await safeFetchFile(componentData.code)
      const demoCode = await safeFetchFile(demo.demo_code)

      let tailwindConfig = ""
      let globalCss = ""

      if (componentData.tailwind_config_extension) {
        tailwindConfig = await safeFetchFile(
          componentData.tailwind_config_extension,
        )
      }

      if (componentData.global_css_extension) {
        globalCss = await safeFetchFile(componentData.global_css_extension)
      }

      setComponentCode(componentCode)
      setDemoCode(demoCode)
      setTailwindConfig(tailwindConfig)
      setGlobalCss(globalCss)
      setIsEditingDemo(true)
      setIsEditingCodeState(true)
    } catch (error) {
      console.error("Error fetching demo code:", error)
      toast.error("Failed to load demo code")
    }
  }

  const handleEditStyles = async () => {
    try {
      let tailwindConfig = ""
      let globalCss = ""

      if (componentData.tailwind_config_extension) {
        tailwindConfig = await safeFetchFile(
          componentData.tailwind_config_extension,
        )
      }

      if (componentData.global_css_extension) {
        globalCss = await safeFetchFile(componentData.global_css_extension)
      }

      setTailwindConfig(tailwindConfig)
      setGlobalCss(globalCss)
      setIsEditingStyles(true)
      setIsEditingCodeState(true)
    } catch (error) {
      console.error("Error fetching styles:", error)
      toast.error("Failed to load styles")
    }
  }

  const handleSaveComponentCode = async (newCode: string) => {
    try {
      const baseFolder = `${componentData.user_id}/${componentData.component_slug}`
      const timestamp = Date.now()
      const codeUrl = await uploadToR2({
        file: {
          name: "code.tsx",
          type: "text/plain",
          textContent: newCode,
        },
        fileKey: `${baseFolder}/code.${timestamp}.tsx`,
        bucketName: "components-code",
      })

      const versionedUrl = addVersionToUrl(codeUrl)

      if (codeUrl) {
        const { error: updateComponentError } = await supabase
          .from("components")
          .update({
            code: versionedUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", componentData.id)

        if (updateComponentError) {
          throw updateComponentError
        }

        const { error: updateDemosError } = await supabase
          .from("demos")
          .update({
            compiled_css: null,
            updated_at: new Date().toISOString(),
          })
          .eq("component_id", componentData.id)

        if (updateDemosError) {
          throw updateDemosError
        }

        setComponentCode(newCode)
        toast.success("Component code updated successfully")
        window.location.reload()
      }
    } catch (error) {
      console.error("Error saving component code:", error)
      toast.error("Failed to save component code")
      throw error
    }
  }

  const supabase = useClerkSupabaseClient()

  const handleSaveDemoCode = async (newCode: string) => {
    try {
      const baseFolder = `${componentData.user_id}/${componentData.component_slug}`
      const timestamp = Date.now()
      const demoCodeUrl = await uploadToR2({
        file: {
          name: "demo.tsx",
          type: "text/plain",
          textContent: newCode,
        },
        fileKey: `${baseFolder}/${demo.demo_slug}/code.demo.${timestamp}.tsx`,
        bucketName: "components-code",
      })

      const versionedDemoUrl = addVersionToUrl(demoCodeUrl)

      if (demoCodeUrl) {
        const { error: updateDemoError } = await supabase
          .from("demos")
          .update({
            demo_code: versionedDemoUrl,
            compiled_css: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", demo.id)

        if (updateDemoError) {
          throw updateDemoError
        }

        const { error: updateComponentError } = await supabase
          .from("components")
          .update({
            compiled_css: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", componentData.id)

        if (updateComponentError) {
          throw updateComponentError
        }

        setDemoCode(newCode)
        toast.success("Demo code updated successfully")
        window.location.reload()
      }
    } catch (error) {
      console.error("Error saving demo code:", error)
      toast.error("Failed to save demo code")
      throw error
    }
  }

  const handleSaveStyles = async (newCode: string) => {
    try {
      const baseFolder = `${componentData.user_id}/${componentData.component_slug}`
      const timestamp = Date.now()

      if (isEditingStyles) {
        const [tailwindConfigUrl, globalCssUrl] = await Promise.all([
          uploadToR2({
            file: {
              name: "tailwind.config.js",
              type: "text/plain",
              textContent:
                activeStyleTab === "tailwind" ? newCode : tailwindConfig || "",
            },
            fileKey: `${baseFolder}/tailwind.config.${timestamp}.js`,
            bucketName: "components-code",
          }),
          uploadToR2({
            file: {
              name: "globals.css",
              type: "text/plain",
              textContent:
                activeStyleTab === "globals" ? newCode : globalCss || "",
            },
            fileKey: `${baseFolder}/globals.${timestamp}.css`,
            bucketName: "components-code",
          }),
        ])

        const versionedTailwindUrl = addVersionToUrl(tailwindConfigUrl)
        const versionedGlobalCssUrl = addVersionToUrl(globalCssUrl)

        if (tailwindConfigUrl && globalCssUrl) {
          const { error: updateError } = await supabase
            .from("components")
            .update({
              tailwind_config_extension: versionedTailwindUrl,
              global_css_extension: versionedGlobalCssUrl,
              compiled_css: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", componentData.id)

          if (updateError) {
            throw updateError
          }

          if (activeStyleTab === "tailwind") {
            setTailwindConfig(newCode)
          } else {
            setGlobalCss(newCode)
          }
          toast.success("Styles updated successfully")
          window.location.reload()
        }
      }
    } catch (error) {
      console.error("Error saving styles:", error)
      toast.error("Failed to save styles")
      throw error
    }
  }

  const commonEditorProps: CommonEditorProps = {
    code: componentCode,
    demoCode: demoCode,
    componentSlug: componentData.component_slug,
    registryToPublish: componentData.registry,
    customTailwindConfig: tailwindConfig,
    customGlobalCss: globalCss,
    currentState: {
      code: componentCode,
      demoCode: demoCode,
      directRegistryDependencies: sanitizeDependencies(
        componentData.direct_registry_dependencies,
      ),
      demoDirectRegistryDependencies: sanitizeDependencies(
        demo.demo_direct_registry_dependencies,
      ),
      tailwindConfig: tailwindConfig,
      globalsCss: globalCss,
    },
  }

  const content = (
    <>
      <div className="space-y-6">
        <ComponentDetailsForm
          isEditMode={true}
          form={form}
          handleSubmit={handleSubmit}
          isSubmitting={
            uploadToR2Mutation.isPending || updateMutation.isPending
          }
          isFirstStep
        />

        {componentData.sandbox_id ? (
          <EditCodeFileCard
            iconSrc={isDarkTheme ? "/tsx-file-dark.svg" : "/tsx-file.svg"}
            mainText={`${componentData.name} code`}
            subText={`Edit in Sandbox`}
            onEditClick={handleOpenSandbox}
          />
        ) : (
          <EditCodeFileCard
            iconSrc={isDarkTheme ? "/tsx-file-dark.svg" : "/tsx-file.svg"}
            mainText={`${componentData.name} code`}
            subText={`Component code`}
            onEditClick={handleEditCode}
          />
        )}

        <div className="mt-6">
          <DemoDetailsForm form={form} demoIndex={0} />
        </div>

        {!componentData.sandbox_id && (
          <div className="space-y-3 mt-6">
            <EditCodeFileCard
              iconSrc={isDarkTheme ? "/demo-file-dark.svg" : "/demo-file.svg"}
              mainText="Demo code"
              subText={demo.name || "Demo code"}
              onEditClick={handleEditDemo}
            />
            <EditCodeFileCard
              iconSrc={isDarkTheme ? "/css-file-dark.svg" : "/css-file.svg"}
              mainText="Custom styles"
              subText="Tailwind config and globals.css"
              onEditClick={handleEditStyles}
            />
          </div>
        )}
      </div>
    </>
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        isOpen &&
        (e.metaKey || e.ctrlKey) &&
        e.key === "Enter" &&
        e.target instanceof Element &&
        !e.target.matches("textarea, input")
      ) {
        e.preventDefault()
        handleSubmit(e as unknown as React.FormEvent)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, handleSubmit])

  const saveButton = (
    <Button
      onClick={handleSubmit}
      disabled={
        uploadToR2Mutation.isPending ||
        updateMutation.isPending ||
        isVideoUploading ||
        isUploading ||
        isTagsUpdating
      }
      className="relative transition-all duration-200"
    >
      <div className="flex items-center justify-center gap-2">
        {(uploadToR2Mutation.isPending ||
          updateMutation.isPending ||
          isVideoUploading ||
          isUploading) && (
          <LoaderCircle
            className="animate-spin"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
        Save
      </div>
    </Button>
  )

  if (isMobile) {
    return (
      <Drawer
        open={isOpen}
        onOpenChange={(open) => {
          if (uploadToR2Mutation.isPending || updateMutation.isPending) {
            return
          }
          setIsOpen(open)
        }}
      >
        <DrawerContent>
          <DrawerHeader className="mb-2 px-6">
            <div className="flex justify-between items-center">
              <DrawerTitle>Edit component</DrawerTitle>
              {saveButton}
            </div>
          </DrawerHeader>
          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(100dvh-6rem)]">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <>
      {isEditingCode && (
        <CodeEditorDialog
          {...commonEditorProps}
          isOpen={isEditingCode}
          setIsOpen={setIsEditingCode}
          directRegistryDependencies={sanitizeDependencies(
            componentData.direct_registry_dependencies,
          )}
          onSave={handleSaveComponentCode}
          mode="component"
        />
      )}

      {isEditingDemo && (
        <CodeEditorDialog
          {...commonEditorProps}
          isOpen={isEditingDemo}
          setIsOpen={setIsEditingDemo}
          directRegistryDependencies={sanitizeDependencies(
            componentData.direct_registry_dependencies,
          )}
          demoDirectRegistryDependencies={sanitizeDependencies(
            demo.demo_direct_registry_dependencies,
          )}
          onSave={handleSaveDemoCode}
          mode="demo"
        />
      )}

      {isEditingStyles && (
        <CodeEditorDialog
          {...commonEditorProps}
          isOpen={isEditingStyles}
          setIsOpen={setIsEditingStyles}
          directRegistryDependencies={sanitizeDependencies(
            componentData.direct_registry_dependencies,
          )}
          onSave={handleSaveStyles}
          mode="styles"
        />
      )}

      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (uploadToR2Mutation.isPending || updateMutation.isPending) {
            return
          }
          setIsOpen(open)
        }}
      >
        <SheetContent
          side="right"
          className="px-0 pb-0 sm:max-w-lg [&_button[aria-label='Close']]:hidden pt-2"
          hideCloseButton
        >
          <SheetHeader className="min-h-10 border-b bg-background z-50 pointer-events-auto px-4 sticky top-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <SheetTitle className="text-sm">Edit component</SheetTitle>
              </div>
              <div className="flex items-center gap-2">{saveButton}</div>
            </div>
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(100vh-5rem)] px-4">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
