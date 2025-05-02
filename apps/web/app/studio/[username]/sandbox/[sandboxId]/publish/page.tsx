"use client"

import React, { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { Trash2, ArrowLeftIcon } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { debounce } from "lodash"

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
import { Logo } from "@/components/ui/logo"
import { UserAvatar } from "@/components/ui/user-avatar"

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
import { editSandbox } from "@/components/features/studio/sandbox/api"

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

  // Declare all state hooks first
  const [formStep] = useState<FormStep>("detailedForm")
  const [openAccordion, setOpenAccordion] = useState([
    "component-info",
    "demo-0",
  ])

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: serverSandbox?.name || "",
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
          name: "Default",
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

  const publishAsUsername = form.watch("publish_as_username")
  const { user: publishAsUser } = usePublishAs({
    username: publishAsUsername ?? user?.username ?? "",
  })

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

  const handleGoToComponent = () => {
    const username = publishAsUser?.username || user?.username
    const slug = form.getValues("component_slug")
    const demoSlug = createdDemoSlug || "default"
    if (username && slug) {
      console.log(`Redirecting to /${username}/${slug}/${demoSlug}`)
    } else {
      console.warn("Could not determine redirect path.")
    }
    setIsSuccessDialogOpen(false)
  }

  // Log form state changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log("Form state updated:", value)
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Update form name when serverSandbox name changes
  useEffect(() => {
    if (serverSandbox?.name && !componentFormData) {
      form.setValue("name", serverSandbox.name)
    }
  }, [serverSandbox?.name, form, componentFormData])

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

  // Предыдущее значение имени для сравнения
  const prevNameRef = useRef<string>("")

  // Создаем дебаунсированную функцию для обновления имени
  const debouncedUpdateName = useRef(
    debounce(async (newName: string) => {
      if (!sandboxId) return

      try {
        // Проверяем, что имя действительно изменилось
        if (newName !== prevNameRef.current) {
          console.log(
            `Updating sandbox name from "${prevNameRef.current}" to "${newName}"`,
          )
          prevNameRef.current = newName

          const result = await editSandbox(sandboxId, { name: newName })
          console.log("Updated sandbox name in database:", result)
        }
      } catch (error) {
        console.error("Failed to update sandbox name in database:", error)
      }
    }, 800), // задержка 800мс
  ).current

  // Инициализируем prevNameRef при загрузке формы
  useEffect(() => {
    prevNameRef.current = form.getValues("name") || serverSandbox?.name || ""
  }, [serverSandbox?.name, form])

  // Главное: следим за изменениями поля name в форме и обновляем в базе
  useEffect(() => {
    // Используем мутацию формы вместо watch для уменьшения количества срабатываний
    const subscription = form.watch((value, { name: fieldName }) => {
      if (fieldName === "name" && value.name) {
        const newName = value.name as string

        // Запускаем дебаунс только если значение изменилось
        if (newName !== prevNameRef.current) {
          console.log(`Name field changed, scheduling update to: "${newName}"`)
          debouncedUpdateName(newName)
        }
      }
    })

    return () => {
      debouncedUpdateName.cancel()
      subscription.unsubscribe()
    }
  }, [form, debouncedUpdateName])

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

  const watchedComponentFields = form.watch([
    "description",
    "name",
    "component_slug",
  ])
  const isComponentInfoComplete = () => {
    const [description, name, component_slug] = watchedComponentFields
    return !!description && !!name && !!component_slug
  }

  const handleAddAnother = () => {
    form.reset()
    setIsSuccessDialogOpen(false)
    setOpenAccordion(["component-info", "demo-0"])
  }

  const isDemoComplete = (demo: any) =>
    demo.name && demo.tags?.length > 0 && demo.preview_image_data_url

  if (!serverSandbox?.id) {
    return (
      <div>
        <h1>Loader lol</h1>
      </div>
    )
  }

  return (
    <>
      <header className="flex flex-col px-4 py-2 border-b">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              onClick={() => window.history.back()}
              className="cursor-pointer"
            >
              <Logo position="flex" className="w-6 h-6" hasLink={false} />
            </div>

            <div className="text-muted-foreground">/</div>

            {user?.username && (
              <div className="flex items-center gap-1">
                <UserAvatar
                  src={null}
                  alt={user.username}
                  size={24}
                  className="mr-1"
                />
                <span className="text-sm font-medium">{user.username}</span>
                <div className="text-muted-foreground mx-1">/</div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Только отображение имени без редактирования */}
              <h1 className="text-sm font-medium py-0.5 px-0">
                {form.watch("name") || serverSandbox?.name || "Untitled"}
              </h1>
              {serverSandbox?.component_id ? (
                <div className="text-xs bg-yellow-500 text-primary-foreground rounded-full px-2 py-0.5">
                  Edit
                </div>
              ) : (
                <div className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                  Draft
                </div>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="gap-1"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to edit
            </Button>
            <Button onClick={() => handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Send to review"}
            </Button>
          </div>
        </div>
      </header>
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
                      onValueChange={setOpenAccordion}
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
                                  {index === 0
                                    ? "Default"
                                    : demo.name || `Demo ${index + 1}`}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "gap-1.5 text-xs font-medium shrink-0",
                                    isDemoComplete(demo)
                                      ? "border-emerald-500/20"
                                      : "border-amber-500/20",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "size-1.5 rounded-full",
                                      isDemoComplete(demo)
                                        ? "bg-emerald-500"
                                        : "bg-amber-500",
                                    )}
                                    aria-hidden="true"
                                  />
                                  {isDemoComplete(demo)
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
