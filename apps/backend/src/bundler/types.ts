export interface BundleOptions {
  files: Record<string, string> // path -> content
  dependencies?: Record<string, string> // package name -> version
  tailwindConfig?: string
  globalCss?: string
  bundledCss?: string
}

export interface BundleResult {
  js: string
  css: string
  html?: string
  bundler: "vite"
}
