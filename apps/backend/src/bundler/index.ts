import endent from "endent"
import fs from "fs/promises"
import path from "path"
import { BundleOptions, BundleResult } from "./types"
import { createTempProject } from "./project"
import { bundleWithVite } from "./vite"
import { compileCSS } from "../css-processor"

export const bundleReact = async ({
  files,
  baseTailwindConfig,
  baseGlobalCss,
  customTailwindConfig,
  customGlobalCss,
  dependencies,
}: {
  files: Record<string, string>
  baseTailwindConfig: string
  baseGlobalCss: string
  customTailwindConfig?: string
  customGlobalCss?: string
  dependencies?: Record<string, string>
}): Promise<BundleResult> => {
  let tempDir: string | null = null

  try {
    console.log("=== BUNDLING REQUEST ===")
    console.log("Files to bundle:", Object.keys(files))
    console.log("\nDependencies:", dependencies)

    const allFiles = {
      ...files,
      "main.tsx": endent`
        import { createRoot } from "react-dom/client";
        import { StrictMode } from "react";
        import App from "./App";
        import { ThemeProvider } from "./next-themes";
        import "./globals.css";

        const rootElement = document.getElementById("root");
        const root = createRoot(rootElement);

        root.render(
          <StrictMode>
            <ThemeProvider attribute="class" enableSystem={false}>
              <App />
            </ThemeProvider>
          </StrictMode>
        );
      `,
    }

    const bundledCss = await compileCSS({
      jsx: allFiles["main.tsx"],
      baseTailwindConfig,
      baseGlobalCss,
      customTailwindConfig,
      customGlobalCss,
    })

    tempDir = await createTempProject({
      files: allFiles,
      dependencies,
      tailwindConfig: baseTailwindConfig,
      globalCss: baseGlobalCss,
      bundledCss,
    })

    const outDir = path.join(tempDir, "dist")
    console.log("\nBundling with Vite...")

    const bundleSuccess = await bundleWithVite(tempDir, outDir)

    if (!bundleSuccess) {
      console.log("Bundle failed!")
      try {
        const files = await fs.readdir(tempDir)
        console.log("Files in temp directory:", files)

        if (files.includes("demo.tsx")) {
          const demoContent = await fs.readFile(
            path.join(tempDir, "demo.tsx"),
            "utf-8",
          )
          console.log("\n--- Content of demo.tsx ---")
          console.log(demoContent)
        }
      } catch (err) {
        console.log("Error listing temp directory:", err)
      }

      throw new Error("Failed to bundle with Vite")
    }

    console.log("Bundle succeeded!")

    const bundledHtml = await fs.readFile(
      path.join(outDir, "index.html"),
      "utf-8",
    )

    return {
      js: "",
      css: "",
      html: bundledHtml,
      bundler: "vite",
    }
  } finally {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  }
}
