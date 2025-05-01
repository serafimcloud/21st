"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { Trash2 } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"

import { Form } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { LoadingDialog } from "@/components/ui/loading-dialog"
import { Skeleton } from "@/components/ui/skeleton"

import { ComponentForm } from "@/components/features/studio/publish/components/forms/component-form"
import { DemoDetailsForm } from "@/components/features/studio/publish/components/forms/demo-form"
import { SuccessDialog } from "@/components/features/publish-old/components/success-dialog"
import {
  FormData,
  formSchema,
} from "@/components/features/studio/publish/config/utils"
import { useSubmitComponent } from "@/components/features/studio/publish/hooks/use-submit-component"
import { useComponentData } from "@/components/features/studio/publish/hooks/use-component-data"

import { cn } from "@/lib/utils"
import { useSandbox } from "@/components/features/studio/sandbox/hooks/use-sandbox"
import { useFileSystem } from "@/components/features/studio/sandbox/hooks/use-file-system"
import { usePublishAs } from "@/components/features/publish-old/hooks/use-publish-as"

type FormStep = "detailedForm"

type ParsedCodeData = {
  componentNames: string[]
  dependencies?: Record<string, string>
  demoDependencies?: Record<string, string>
}

const PublishPage = () => {
  const params = useParams()
  const sandboxId = params.sandboxId as string
  const {
    previewURL,
    sandboxRef,
    reconnectSandbox,
    connectedShellId,
    sandboxConnectionHash,
    serverSandbox,
  } = useSandbox({
    sandboxId,
  })

  // Fetch component data if sandbox is linked to a component
  const { isLoading: isComponentDataLoading, formData: componentFormData } =
    useComponentData(serverSandbox?.component_id)

  const { generateRegistry, bundleDemo } = useFileSystem({
    sandboxRef: sandboxRef,
    reconnectSandbox: reconnectSandbox,
    sandboxConnectionHash: sandboxConnectionHash,
    connectedShellId,
  })
  const { user } = useUser()

  console.log("serverSandbox", serverSandbox)

  // useEffect(() => {
  //   if (!connectedShellId) return

  //   const fetchRegistryJSON = async () => {
  //     console.log("Generating registry...")

  //     console.log("componentRegistryJSON", componentRegistryJSON)
  //     console.log("demoRegistryJSON", demoRegistryJSON)
  //   }
  //   fetchRegistryJSON()
  // }, [connectedShellId, generateRegistry])

  const [formStep] = useState<FormStep>("detailedForm")
  const [openAccordion, setOpenAccordion] = useState([
    "component-info",
    "demo-0",
  ])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      component_slug: "",
      registry: "ui",
      description: "",
      license: "mit",
      website_url: "",
      is_public: false,
      publish_as_username: user?.username ?? undefined,
      is_paid: false,
      price: 0,
      unknown_dependencies: [],
      direct_registry_dependencies: [],
      code: `// Mock component code for ${sandboxId}\nexport default function MockComponent() { return <div>Hello</div>; }`,
      demos: [
        {
          name: "Default Demo",
          demo_code: `// Mock demo code for ${sandboxId}\nimport MockComponent from './component';\nexport default function Demo() { return <MockComponent />; }`,
          demo_slug: "default",
          tags: [],
          preview_image_data_url: "",
          preview_image_file: undefined,
          preview_video_data_url: "",
          preview_video_file: undefined,
          demo_direct_registry_dependencies: [],
          demo_dependencies: {},
        },
      ],
    },
  })

  // Update form with component data when available
  useEffect(() => {
    if (componentFormData && !isComponentDataLoading) {
      form.reset({
        ...componentFormData,
        publish_as_username:
          user?.username ?? componentFormData.publish_as_username,
      })

      // Open all demo accordions
      if (componentFormData.demos.length > 0) {
        const newOpenAccordion = ["component-info"]
        componentFormData.demos.forEach((_, index) => {
          newOpenAccordion.push(`demo-${index}`)
        })
        setOpenAccordion(newOpenAccordion)
      }
    }
  }, [componentFormData, isComponentDataLoading, form, user?.username])

  const publishAsUsername = form.watch("publish_as_username")
  const { user: publishAsUser } = usePublishAs({
    username: publishAsUsername ?? user?.username ?? "",
  })

  console.log("ERRORS", form.formState.errors)

  useEffect(() => {
    if (form.getValues("publish_as_username") === undefined && user?.username) {
      form.setValue("publish_as_username", user.username)
    }
  }, [user?.username, form])

  const {
    isSubmitting,
    isLoadingDialogOpen,
    publishProgress,
    isSuccessDialogOpen,
    createdDemoSlug,
    submitComponent,
    setIsSuccessDialogOpen,
  } = useSubmitComponent()

  const handleAccordionChange = useCallback((value: string[]) => {
    setOpenAccordion(value)
  }, [])

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault()
    form.handleSubmit(
      (formData) => {
        console.log("Form data is valid:", formData)
        console.log("Form errors:", form.formState.errors)
        const data = {
          ...formData,
          website_url: formData.website_url || "",
        }
        if (!publishAsUser?.id) {
          toast.error(
            "Cannot determine user to publish as. Please ensure you are logged in.",
          )
          return
        }
        submitComponent({
          data,
          publishAsUser: {
            id: publishAsUser.id,
            username: publishAsUser.username || undefined,
          },
          generateRegistry,
          bundleDemo,
          sandboxId: serverSandbox!.id,
          onSuccess: () => {
            reconnectSandbox()
          },
        })
      },
      (errors) => {
        console.error("Form validation errors:", errors)
        toast.error("Please fill all the required fields")
      },
    )(event) // Immediately invoke the handler
  }

  const isComponentInfoComplete = useCallback(() => {
    const { description, license, name, component_slug, registry } =
      form.getValues()
    return (
      !!description && !!license && !!name && !!component_slug && !!registry
    )
  }, [form])

  const handleGoToComponent = useCallback(() => {
    const username = publishAsUser?.username || user?.username
    const slug = form.getValues("component_slug")
    const demoSlug = createdDemoSlug || "default"
    if (username && slug) {
      console.log(`Redirecting to /${username}/${slug}/${demoSlug}`)
    } else {
      console.warn("Could not determine redirect path.")
    }
    setIsSuccessDialogOpen(false)
  }, [publishAsUser, user, form, createdDemoSlug])

  const handleAddAnother = () => {
    form.reset()
    setIsSuccessDialogOpen(false)
    setOpenAccordion(["component-info", "demo-0"])
  }

  if (!serverSandbox?.id) {
    return (
      <div>
        <h1>Loader lol</h1>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center p-4 border-b">
        <Button variant="outline"> {"< "} Back to edit</Button>
        <div className="flex items-center gap-2">
          {serverSandbox?.component_id ? (
            <Badge variant="outline" className="mr-2">
              Editing existing component
            </Badge>
          ) : (
            <Badge variant="outline" className="mr-2">
              Creating new component
            </Badge>
          )}
          <Button onClick={() => handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Send to review"}
          </Button>
        </div>
      </div>
      <Form {...form}>
        <div className="flex flex-col h-screen w-full">
          <div className="flex h-[calc(100vh-3.5rem)]">
            <div className="border-r pointer-events-auto transition-[width] duration-300 max-h-screen overflow-y-auto w-1/3">
              <div className="w-full flex flex-col gap-4 overflow-y-auto p-4">
                {isComponentDataLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4 p-[2px]">
                    <Accordion
                      type="multiple"
                      value={openAccordion}
                      onValueChange={handleAccordionChange}
                      className="w-full"
                    >
                      <AccordionItem value="component-info">
                        <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-muted/50 rounded-md data-[state=open]:rounded-b-none transition-all duration-200 ease-in-out -mx-2 px-2">
                          <div className="flex items-center gap-2">
                            Component info
                            <Badge
                              variant="outline"
                              className={cn(
                                "gap-1.5 text-xs font-medium",
                                isComponentInfoComplete()
                                  ? "border-emerald-500/20"
                                  : "border-amber-500/20",
                              )}
                            >
                              <span
                                className={cn(
                                  "size-1.5 rounded-full",
                                  isComponentInfoComplete()
                                    ? "bg-emerald-500"
                                    : "bg-amber-500",
                                )}
                                aria-hidden="true"
                              />
                              {isComponentInfoComplete()
                                ? "Complete"
                                : "Required"}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pt-4">
                          <div className="text-foreground">
                            <ComponentForm
                              form={form as any}
                              handleSubmit={handleSubmit}
                              isSubmitting={isSubmitting}
                              hotkeysEnabled={!isSuccessDialogOpen}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {form.getValues().demos?.map((demo, index) => (
                        <AccordionItem
                          key={index}
                          value={`demo-${index}`}
                          className="bg-background border-none group"
                        >
                          <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-muted/50 rounded-md data-[state=open]:rounded-b-none transition-all duration-200 ease-in-out -mx-2 px-2">
                            <div className="flex items-center gap-2 w-full">
                              <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                <div className="truncate flex-shrink min-w-0">
                                  {demo.name || `Demo ${index + 1}`}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "gap-1.5 text-xs font-medium shrink-0",
                                    demo.name && demo.demo_code
                                      ? "border-emerald-500/20"
                                      : "border-amber-500/20",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "size-1.5 rounded-full",
                                      demo.name && demo.demo_code
                                        ? "bg-emerald-500"
                                        : "bg-amber-500",
                                    )}
                                    aria-hidden="true"
                                  />
                                  {demo.name && demo.demo_code
                                    ? "Complete"
                                    : "Required"}
                                </Badge>
                              </div>
                              {form.getValues().demos.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 ml-auto mr-1 shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    console.log("Delete demo:", index)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                                </Button>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4">
                            <div className="text-foreground space-y-4">
                              <DemoDetailsForm
                                form={form as any}
                                demoIndex={index}
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </div>
            </div>

            <iframe src={previewURL || ""} className="w-2/3" />
          </div>
        </div>
      </Form>

      <LoadingDialog isOpen={isLoadingDialogOpen} message={publishProgress} />
      <SuccessDialog
        isOpen={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        onAddAnother={handleAddAnother}
        onGoToComponent={handleGoToComponent}
        mode={"component"}
      />
    </>
  )
}

export default PublishPage
