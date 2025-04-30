"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useTheme } from "next-themes"
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { Trash2 } from "lucide-react"

import { Form } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { ComponentForm } from "@/components/features/studio/publish/components/forms/component-form"
import { DemoDetailsForm } from "@/components/features/studio/publish/components/forms/demo-form"
// import { EditCodeFileCard } from "@/components/features/publish-old/components/edit-code-file-card"

import { cn } from "@/lib/utils"
import { useSandbox } from "@/components/features/studio/sandbox/hooks/useSandbox"
import { useFileSystem } from "@/components/features/studio/sandbox/hooks/useFileSystem"

// Define types needed for the form
type FormStep =
  | "nameSlugForm"
  | "code"
  | "demoCode"
  | "demoDetails"
  | "detailedForm"

// Basic form data structure
type FormData = {
  name: string
  component_slug: string
  registry: string
  description: string
  license: string
  is_public: boolean
  code: string
  demos: {
    name: string
    demo_code: string
    demo_slug: string
    tags: any[]
    preview_image_data_url: string
    preview_image_file?: File
    demo_direct_registry_dependencies: string[]
  }[]
}

type ParsedCodeData = {
  componentNames: string[]
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
  } = useSandbox({
    sandboxId,
  })
  const { generateRegistry } = useFileSystem({
    sandboxRef: sandboxRef,
    reconnectSandbox: reconnectSandbox,
    sandboxConnectionHash: sandboxConnectionHash,
  })

  useEffect(() => {
    if (!connectedShellId) {
      return
    }

    const fetchRegistryJSON = async () => {
      console.log("Generating registry...")
      const { componentRegistryJSON, demoRegistryJSON } =
        await generateRegistry()
      console.log("componentRegistryJSON", componentRegistryJSON)
      console.log("demoRegistryJSON", demoRegistryJSON)
    }
    fetchRegistryJSON()
  }, [connectedShellId])

  // useEffect(() => {
  //   const fetchRegistryJSON = async () => {
  //     const componentRegistryJSON = await getComponentRegistryJSON()
  //     const demoRegistryJSON = await getDemoRegistryJSON()
  //     console.log("componentRegistryJSON", componentRegistryJSON)
  //     console.log("demoRegistryJSON", demoRegistryJSON)
  //   }
  //   fetchRegistryJSON()
  // }, [])

  // Theme state
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"

  // UI states
  const [formStep, setFormStep] = useState<FormStep>("detailedForm")
  const [openAccordion, setOpenAccordion] = useState([
    "component-info",
    "demo-0",
  ])
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0)
  const [isEditingFromCard, setIsEditingFromCard] = useState(false)
  const [isAddingNewDemo, setIsAddingNewDemo] = useState(false)
  const [previousStep, setPreviousStep] = useState<FormStep>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)

  // Code parsing state
  const [parsedCode, setParsedCode] = useState<ParsedCodeData>({
    componentNames: [],
  })

  // Initialize form
  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      component_slug: "",
      registry: "ui",
      description: "",
      license: "mit",
      is_public: true,
      code: "",
      demos: [
        {
          name: "",
          demo_code: "",
          demo_slug: "default",
          tags: [],
          preview_image_data_url: "",
          preview_image_file: undefined,
          demo_direct_registry_dependencies: [],
        },
      ],
    },
  })

  // Get values from form
  const { component_slug: componentSlug, demos } = form.getValues()
  const currentDemo = demos?.[currentDemoIndex]
  const demoCode = currentDemo?.demo_code || ""
  const mode = "full" // Default mode

  // Handlers
  const handleStepChange = (newStep: FormStep) => {
    setPreviousStep(formStep)
    setFormStep(newStep)

    if (newStep === "detailedForm") {
      setIsAddingNewDemo(false)
      setIsEditingFromCard(false)
    }
  }

  const handleAccordionChange = useCallback((value: string[]) => {
    setOpenAccordion(value)
  }, [])

  const handleAddNewDemo = () => {
    const demos = form.getValues().demos || []
    const newDemoIndex = demos.length

    form.setValue("demos", [
      ...demos,
      {
        name: "",
        demo_slug: `demo-${newDemoIndex + 1}`,
        demo_code: "",
        tags: [],
        preview_image_data_url: "",
        preview_image_file: undefined,
        demo_direct_registry_dependencies: [],
      },
    ])

    setCurrentDemoIndex(newDemoIndex)
    setIsAddingNewDemo(true)
    handleStepChange("demoCode")
    setOpenAccordion([`demo-${newDemoIndex}`, "component-info"])
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    console.log("Form submitted:", form.getValues())
    setIsSubmitting(true)
    // Add actual submission logic here
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccessDialogOpen(true)
    }, 1000)
  }

  // Utility functions
  const isComponentInfoComplete = useCallback(() => {
    const { description, license, name, component_slug, registry } =
      form.getValues()
    return (
      !!description && !!license && !!name && !!component_slug && !!registry
    )
  }, [form])

  const isDemoComplete = (demoIndex: number) => {
    const demo = form.getValues().demos[demoIndex]
    return !!(demo?.name && demo?.demo_code)
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <Button variant="outline"> {"< "} Back to edit</Button>
        <Button onClick={handleSubmit}> Send to review</Button>
      </div>
      <Form {...form}>
        {formStep !== "nameSlugForm" && (
          <div className="flex flex-col h-screen w-full">
            {(formStep === "demoCode" ||
              formStep === "demoDetails" ||
              formStep === "detailedForm") && (
              <>
                <div className="flex h-[calc(100vh-3.5rem)]">
                  <div
                    className={cn(
                      "border-r pointer-events-auto transition-[width] duration-300 max-h-screen overflow-y-auto",
                      formStep === "demoCode" ? "w-1/2" : "w-1/3",
                      formStep === "demoCode" && "!w-1/2",
                    )}
                  >
                    {formStep === "detailedForm" && (
                      <div className="w-full flex flex-col gap-4 overflow-y-auto p-4">
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
                              <AccordionContent className="text-muted-foreground">
                                <div className="text-foreground">
                                  <ComponentForm
                                    form={form}
                                    handleSubmit={handleSubmit}
                                    isSubmitting={isSubmitting}
                                    hotkeysEnabled={!isSuccessDialogOpen}
                                  />

                                  <div className="space-y-3 mt-6">
                                    {/* <EditCodeFileCard
                                    iconSrc={
                                      isDarkTheme
                                        ? "/tsx-file-dark.svg"
                                        : "/tsx-file.svg"
                                    }
                                    mainText={`${form.getValues("name") || "Component"} code`}
                                    subText={
                                      parsedCode.componentNames.length > 0
                                        ? `${parsedCode.componentNames.slice(0, 2).join(", ")}${parsedCode.componentNames.length > 2 ? ` +${parsedCode.componentNames.length - 2}` : ""}`
                                        : "No components detected"
                                    }
                                    onEditClick={() => {
                                      handleStepChange("code")
                                      setIsEditingFromCard(true)
                                    }}
                                  /> */}
                                    {/* <EditCodeFileCard
                                    iconSrc={
                                      isDarkTheme
                                        ? "/css-file-dark.svg"
                                        : "/css-file.svg"
                                    }
                                    mainText="Custom styles"
                                    subText="Tailwind config and globals.css"
                                    onEditClick={() => {
                                      handleStepChange("code")
                                      setIsEditingFromCard(true)
                                    }}
                                  /> */}
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>

                            {demos?.map((demo, index) => (
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
                                          isDemoComplete(index)
                                            ? "border-emerald-500/20"
                                            : "border-amber-500/20",
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            "size-1.5 rounded-full",
                                            isDemoComplete(index)
                                              ? "bg-emerald-500"
                                              : "bg-amber-500",
                                          )}
                                          aria-hidden="true"
                                        />
                                        {isDemoComplete(index)
                                          ? "Complete"
                                          : "Required"}
                                      </Badge>
                                    </div>
                                    {demos.length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 ml-auto mr-1 shrink-0"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          // Handle demo deletion here
                                          console.log("Delete demo:", index)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                                      </Button>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="text-foreground space-y-4">
                                    <DemoDetailsForm
                                      form={form}
                                      demoIndex={index}
                                      mode={mode}
                                    />
                                    {/* <EditCodeFileCard
                                    iconSrc={
                                      isDarkTheme
                                        ? "/demo-file-dark.svg"
                                        : "/demo-file.svg"
                                    }
                                    mainText={`Demo ${index + 1} code`}
                                    onEditClick={() => {
                                      handleStepChange("demoCode")
                                      setIsEditingFromCard(true)
                                      setCurrentDemoIndex(index)
                                    }}
                                  /> */}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      </div>
                    )}
                  </div>

                  <iframe src={previewURL || ""} className="w-2/3" />
                </div>
              </>
            )}
          </div>
        )}
      </Form>
    </>
  )
}

export default PublishPage
