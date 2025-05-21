"use client"

import {
  SandpackPreview,
  SandpackProviderProps,
  SandpackProvider as SandpackProviderUnstyled,
} from "@codesandbox/sandpack-react"
import { motion } from "motion/react"
import React, { useEffect, useMemo, useState } from "react"

import { useBundleDemo } from "@/hooks/use-bundle-demo"
import { generateBundleFiles } from "@/lib/sandpack"
import { Component, Demo, Tag, User } from "@/types/global"
import { useTheme } from "next-themes"
import { FullScreenButton } from "../../ui/full-screen-button"
import { LoadingSpinner } from "../../ui/loading-spinner"

interface LegacyFlowPreviewRendererProps {
  providerProps: SandpackProviderProps
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
  demo: Demo
  css: string | null
  shellCode: string[]
  allDependencies: Record<string, string>
}

const LoadingDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-full gap-3">
    <LoadingSpinner />
    <p className="text-muted-foreground text-sm">{message}</p>
  </div>
)

const LoadingOverlay: React.FC<{ text: string }> = ({ text }) => (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center h-full gap-3 bg-background/80">
    <LoadingSpinner />
    <p className="text-muted-foreground text-sm">{text}</p>
  </div>
)

export function LegacyFlowPreviewRenderer({
  providerProps,
  component,
  code,
  demoCode,
  demoComponentNames,
  registryDependencies,
  tailwindConfig,
  globalCss,
  demo,
  css,
  shellCode,
  allDependencies,
}: LegacyFlowPreviewRendererProps) {
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"

  const [contentLoading, setContentLoading] = useState(true)
  const [contentError, setContentError] = useState(false)
  const [showLongLoadMessage, setShowLongLoadMessage] = useState(false)

  const bundleFiles = useMemo(
    () => ({
      ...registryDependencies,
      ...generateBundleFiles({
        demoComponentNames,
        componentSlug: component.component_slug,
        relativeImportPath: `/components/${component.registry}`,
        code,
        demoCode,
        css: css || "",
        customTailwindConfig: tailwindConfig,
        customGlobalCss: globalCss,
      }),
    }),
    [
      registryDependencies,
      demoComponentNames,
      component.component_slug,
      component.registry,
      code,
      demoCode,
      css,
      tailwindConfig,
      globalCss,
    ],
  )

  const { bundle, error: bundleError } = useBundleDemo({
    files: bundleFiles,
    dependencies: allDependencies,
    component,
    shellCode,
    demoId: demo.id,
    tailwindConfig,
    globalCss,
  })

  const demoBundleHash = demo?.bundle_hash

  const urls = useMemo(() => {
    if ((code === "" || demoCode === "") && demo.bundle_html_url) {
      return {
        html: demo.bundle_html_url,
      }
    }
    if (bundle?.html) {
      return bundle
    }
    return null
  }, [bundle?.html, demo.bundle_html_url, code, demoCode])

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    const isPreviewDefinitelyUnavailable = !!(
      bundle?.html &&
      demoBundleHash === "0" &&
      !bundleError
    )

    if (isPreviewDefinitelyUnavailable) {
      if (contentLoading) {
        setContentLoading(false)
      }
      setShowLongLoadMessage(false)
    } else if (contentLoading) {
      setShowLongLoadMessage(false)
      timer = setTimeout(() => {
        if (contentLoading && !isPreviewDefinitelyUnavailable) {
          setShowLongLoadMessage(true)
        }
      }, 10000)
    } else {
      setShowLongLoadMessage(false)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [contentLoading, bundle, demoBundleHash, bundleError])

  const derivedErrorFromBundle = bundleError
  const shouldShowErrorState = contentError || !!derivedErrorFromBundle

  const getCurrentLoadingMessage = () => {
    if (showLongLoadMessage) {
      return "Loading is taking longer than usual... you may want to refresh the page"
    }
    return "Starting preview..."
  }

  let displayContent: React.ReactNode

  if (shouldShowErrorState) {
    displayContent = (
      <>
        {contentLoading && !contentError && (
          <LoadingOverlay text={getCurrentLoadingMessage()} />
        )}
        <SandpackProviderUnstyled {...providerProps}>
          <SandpackPreview
            showSandpackErrorOverlay={false}
            showOpenInCodeSandbox={process.env.NODE_ENV === "development"}
            showRefreshButton={false}
            onLoad={() => setContentLoading(false)}
            onError={() => {
              setContentError(true)
              setContentLoading(false)
            }}
          />
        </SandpackProviderUnstyled>
      </>
    )
  } else if (urls?.html && demoBundleHash !== "0") {
    displayContent = (
      <>
        {contentLoading && <LoadingOverlay text={getCurrentLoadingMessage()} />}
        <iframe
          src={isDarkTheme ? `${urls.html}?dark=true` : urls.html}
          className="w-full h-full"
          onLoad={() => setContentLoading(false)}
          onError={() => {
            setContentError(true)
            setContentLoading(false)
          }}
        />
      </>
    )
  } else {
    let message: string
    const isPreviewUnavailableNonError = !!(
      bundle?.html &&
      demoBundleHash === "0" &&
      !bundleError
    )

    if (isPreviewUnavailableNonError) {
      message = "Preview is not available for this specific demo version."
      if (contentLoading) setContentLoading(false)
    } else if (
      (bundle === null || bundle?.html === null) &&
      !bundleError &&
      contentLoading
    ) {
      message = getCurrentLoadingMessage()
    } else if (
      !bundleError &&
      !bundle?.html &&
      !contentLoading &&
      demoBundleHash !== "0"
    ) {
      message = "Preview content is unavailable."
    } else {
      message = getCurrentLoadingMessage()
    }

    if (
      contentLoading &&
      !shouldShowErrorState &&
      !(bundle?.html && demoBundleHash !== "0")
    ) {
      displayContent = <LoadingDisplay message={getCurrentLoadingMessage()} />
    } else {
      displayContent = <LoadingDisplay message={message} />
    }
  }

  return (
    <motion.div className="relative flex-grow h-full rounded-lg overflow-hidden">
      <FullScreenButton />
      {displayContent}
    </motion.div>
  )
}
