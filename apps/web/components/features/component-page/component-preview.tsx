"use client"

import React, { useState, useRef, useEffect } from "react"
import { useAnimation, motion, AnimatePresence } from "motion/react"
import { useAtom } from "jotai"
import { useTheme } from "next-themes"
import {
  CheckIcon,
  CopyIcon,
  Pencil,
  CodeXml,
  Info,
  ChevronDown,
  Loader2,
  RocketIcon,
  AlignVerticalJustifyEnd,
  Copy,
  Download,
  ExternalLink,
  Rocket,
} from "lucide-react"

import { ComponentPageInfo } from "./info-section"
import { Icons } from "@/components/icons"
import { LoadingSpinner } from "../../ui/loading-spinner"
import { CopyCodeButton } from "../../ui/copy-code-card-button"
import {
  isShowCodeAtom,
  isFullScreenAtom,
} from "../../../app/[username]/[component_slug]/page.client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TextMorph } from "@/components/ui/text-morph"

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeViewer,
  SandpackFileExplorer,
  SandpackProviderProps,
} from "@codesandbox/sandpack-react"
import {
  SandpackProvider as SandpackProviderUnstyled,
  SandpackPreview,
} from "@codesandbox/sandpack-react/unstyled"

import { useDebugMode } from "@/hooks/use-debug-mode"
import { useCompileCss } from "@/hooks/use-compile-css"
import { useIsMobile } from "@/hooks/use-media-query"

import { Component, Tag, User, Demo } from "@/types/global"
import { generateSandpackFiles } from "@/lib/sandpack"
import { trackEvent, AMPLITUDE_EVENTS } from "@/lib/amplitude"
import { getPackageRunner, cn } from "@/lib/utils"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"

import styles from "./component-preview.module.css"
import { FullScreenButton } from "../../ui/full-screen-button"
import { Button } from "../../ui/button"
import {
  useBundleDemo,
  getBundleStatus,
  BundleStatus,
} from "@/hooks/use-bundle-demo"
import BundlePreview from "./bundle-preview"
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable"
import { useBundleGenerator } from "@/hooks/use-bundle-generator"

const BundleIframePreview = ({ url }: { url: string }) => {
  const [isLoading, setIsLoading] = React.useState(true)

  return (
    <div className="relative w-full h-full rounded-md overflow-hidden border border-border">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
      <iframe
        src={url}
        className="w-full h-full"
        onLoad={() => setIsLoading(false)}
        allowFullScreen
      />
    </div>
  )
}

export function ComponentPagePreview({
  component,
  code,
  demoCode,
  dependencies,
  demoDependencies,
  demoComponentNames,
  registryDependencies,
  npmDependenciesOfRegistryDependencies,
  tailwindConfig,
  globalCss,
  canEdit,
  setIsEditDialogOpen,
  demo,
  compiledCss,
}: {
  component: Component & { user: User } & { tags: Tag[] }
  code: string
  demoCode: string
  dependencies: Record<string, string>
  demoDependencies: Record<string, string>
  demoComponentNames: string[]
  registryDependencies: Record<string, string>
  npmDependenciesOfRegistryDependencies: Record<string, string>
  tailwindConfig?: string
  globalCss?: string
  compiledCss?: string | null
  canEdit: boolean
  setIsEditDialogOpen: (value: boolean) => void
  demo: Demo
}) {
  const sandpackRef = useRef<HTMLDivElement>(null)
  const { user } = useUser()
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const [isShowCode, setIsShowCode] = useAtom(isShowCodeAtom)
  const isDebug = useDebugMode()
  const [isFullScreen, setIsFullScreen] = useAtom(isFullScreenAtom)
  const [bundleStatus, setBundleStatus] = useState<BundleStatus>({
    hasBundle: false,
  })
  const [isFetchingBundleStatus, setIsFetchingBundleStatus] = useState(true)
  const { bundleDemo, isBundling } = useBundleDemo()
  const { generateBundle, isGenerating, bundleResult } = useBundleGenerator()
  const [cdnUrl, setCDNUrl] = useState<string | null>(null)

  const dumySandpackFiles = generateSandpackFiles({
    demoComponentNames,
    componentSlug: component.component_slug,
    relativeImportPath: `/components/${component.registry}`,
    code,
    demoCode,
    theme: isDarkTheme ? "dark" : "light",
    css: "",
  })

  const shellCode = Object.entries(dumySandpackFiles)
    .filter(
      ([key]) =>
        key.endsWith(".tsx") ||
        key.endsWith(".jsx") ||
        key.endsWith(".ts") ||
        key.endsWith(".js"),
    )
    .map(([, file]) => file)

  const css = useCompileCss(
    code,
    demoCode,
    registryDependencies,
    component,
    shellCode,
    demo.id,
    demo.demo_slug,
    tailwindConfig,
    globalCss,
    compiledCss,
  )

  const files = {
    ...registryDependencies,
    ...generateSandpackFiles({
      demoComponentNames,
      componentSlug: component.component_slug,
      relativeImportPath: `/components/${component.registry}`,
      code,
      demoCode,
      theme: isDarkTheme ? "dark" : "light",
      css: css || "",
      customTailwindConfig: tailwindConfig,
      customGlobalCss: globalCss,
    }),
  }

  const mainComponentFile = Object.keys(files).find((file) =>
    file.endsWith(`${component.component_slug}.tsx`),
  )

  const demoComponentFile = Object.keys(files).find((file) =>
    file.endsWith(`demo.tsx`),
  )

  const [activeFile, setActiveFile] = useState<string>(
    demoComponentFile ?? mainComponentFile ?? "",
  )

  const [previewError, setPreviewError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingText, setLoadingText] = useState("Starting preview...")

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingText(
          "Loading is taking longer than usual. You may want to refresh the page...",
        )
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [isLoading])

  // Fetching bundle status
  useEffect(() => {
    const fetchBundleStatus = async () => {
      try {
        setIsFetchingBundleStatus(true)
        const status = await getBundleStatus(demo.id)
        setBundleStatus(status)
      } catch (error) {
        console.error("Failed to fetch bundle status:", error)
      } finally {
        setIsFetchingBundleStatus(false)
      }
    }

    fetchBundleStatus()
  }, [demo.id])

  const handleGenerateBundleClick = async () => {
    try {
      // Упрощенная функция загрузки UI компонентов - без лишних API запросов
      const loadUIComponents = async (): Promise<Record<string, string>> => {
        // Сразу используем registryDependencies, которые уже содержат все нужные компоненты
        console.log(
          `Количество компонентов в registryDependencies: ${Object.keys(registryDependencies).length}`,
        )

        const loadedComponents: Record<string, string> = {}

        // Просто копируем компоненты из registryDependencies в нужный формат для бэкенда
        for (const [path, content] of Object.entries(registryDependencies)) {
          // Определяем имя компонента из пути
          // Для простоты можно сохранить оригинальные пути, если бэкенд может с ними работать
          // Или привести к нужному формату

          // Получаем имя файла из пути
          const fileName = path.split("/").pop() || "unknown"

          // Получаем имя компонента (без расширения)
          const componentName = fileName.replace(/\.(tsx|jsx)$/, "")

          // Формируем путь, который ожидает бэкенд
          const backendPath = `components/ui/${componentName}.tsx`

          // Добавляем компонент в список загруженных
          loadedComponents[backendPath] = content
          console.log(
            `Добавлен компонент: ${componentName} (${path} -> ${backendPath})`,
          )
        }

        console.log(
          `Итого подготовлено ${Object.keys(loadedComponents).length} компонентов`,
        )
        return loadedComponents
      }

      toast.info("Создаем бандл компонента...", { id: "bundle-toast" })

      // Загружаем UI компоненты
      const uiComponents = await loadUIComponents()

      // @ts-ignore - игнорируем ошибку типа для dependencies
      const demoDependenciesStr = demo?.dependencies
      const demoDependencies = demoDependenciesStr
        ? JSON.parse(demoDependenciesStr as string)
        : {}

      // Логируем что отправляем на бэкенд
      console.log("Отправка на бэкенд:")
      console.log(
        "- UI Components:",
        Object.keys(uiComponents).length,
        "компонентов",
      )
      console.log("- Paths:", Object.keys(uiComponents))
      console.log(
        "- registryDependencies:",
        Object.keys(registryDependencies).length,
        "компонентов",
      )
      console.log("- Component Slug:", component.component_slug)
      console.log("- Demo Slug:", demo.demo_slug || `demo-${demo.id}`)

      // Проверяем, что у нас есть UI компоненты
      if (
        Object.keys(uiComponents).length === 0 &&
        Object.keys(registryDependencies).length > 0
      ) {
        toast.error(
          "Ошибка при подготовке бандла: не удалось загрузить UI компоненты",
          { id: "bundle-toast" },
        )
        return
      }

      // Генерируем бандл
      const result = await generateBundle({
        name: component.component_slug,
        code,
        demoCode,
        componentSlug: component.component_slug,
        demoSlug: demo.demo_slug || `demo-${demo.id}`,
        registryDependencies: {
          ...registryDependencies,
          ...uiComponents,
        },
        packageJson: {
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
            "framer-motion": "^10.12.4",
            motion: "^10.12.4",
            ...demoDependencies,
          },
        },
      })

      if (result.status === "error") {
        toast.error(`Ошибка при создании бандла: ${result.error}`, {
          id: "bundle-toast",
        })
        return
      }

      toast.success("Бандл успешно создан!", { id: "bundle-toast" })

      if (result.cdnUrl) {
        setCDNUrl(result.cdnUrl)
      }
    } catch (error) {
      console.error("Ошибка генерации бандла:", error)
      toast.error(
        `Ошибка при создании бандла: ${error instanceof Error ? error.message : String(error)}`,
        { id: "bundle-toast" },
      )
    }
  }

  if (!css)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 w-full">
        <LoadingSpinner />
        <p className="text-muted-foreground text-sm">
          Preparing styles and dependencies...
        </p>
        <p className="text-muted-foreground/60 text-xs">
          This may take a few seconds on first load
        </p>
      </div>
    )

  const visibleFiles = [
    demoComponentFile,
    mainComponentFile,
    ...(tailwindConfig ? ["tailwind.config.js"] : []),
    ...(globalCss ? ["globals.css"] : []),
    ...Object.keys(registryDependencies).filter(
      (file): file is string => file !== mainComponentFile,
    ),
  ].filter((file): file is string => file !== undefined)

  const customFileLabels = Object.fromEntries(
    Object.keys(registryDependencies).map((path) => {
      const parts = path.split("/")
      const fileName = parts[parts.length - 1]
      return [path, `${fileName} (dependency)`]
    }),
  )

  const providerProps: SandpackProviderProps = {
    theme: isDarkTheme ? "dark" : "light",
    template: "react-ts" as const,
    files: files,
    customSetup: {
      dependencies: {
        react: "^18.0.0",
        "react-dom": "^18.0.0",
        "@radix-ui/react-select": "^1.0.0",
        "lucide-react": "latest",
        "tailwind-merge": "latest",
        clsx: "latest",
        ...dependencies,
        ...demoDependencies,
        ...npmDependenciesOfRegistryDependencies,
      },
    },
    options: {
      activeFile,
      visibleFiles,
    },
    ...({ fileLabels: customFileLabels } as any),
  }

  return (
    <motion.div
      layout
      className={cn(
        "h-full w-full flex gap-2 rounded-lg md:flex-row flex-col md:max-h-[92vh] pb-4",
        isFullScreen && "fixed inset-0 z-50 bg-background p-4",
      )}
      transition={{
        layout: {
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1], // ease-out-cubic
        },
      }}
    >
      {isFetchingBundleStatus ? (
        <div className="flex flex-col items-center justify-center h-full w-full gap-3">
          <LoadingSpinner />
          <p className="text-muted-foreground text-sm">
            Проверяем наличие бандла...
          </p>
        </div>
      ) : cdnUrl ? (
        <BundleIframeComponent url={cdnUrl} />
      ) : bundleStatus.hasBundle ? (
        <BundlePreview
          bundleStatus={bundleStatus}
          isFullScreen={isFullScreen}
        />
      ) : (
        <SandpackProviderUnstyled {...providerProps}>
          <>
            <SandpackPreview />
            <div className="absolute bottom-4 right-4 z-10">
              <Button
                variant="default"
                size="sm"
                onClick={handleGenerateBundleClick}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Генерация бандла...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Сгенерировать бандл
                  </>
                )}
              </Button>
            </div>
          </>
        </SandpackProviderUnstyled>
      )}

      <AnimatePresence mode="popLayout">
        <Tabs
          defaultValue="preview"
          className="relative mt-6 w-full"
          onValueChange={(value) => {
            if (value !== "preview") setIsFullScreen(false)
          }}
        >
          <TabsContent
            value="preview"
            className={cn(
              "relative rounded-md border",
              isFullScreen ? "fixed inset-0 z-50 m-0" : "m-0",
            )}
          >
            <div
              className={cn(
                "preview-wrapper h-[480px]",
                isFullScreen && "h-screen",
              )}
            >
              <ResizablePanelGroup
                direction={isFullScreen ? "horizontal" : "vertical"}
                className="h-full w-full"
              >
                <ResizablePanel defaultSize={50}>
                  {isFetchingBundleStatus ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : bundleStatus.hasBundle && cdnUrl ? (
                    <BundleIframePreview url={cdnUrl} />
                  ) : (
                    <>
                      <SandpackProviderUnstyled {...providerProps}>
                        <motion.div
                          layout="position"
                          className="flex-grow h-full relative rounded-lg overflow-hidden"
                          transition={{
                            layout: {
                              duration: 0.4,
                              ease: [0.4, 0, 0.2, 1],
                            },
                          }}
                        >
                          <FullScreenButton />
                          {previewError ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3">
                              <p className="text-muted-foreground text-sm">
                                Failed to load preview
                              </p>
                              <button
                                onClick={() => {
                                  setPreviewError(false)
                                  setIsLoading(true)
                                }}
                                className="text-sm underline text-muted-foreground hover:text-foreground"
                              >
                                Try again
                              </button>
                              <Button
                                variant="outline"
                                onClick={handleGenerateBundleClick}
                                disabled={isBundling}
                                className="mt-4"
                              >
                                {isBundling ? (
                                  <>
                                    <LoadingSpinner className="w-4 h-4 mr-2" />
                                    Генерация бандла...
                                  </>
                                ) : (
                                  "Сгенерировать бандл"
                                )}
                              </Button>
                            </div>
                          ) : (
                            <>
                              <SandpackProviderUnstyled {...providerProps}>
                                <SandpackPreview
                                  showSandpackErrorOverlay={false}
                                  showOpenInCodeSandbox={
                                    process.env.NODE_ENV === "development"
                                  }
                                  showRefreshButton={false}
                                  onLoad={() => setIsLoading(false)}
                                  onError={() => {
                                    setPreviewError(true)
                                    setIsLoading(false)
                                  }}
                                />
                              </SandpackProviderUnstyled>
                              {!isLoading && !isFullScreen && (
                                <div className="absolute bottom-4 right-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerateBundleClick}
                                    disabled={isBundling}
                                    className="bg-background/80 backdrop-blur-sm"
                                  >
                                    {isBundling ? (
                                      <>
                                        <LoadingSpinner className="w-4 h-4 mr-2" />
                                        Генерация бандла...
                                      </>
                                    ) : (
                                      "Сгенерировать бандл"
                                    )}
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                          {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                              <LoadingSpinner text={loadingText} />
                            </div>
                          )}
                        </motion.div>
                      </SandpackProviderUnstyled>
                    </>
                  )}
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </TabsContent>

          <TabsContent
            value="code"
            className={cn(
              "relative rounded-md border",
              isFullScreen ? "fixed inset-0 z-50 m-0" : "m-0",
            )}
          >
            <div
              className={cn(
                "code-wrapper h-[480px]",
                isFullScreen && "h-screen",
              )}
            >
              <ResizablePanelGroup
                direction={isFullScreen ? "horizontal" : "vertical"}
                className="h-full w-full"
              >
                <ResizablePanel defaultSize={50}>
                  <div
                    ref={sandpackRef}
                    className="h-full w-full flex relative"
                  >
                    <SandpackProvider
                      files={files}
                      theme={isDarkTheme ? "dark" : "light"}
                      template="react"
                    >
                      <SandpackLayout className="flex w-full flex-row gap-4">
                        <div
                          className={`flex flex-col w-full ${styles.customScroller}`}
                        >
                          <MobileControls
                            isShowCode={isShowCode}
                            setIsShowCode={setIsShowCode}
                            canEdit={canEdit}
                            setIsEditDialogOpen={setIsEditDialogOpen}
                          />
                          <div className="flex w-full h-full flex-col">
                            {isShowCode ? (
                              <>
                                <CopyCommandSection component={component} />
                                {isDebug && <SandpackFileExplorer />}
                                <div
                                  className={`overflow-auto ${styles.codeViewerWrapper} relative`}
                                >
                                  <Tabs
                                    value={activeFile}
                                    onValueChange={setActiveFile}
                                  >
                                    <TabsList className="h-9 relative bg-muted dark:bg-background justify-start w-full gap-0.5 pb-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border px-4 overflow-x-auto flex-nowrap hide-scrollbar">
                                      {visibleFiles.map((file) => (
                                        <TabsTrigger
                                          key={file}
                                          value={file}
                                          className="overflow-hidden data-[state=active]:rounded-b-none data-[state=active]:bg-white dark:data-[state=active]:bg-[#151515] data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-border bg-muted dark:bg-background py-2 data-[state=active]:z-10 data-[state=active]:shadow-none flex-shrink-0 whitespace-nowrap"
                                        >
                                          {file.split("/").pop()}
                                        </TabsTrigger>
                                      ))}
                                    </TabsList>
                                    <div className="">
                                      <SandpackCodeViewer
                                        wrapContent={true}
                                        showTabs={false}
                                      />
                                    </div>
                                  </Tabs>
                                </div>
                              </>
                            ) : (
                              <ComponentPageInfo component={component} />
                            )}
                          </div>
                        </div>
                      </SandpackLayout>
                    </SandpackProvider>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </TabsContent>
        </Tabs>
      </AnimatePresence>
    </motion.div>
  )
}

function CopyCommandSection({
  component,
}: {
  component: Component & { user: User }
}) {
  const installUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${component.user.username}/${component.component_slug}`
  const [copied, setCopied] = useState(false)
  const [selectedPackageManager, setSelectedPackageManager] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("preferredPackageManager") || "npm"
      : "npm",
  )

  const controls = useAnimation()

  const copyCommand = () => {
    const runner = getPackageRunner(selectedPackageManager)
    const command = `${runner} shadcn@latest add "${installUrl}"`
    navigator?.clipboard?.writeText(command)
    setCopied(true)
    trackEvent(AMPLITUDE_EVENTS.COPY_INSTALL_COMMAND, {
      componentId: component.id,
      componentName: component.name,
      packageManager: selectedPackageManager,
      installUrl,
    })
    setTimeout(() => setCopied(false), 1000)
    toast("Command copied to clipboard")
  }

  const handlePackageManagerChange = (pm: string) => {
    setSelectedPackageManager(pm)
    localStorage.setItem("preferredPackageManager", pm)
  }

  return (
    <div className="p-4 bg-muted dark:bg-background">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[14px] font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
          Install component
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
            <TextMorph className="text-sm">{selectedPackageManager}</TextMorph>
            <ChevronDown
              className="ml-1.5 -mr-1 opacity-70"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[--radix-dropdown-menu-trigger-width]"
          >
            <DropdownMenuItem onClick={() => handlePackageManagerChange("npm")}>
              npm
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handlePackageManagerChange("yarn")}
            >
              yarn
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handlePackageManagerChange("pnpm")}
            >
              pnpm
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePackageManagerChange("bun")}>
              bun
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div
        className="mb-2 mt-4 p-4 h-14 rounded-lg border bg-zinc-950 dark:bg-zinc-900 flex items-center"
        onMouseEnter={() => controls.start("hover")}
        onMouseLeave={() => controls.start("normal")}
      >
        <div className="flex items-center justify-center text-white w-5 h-5 mr-3">
          <Icons.terminal size={20} controls={controls} />
        </div>
        <div className="flex-grow overflow-scroll scrollbar-hide">
          <code className="flex items-center whitespace-nowrap font-mono text-sm">
            <span className="mr-2 text-white">
              {getPackageRunner(selectedPackageManager)}
            </span>
            <span className="text-muted-foreground">
              shadcn@latest add "{installUrl}"
            </span>
          </code>
        </div>
        <button
          onClick={copyCommand}
          className="flex-shrink-0 ml-3 flex items-center justify-center p-1 hover:bg-zinc-800 text-white w-8 h-8 rounded-md relative"
        >
          <div
            className={cn(
              "transition-all absolute",
              copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
            )}
          >
            <CheckIcon size={16} className="stroke-emerald-500" />
          </div>
          <div
            className={cn(
              "transition-all absolute",
              copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
            )}
          >
            <CopyIcon size={16} />
          </div>
        </button>
      </div>
    </div>
  )
}

const MobileControls = ({
  isShowCode,
  setIsShowCode,
  canEdit,
  setIsEditDialogOpen,
}: {
  isShowCode: boolean
  setIsShowCode: (value: boolean) => void
  canEdit: boolean
  setIsEditDialogOpen: (value: boolean) => void
}) => {
  const isMobile = useIsMobile()

  if (!isMobile) return null

  return (
    <div className="flex items-center gap-2 p-4 md:hidden">
      <div className="relative bg-muted rounded-lg h-8 p-0.5 flex flex-1">
        <div
          className="absolute inset-y-0.5 rounded-md bg-background shadow transition-all duration-200 ease-in-out"
          style={{
            width: "calc(50% - 2px)",
            left: isShowCode ? "2px" : "calc(50%)",
          }}
        />
        <button
          onClick={() => setIsShowCode(true)}
          className={`relative z-2 px-2 flex-1 flex items-center justify-center transition-colors duration-200 ${
            isShowCode ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <CodeXml size={18} />
          <span className="text-[14px] pl-1">Code</span>
        </button>
        <button
          onClick={() => setIsShowCode(false)}
          className={`relative z-2 px-2 flex-1 flex items-center justify-center transition-colors duration-200 ${
            !isShowCode ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <Info size={18} />
          <span className="pl-1 text-[14px]">Info</span>
        </button>
      </div>
      {canEdit && (
        <button
          onClick={() => setIsEditDialogOpen(true)}
          className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-md relative"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Pencil size={16} />
          </div>
        </button>
      )}
    </div>
  )
}

// Добавляем компонент отображения бандла в iframe в конец файла
export function BundleIframeComponent({ url }: { url: string }) {
  const [isLoading, setIsLoading] = React.useState(true)

  return (
    <div className="relative w-full h-full rounded-md overflow-hidden border border-border">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
      <iframe
        src={url}
        className="w-full h-full"
        onLoad={() => setIsLoading(false)}
        allowFullScreen
      />
    </div>
  )
}
