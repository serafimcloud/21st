import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPackageRunner(packageManager: string) {
  switch (packageManager) {
    case "pnpm":
      return "pnpm dlx"
    case "yarn":
      return "npx"
    case "bun":
      return "bunx --bun"
    case "npm":
    default:
      return "npx"
  }
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date)
}

export function appendQueryParam(url: string, param: string, value: string) {
  try {
    const urlObj = new URL(url)
    if (!urlObj.searchParams.has(param)) {
      urlObj.searchParams.append(param, value)
    }
    return urlObj.toString()
  } catch (e) {
    return url
  }
}

export function replaceSpacesWithPlus(str: string) {
  return str?.trim()?.replace(/\s+/g, "+")
}

export function makeSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export const isMac =
  typeof window !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

/**
 * Normalize file path by removing @/ prefix and ensuring consistent format
 */
export function normalizePath(path: string): string {
  return path.replace(/^@\//, "/")
}

/**
 * Compare two paths after normalization
 */
export function arePathsEqual(path1: string, path2: string): boolean {
  return normalizePath(path1) === normalizePath(path2)
}
