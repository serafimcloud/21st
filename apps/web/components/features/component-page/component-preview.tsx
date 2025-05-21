"use client"

import { useAtom } from "jotai"
import {
  CheckIcon,
  ChevronDown,
  CodeXml,
  CopyIcon,
  Info,
  Pencil,
} from "lucide-react"
import { AnimatePresence, motion, useAnimation } from "motion/react"
import { useTheme } from "next-themes"
import { useEffect, useMemo, useRef, useState } from "react"

import { Icons } from "@/components/icons"
import { TextShimmer } from "@/components/ui/text-shimmer"
import {
  isFullScreenAtom,
  isShowCodeAtom,
} from "../../../app/[username]/[component_slug]/page.client"
import { CopyCodeButton } from "../../ui/copy-code-card-button"
import { LoadingSpinner } from "../../ui/loading-spinner"
import { ComponentPageInfo } from "./info-section"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextMorph } from "@/components/ui/text-morph"

import {
  SandpackCodeViewer,
  SandpackFileExplorer,
  SandpackLayout,
  SandpackProvider,
  SandpackProviderProps,
} from "@codesandbox/sandpack-react"

import { useCompileCss } from "@/hooks/use-compile-css"
import { useDebugMode } from "@/hooks/use-debug-mode"
import { useIsMobile } from "@/hooks/use-media-query"

import { AMPLITUDE_EVENTS, trackEvent } from "@/lib/amplitude"
import { generateSandpackFiles } from "@/lib/sandpack"
import { cn, getPackageRunner } from "@/lib/utils"
import { Component, Demo, Tag, User } from "@/types/global"
import { useAuth, useUser } from "@clerk/nextjs"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ComponentAccessState } from "@/hooks/use-component-access"
import styles from "./component-preview.module.css"
import { LegacyFlowPreviewRenderer } from "./legacy-flow-preview-renderer"
import { NewFlowPreviewRender } from "./new-flow-preview-render"
import { PayWall } from "./pay-wall"

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
  showPaywall,
  accessState,
  tailwind4IndexCss,
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
  tailwind4IndexCss?: string
  globalCss?: string
  compiledCss?: string | null
  canEdit: boolean
  setIsEditDialogOpen: (value: boolean) => void
  demo: Demo
  showPaywall: boolean
  accessState: ComponentAccessState
}) {
  const sandpackRef = useRef<HTMLDivElement>(null)
  const { user } = useUser()
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const [isShowCode, setIsShowCode] = useAtom(isShowCodeAtom)
  const isDebug = useDebugMode()
  const [isFullScreen] = useAtom(isFullScreenAtom)

  const isNewFlowOfPiblishing = !!component.sandbox_id

  const effectiveAccessState = accessState

  const dumySandpackFiles = generateSandpackFiles({
    demoComponentNames,
    componentSlug: component.component_slug,
    relativeImportPath: `/components/${component.registry}`,
    code,
    demoCode,
    theme: isDarkTheme ? "dark" : "light",
    css: "",
  })

  const shellCode = useMemo(
    () =>
      Object.entries(dumySandpackFiles)
        .filter(
          ([key]) =>
            key.endsWith(".tsx") ||
            key.endsWith(".jsx") ||
            key.endsWith(".ts") ||
            key.endsWith(".js"),
        )
        .map(([, file]) => file),
    [dumySandpackFiles],
  )

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
    ...(tailwind4IndexCss ? { "index.css": tailwind4IndexCss } : []),
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

  const allDependencies = useMemo(
    () => ({
      "@radix-ui/react-select": "^1.0.0",
      "lucide-react": "latest",
      "tailwind-merge": "latest",
      clsx: "latest",
      ...dependencies,
      ...demoDependencies,
      ...npmDependenciesOfRegistryDependencies,
    }),
    [dependencies, demoDependencies, npmDependenciesOfRegistryDependencies],
  )

  const mainComponentFile = Object.keys(files).find((file) =>
    file.endsWith(`${component.component_slug}.tsx`),
  )

  const demoComponentFile = Object.keys(files).find((file) =>
    file.endsWith(`demo.tsx`),
  )

  const [activeFile, setActiveFile] = useState<string>(
    demoComponentFile ?? mainComponentFile ?? "",
  )

  if (!css && !isNewFlowOfPiblishing)
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
    ...(tailwind4IndexCss ? ["index.css"] : []),
    ...(tailwindConfig ? ["tailwind.config.js"] : []),
    ...(globalCss ? ["globals.css"] : []),
    ...Object.keys(registryDependencies).filter(
      (file) => file !== mainComponentFile,
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
          ease: [0.4, 0, 0.2, 1],
        },
      }}
    >
      {isNewFlowOfPiblishing ? (
        <NewFlowPreviewRender demo={demo} />
      ) : (
        <LegacyFlowPreviewRenderer
          component={component}
          code={code}
          demoCode={demoCode}
          dependencies={dependencies}
          demoDependencies={demoDependencies}
          demoComponentNames={demoComponentNames}
          registryDependencies={registryDependencies}
          npmDependenciesOfRegistryDependencies={
            npmDependenciesOfRegistryDependencies
          }
          tailwindConfig={tailwindConfig}
          globalCss={globalCss}
          demo={demo}
          providerProps={providerProps}
          css={css}
          shellCode={shellCode}
          allDependencies={allDependencies}
        />
      )}

      <AnimatePresence mode="popLayout">
        {!isFullScreen && (
          <motion.div
            layout="position"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{
              duration: 0.3,
              opacity: { duration: 0.2 },
              x: {
                type: "spring",
                stiffness: 300,
                damping: 30,
              },
            }}
            className="h-full w-full md:max-w-[30%] mi overflow-hidden rounded-lg border border-border min-w-[350px] dark:bg-[#151515]"
          >
            <SandpackProvider {...providerProps}>
              <div ref={sandpackRef} className="h-full w-full flex relative">
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
                        !showPaywall ? (
                          <>
                            <CopyCommandSection component={component} />
                            {isDebug && <SandpackFileExplorer />}
                            <div
                              className={`overflow-auto ${styles.codeViewerWrapper} relative`}
                            >
                              <CopyCodeButton
                                component_id={component.id}
                                user_id={user?.id}
                              />
                              <Tabs
                                value={activeFile}
                                onValueChange={setActiveFile}
                                className="h-full"
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
                                <div className="h-full pb-4">
                                  <SandpackCodeViewer
                                    wrapContent
                                    showTabs={false}
                                  />
                                </div>
                              </Tabs>
                            </div>
                          </>
                        ) : (
                          <PayWall
                            accessState={effectiveAccessState}
                            component={component}
                          />
                        )
                      ) : (
                        <ComponentPageInfo component={component} />
                      )}
                    </div>
                  </div>
                </SandpackLayout>
              </div>
            </SandpackProvider>
          </motion.div>
        )}
      </AnimatePresence>
      {isDebug && (
        <div className="absolute top-0 left-0 bg-background text-foreground p-2 z-50">
          Debug Mode
        </div>
      )}
    </motion.div>
  )
}

const useInstallUrl = (component: Component, user: User) => {
  const auth = useAuth()
  const [installUrl, setInstallUrl] = useState<string | undefined>()

  useEffect(() => {
    // TODO: Add custom template to make JWT live longer
    auth.getToken({ template: "long-token" }).then((token) => {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_APP_URL}/r/${user.username}/${component.component_slug}`,
      )
      if (token) {
        url.searchParams.set("api_key", token)
      }
      setInstallUrl(url.toString())
    })
  }, [component.id, user.id])

  return installUrl
}

function CopyCommandSection({
  component,
}: {
  component: Component & { user: User }
}) {
  const installUrl = useInstallUrl(component, component.user)
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
          {installUrl === undefined ? (
            <TextShimmer className="font-mono text-sm">Loading...</TextShimmer>
          ) : (
            <code className="flex items-center whitespace-nowrap font-mono text-sm">
              <span className="mr-2 text-white">
                {getPackageRunner(selectedPackageManager)}
              </span>
              <span className="text-muted-foreground">
                shadcn@latest add "{installUrl}"
              </span>
            </code>
          )}
        </div>
        <Button
          onClick={copyCommand}
          size="icon"
          variant="ghost"
          disabled={installUrl === undefined}
          className="relative shrink-0 ml-3 hover:bg-zinc-800"
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
        </Button>
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
