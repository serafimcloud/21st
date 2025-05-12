"use client"

import React, { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BrandAssetsMenu, useBrandAssetsMenu } from "./brand-assets-menu"
import { createPortal } from "react-dom"
import dynamic from "next/dynamic"
const Lottie = dynamic(() => import("lottie-react"), { ssr: false })
import { useTheme } from "next-themes"

// Animation cache to prevent multiple fetches of the same file
const animationCache = new Map<string, any>()

// Preload the default animation
if (typeof window !== "undefined") {
  fetch("/loading.json")
    .then((response) => response.json())
    .then((data) => {
      animationCache.set("/loading.json", data)
    })
    .catch((error) => console.error("Error preloading animation:", error))
}

interface LogoProps {
  fill?: string
  className?: string
  position?: "fixed" | "flex"
  hasLink?: boolean
  animationFile?: string
}

export function Logo({
  fill = "currentColor",
  className,
  position = "fixed",
  hasLink = true,
  animationFile = "/loading.json",
}: LogoProps) {
  const { isVisible, setIsVisible, toggleMenu } = useBrandAssetsMenu()
  const logoRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [animationData, setAnimationData] = useState<any>(
    animationCache.get(animationFile) || null,
  )
  const [lottieReady, setLottieReady] = useState(false)
  const hasFetchedRef = useRef(false)
  const { resolvedTheme } = useTheme()

  // Only render portal on client-side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    console.log("Brand menu visibility state:", isVisible)
  }, [isVisible])

  useEffect(() => {
    // Skip fetch if we already have the animation in cache
    if (animationCache.has(animationFile)) {
      setAnimationData(animationCache.get(animationFile))
      return
    }

    // Skip duplicate fetches
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    // We'll use the JSON file as default
    if (animationFile && animationFile.endsWith(".json")) {
      fetch(animationFile)
        .then((response) => response.json())
        .then((data) => {
          // Cache the animation data
          animationCache.set(animationFile, data)
          setAnimationData(data)
        })
        .catch((error) =>
          console.error("Error loading Lottie animation:", error),
        )
    }
  }, [animationFile])

  // Set lottieReady to true after a small delay when animation data is available
  useEffect(() => {
    if (animationData) {
      const timer = setTimeout(() => {
        setLottieReady(true)
      }, 300) // Small delay to ensure Lottie is rendered before fading in
      return () => clearTimeout(timer)
    }
  }, [animationData])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log("Right-click detected, setting menu visible")
    setIsVisible(true)
  }

  const svgLogo = (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="21st logo - Right-click to open brand assets menu"
    >
      <path
        d="M0 20C0 8.95431 8.95431 0 20 0C31.0457 0 40 8.95431 40 20C40 31.0457 31.5 35.5 20 40H40C40 51.0457 31.0457 60 20 60C8.95431 60 0 51.0457 0 40C0 28.9543 9.5 22 20 20H0Z"
        fill={fill}
      />
      <path
        d="M40 60C51.7324 55.0977 60 43.5117 60 30C60 16.4883 51.7324 4.90234 40 0V60Z"
        fill={fill}
      />
    </svg>
  )

  const renderLogo = () => (
    <div
      className="w-full h-full relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Static SVG Logo */}
      <div
        className={cn(
          "w-full h-full absolute inset-0 transition-opacity duration-300",
          isHovered ? "opacity-0" : "opacity-100",
        )}
      >
        {svgLogo}
      </div>

      {/* Lottie Animation */}
      {animationData && typeof window !== "undefined" && (
        <div
          className={cn(
            "w-full h-full absolute inset-0 transition-opacity duration-300",
            isHovered && lottieReady ? "opacity-100" : "opacity-0",
            resolvedTheme === "dark" && "lottie-dark-mode",
          )}
        >
          <Lottie
            animationData={animationData}
            style={{ width: "100%", height: "100%" }}
            rendererSettings={{
              preserveAspectRatio: "xMidYMid slice",
              progressiveLoad: true,
            }}
          />
        </div>
      )}
    </div>
  )

  const renderMenu = () => {
    if (!isVisible) return null

    // Use portal to render menu at document root
    if (isMounted) {
      return createPortal(
        <BrandAssetsMenu isVisible={isVisible} setIsVisible={setIsVisible} />,
        document.body,
      )
    }

    return null
  }

  if (!hasLink) {
    return (
      <div
        ref={logoRef}
        className={cn(
          `${position === "fixed" ? position : ""} w-7 h-7 flex items-center justify-center ${position === "fixed" ? "left-4 top-3" : ""} rounded-full group cursor-pointer relative`,
          className,
        )}
        onClick={toggleMenu}
        onContextMenu={handleContextMenu}
        title="Right-click for brand assets menu"
      >
        {renderLogo()}
        {renderMenu()}
        <span
          id="brand-tooltip"
          role="tooltip"
          className="opacity-0 hidden bg-white w-max group-focus-within:block text-[13px] text-slate-600 absolute shadow-md left-1/2 px-1 -translate-x-1/2 rounded-md transition-opacity top-full mt-1 dark:bg-neutral-900 dark:text-indigo-100 dark:outline dark:outline-1 dark:outline-neutral-700/50"
          style={{ animationDelay: "1000ms" }}
        >
          ⌘ + Click or Right-Click to open brand menu
        </span>
      </div>
    )
  }

  return (
    <div ref={logoRef} className="relative">
      <Link
        href="/?tab=home"
        className={cn(
          `${position === "fixed" ? position : ""} w-7 h-7 flex items-center justify-center ${position === "fixed" ? "left-4 top-3" : ""} rounded-full group cursor-pointer`,
          className,
        )}
        onClick={toggleMenu}
        onContextMenu={handleContextMenu}
        title="Right-click for brand assets menu"
      >
        {renderLogo()}
        <span
          id="brand-tooltip"
          role="tooltip"
          className="opacity-0 hidden bg-white w-max group-focus-within:block text-[13px] text-slate-600 absolute shadow-md left-1/2 px-1 -translate-x-1/2 rounded-md transition-opacity top-full mt-1 dark:bg-neutral-900 dark:text-indigo-100 dark:outline dark:outline-1 dark:outline-neutral-700/50"
          style={{ animationDelay: "1000ms" }}
        >
          ⌘ + Click or Right-Click to open brand menu
        </span>
      </Link>
      {renderMenu()}
    </div>
  )
}
