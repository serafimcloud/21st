import { serve } from "bun"
import endent from "endent"
import tailwindcss from "tailwindcss"
import postcss from "postcss"
import * as ts from "typescript"
import { merge } from "lodash"
import { exec } from "child_process"
import fs from "fs/promises"
import path from "path"
import os from "os"
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"

// Initialize R2 client
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
})

const isValidId = (id: string) => {
  // Only allow alphanumeric characters, hyphens, and underscores
  return /^[a-zA-Z0-9-_]+$/.test(id)
}

const saveBundledFilesToR2 = async (
  id: string,
  {
    html,
  }: {
    html: string
  },
): Promise<{ htmlUrl: string }> => {
  if (!isValidId(id)) {
    throw new Error(
      "Invalid ID format. Only alphanumeric characters, hyphens, and underscores are allowed.",
    )
  }

  const bucketName = "components-code"
  const baseKey = `bundled/${id}`

  // Store the complete HTML
  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: `${baseKey}.html`,
      Body: Buffer.from(html),
      ContentType: "text/html",
    }),
  )

  return {
    htmlUrl: `${process.env.NEXT_PUBLIC_CDN_URL}/${baseKey}.html`,
  }
}

const getBundledPageFromR2 = async (id: string): Promise<string | null> => {
  if (!isValidId(id)) {
    return null
  }

  try {
    const bucketName = "components-code"
    const key = `bundled/${id}.html`

    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    )

    if (!response.Body) {
      return null
    }

    const html = await response.Body.transformToString()
    return html
  } catch (error) {
    console.error("Error fetching from R2:", error)
    return null
  }
}

export const compileCSS = async ({
  jsx,
  baseTailwindConfig,
  customTailwindConfig,
  baseGlobalCss,
  customGlobalCss,
}: {
  jsx: string
  baseTailwindConfig: string
  customTailwindConfig?: string
  baseGlobalCss?: string
  customGlobalCss?: string
}) => {
  try {
    const globalCss = endent`
      ${baseGlobalCss}
      ${customGlobalCss ?? ""}
    `

    const baseConfigObj = Function(
      "require",
      "module",
      `
      module.exports = ${baseTailwindConfig};
      return module.exports;
    `,
    )(require, { exports: {} })

    if (customTailwindConfig) {
      try {
        const transpiledCustomTailwindConfig = ts.transpileModule(
          customTailwindConfig,
          {
            compilerOptions: {
              target: ts.ScriptTarget.ES2015,
              module: ts.ModuleKind.CommonJS,
              removeComments: true,
            },
          },
        ).outputText

        const matches = transpiledCustomTailwindConfig.match(
          /([\s\S]*?)(module\.exports\s*=\s*({[\s\S]*?});)([\s\S]*)/,
        )

        if (!matches) {
          throw new Error(
            "Invalid Tailwind config format: Could not parse configuration object",
          )
        }

        const [_, beforeConfig, __, configObject, afterConfig] = matches

        try {
          const customConfigObj = Function(
            "require",
            "module",
            `
            ${beforeConfig || ""}
            module.exports = ${configObject};
            ${afterConfig || ""}
            return module.exports;
          `,
          )(require, { exports: {} })

          const mergedConfig = merge(baseConfigObj, customConfigObj)

          // Custom serialization to handle functions
          let serializedConfig = JSON.stringify(
            mergedConfig,
            (key, value) => {
              if (typeof value === "function") {
                return value.name || value.toString()
              }
              return value
            },
            2,
          )

          // Match any string that looks like a function, including escaped ones
          serializedConfig = serializedConfig.replace(
            /"(function[\s\S]*?\{[\s\S]*?\}|[\w]+)"/g,
            (match, functionContent) => {
              // If it's a function definition (starts with 'function'), return it unquoted and unescaped
              if (functionContent.startsWith("function")) {
                // Unescape the function content
                return functionContent
                  .replace(/\\"/g, '"') // Replace \" with "
                  .replace(/\\n/g, "\n") // Replace \n with newline
                  .replace(/\\\\/g, "\\") // Replace \\ with \
              }
              // For named functions in plugins array
              if (
                mergedConfig.plugins?.some(
                  (plugin: Function) => plugin.name === functionContent,
                )
              ) {
                return functionContent
              }
              // Keep quotes for non-functions
              return `"${functionContent}"`
            },
          )

          const finalConfig = endent`
            ${beforeConfig || ""}
            module.exports = ${serializedConfig};
            ${afterConfig || ""}
          `

          try {
            const evaluatedFinalConfig = Function(
              "require",
              "module",
              `
              ${finalConfig};
              return module.exports;
            `,
            )(require, { exports: {} })

            return await processCSS(jsx, evaluatedFinalConfig, globalCss)
          } catch (evalError) {
            throw new Error(
              `Error evaluating final Tailwind config: ${evalError instanceof Error ? evalError.message : String(evalError)}`,
            )
          }
        } catch (functionError) {
          throw new Error(
            `Error processing custom Tailwind config: ${functionError instanceof Error ? functionError.message : String(functionError)}`,
          )
        }
      } catch (transpileError) {
        throw new Error(
          `Error transpiling custom Tailwind config: ${transpileError instanceof Error ? transpileError.message : String(transpileError)}`,
        )
      }
    }

    try {
      const evaluatedBaseConfig = Function(
        "require",
        "module",
        `
        module.exports = ${baseTailwindConfig};
        return module.exports;
      `,
      )(require, { exports: {} })

      return await processCSS(jsx, evaluatedBaseConfig, globalCss)
    } catch (baseConfigError) {
      throw new Error(
        `Error processing base Tailwind config: ${baseConfigError instanceof Error ? baseConfigError.message : String(baseConfigError)}`,
      )
    }
  } catch (error) {
    console.error("Detailed CSS compilation error:", {
      error,
      jsx: jsx.slice(0, 200) + "...",
      customTailwindConfig: customTailwindConfig?.slice(0, 200) + "...",
      customGlobalCss: customGlobalCss?.slice(0, 200) + "...",
    })
    throw error
  }
}

const processCSS = async (jsx: string, config: object, globalCss: string) => {
  try {
    const result = await postcss([
      tailwindcss({
        ...config,
        content: [{ raw: jsx, extension: "tsx" }],
      }),
    ]).process(globalCss, {
      from: undefined,
    })
    return result.css
  } catch (error) {
    throw new Error(
      `PostCSS processing error: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function convertVideo(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i "${inputPath}" -c:v libx264 -crf 23 -preset medium -an "${outputPath}"`
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}

interface BundleOptions {
  files: Record<string, string> // path -> content
  dependencies?: Record<string, string> // package name -> version
  tailwindConfig?: string
  globalCss?: string
}

const createTempProject = async (options: BundleOptions) => {
  const tempDir = path.join(".", `react-bundle-${Date.now()}`)
  await fs.mkdir(tempDir, { recursive: true })

  try {
    // Create package.json
    const packageJson = {
      name: "temp-bundle",
      private: true,
      type: "module",
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        "next-themes": "^0.4.4",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        ...(options.dependencies || {}),
      },
    }

    // Write package.json
    await fs.writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify(packageJson, null, 2),
    )

    // Create next.js mock modules
    const nextModules = {
      "index.js": `
        export { default as Image } from './image.jsx';
        export { default as Link } from './link.jsx';
        export { useRouter, RouterProvider, usePathname } from './router.jsx';
        export { default as Head } from './head.jsx';
        export { default as Script } from './script.jsx';
        export { default as dynamic } from './dynamic.jsx';
        export { Roboto } from './font.js';
        export { default as Document } from './document.jsx';
      `,
      "image.jsx": `
        import * as React from 'react';
        const Image = ({ src, alt, width, height, ...props }) => (
          <img src={src} alt={alt} width={width} height={height} {...props} />
        );
        export default Image;
      `,
      "link.jsx": `
        import * as React from 'react';
        const Link = ({ href, children, ...props }) => (
          <a href={href} {...props}>{children}</a>
        );
        export default Link;
      `,
      "head.jsx": `
        import * as React from 'react';
        const Head = ({ children }) => {
          return <div>{children}</div>;
        };
        export default Head;
      `,
      "script.jsx": `
        import * as React from 'react';
        const Script = ({ src, strategy, children, ...props }) => {
          return <script src={src} {...props}>{children}</script>;
        };
        export default Script;
      `,
      "router.jsx": `
        import * as React from 'react';
        const RouterContext = React.createContext({
          pathname: '/',
          push: (url) => {},
          replace: (url) => {},
        });
        export const useRouter = () => React.useContext(RouterContext);
        export const usePathname = () => {
          const router = useRouter();
          return router.pathname;
        };
        export const RouterProvider = ({ children }) => {
          const router = {
            pathname: '/',
            push: (url) => {
              console.log(\`Navigating to \${url}\`);
            },
            replace: (url) => {
              console.log(\`Replacing with \${url}\`);
            },
          };
          return React.createElement(RouterContext.Provider, { value: router }, children);
        };
      `,
      "dynamic.jsx": `
        import * as React from 'react';
        const dynamic = (importFunc, options = {}) => {
          const { ssr = true, loading: LoadingComponent = () => React.createElement('div', null, 'Loading...') } = options;
          const LazyComponent = React.lazy(importFunc);
          return (props) => React.createElement(
            React.Suspense,
            { fallback: React.createElement(LoadingComponent) },
            React.createElement(LazyComponent, props)
          );
        };
        export default dynamic;
      `,
      "font.js": `
        export const Roboto = {
          className: 'font-roboto',
        };
      `,
      "document.jsx": `
        import * as React from 'react';
        const Html = ({ children, ...props }) => React.createElement('html', props, children);
        const Head = ({ children }) => React.createElement('head', null, children);
        const Main = () => React.createElement('div', { id: '__next' });
        const NextScript = () => React.createElement('script');
        
        export default function Document() {
          return React.createElement(
            Html,
            null,
            React.createElement(Head),
            React.createElement(
              'body',
              null,
              React.createElement(Main),
              React.createElement(NextScript)
            )
          );
        }
      `,
      "navigation.js": `
        export { usePathname } from './router.jsx';
      `,
      "package.json": `{
        "name": "next",
        "version": "latest",
        "type": "module",
        "main": "index.js"
      }`,
    }

    // Write Next.js mock modules
    const nextModulesDir = path.join(tempDir, "node_modules", "next")
    await fs.mkdir(nextModulesDir, { recursive: true })
    await Promise.all(
      Object.entries(nextModules).map(([filename, content]) =>
        fs.writeFile(path.join(nextModulesDir, filename), content),
      ),
    )

    // Write all source files
    await Promise.all(
      Object.entries(options.files).map(([filePath, content]) => {
        const fullPath = path.join(tempDir + "/src", filePath)
        const dirPath = path.dirname(fullPath)
        return fs
          .mkdir(dirPath, { recursive: true })
          .then(() => fs.writeFile(fullPath, content))
      }),
    )

    // Create index.html for Vite
    const indexHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`

    await fs.writeFile(path.join(tempDir, "index.html"), indexHtml)

    // Write Tailwind config if provided
    if (options.tailwindConfig) {
      await fs.writeFile(
        path.join(tempDir, "tailwind.config.js"),
        options.tailwindConfig,
      )
    }

    // Write global CSS if provided
    if (options.globalCss) {
      await fs.writeFile(path.join(tempDir, "globals.css"), options.globalCss)
    }

    // Install dependencies
    const installProcess = Bun.spawn(["bun", "install"], {
      cwd: tempDir,
      stderr: "pipe",
    })

    const exitCode = await installProcess.exited
    const output = await new Response(installProcess.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`Failed to install dependencies: ${output}`)
    }

    return tempDir
  } catch (error) {
    // Clean up on error
    await fs.rm(tempDir, { recursive: true, force: true })
    throw error
  }
}

const bundleWithVite = async (
  tempDir: string,
  outDir: string,
): Promise<boolean> => {
  try {
    console.log("vite: Starting bundling process...")

    // Create vite.config.js in temp directory
    await fs.writeFile(
      path.join(tempDir, "vite.config.js"),
      `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [],
        babelrc: false,
        configFile: false,
      },
      include: [/\\.jsx$/, /\\.tsx$/],
    }),
    viteSingleFile()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next': path.resolve(__dirname, 'node_modules/next'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    outDir: '${path.relative(tempDir, outDir)}',
    sourcemap: false,
    minify: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'next']
  }
});
      `,
    )

    // Import Vite build API
    const { build } = await import("vite")

    // Build with Vite
    await build({
      root: tempDir,
      configFile: path.join(tempDir, "vite.config.js"),
      logLevel: "info",
    })

    console.log("vite: Bundle completed successfully")
    return true
  } catch (error) {
    console.warn("vite: Bundling error:", error)
    return false
  }
}

const bundleReact = async ({
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
}): Promise<{
  js: string
  css: string
  html?: string
  bundler: "vite"
}> => {
  let tempDir: string | null = null

  try {
    console.log("=== BUNDLING REQUEST ===")
    console.log("Files to bundle:", Object.keys(files))
    console.log("\nDependencies:", dependencies)

    tempDir = await createTempProject({
      files: {
        ...files,
        "main.tsx": endent`
          import { createRoot } from "react-dom/client";
          import { StrictMode } from "react";
          import App from "./App";
          import { ThemeProvider } from "next-themes";
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
      },
      dependencies,
      tailwindConfig: baseTailwindConfig,
      globalCss: baseGlobalCss,
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

    // Read the bundled HTML file
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

const editorHTML = endent`
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>React + Tailwind Bundler</title>
      <script src="https://unpkg.com/monaco-editor@latest/min/vs/loader.js"></script>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
          background: #f5f5f5;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .editor-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .preview-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        #editor, #dependencies {
          height: 400px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        #dependencies {
          height: 100px;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        input[type="text"], select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        button {
          background: #0070f3;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1rem;
        }
        button:hover {
          background: #0051cc;
        }
        iframe {
          width: 100%;
          height: 500px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .error {
          color: #dc2626;
          margin-top: 0.5rem;
        }
        .controls {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }
        .controls .form-group {
          flex: 1;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="editor-container">
          <div class="controls">
            <div class="form-group">
              <label for="id">Page ID:</label>
              <input type="text" id="id" placeholder="Enter a unique ID (alphanumeric, hyphens, underscores)">
            </div>
            <div class="form-group">
              <input type="hidden" id="bundler" value="vite">
            </div>
          </div>
          <div class="form-group">
            <label for="editor">React Component:</label>
            <div id="editor"></div>
          </div>
          <div class="form-group">
            <label for="dependencies">Dependencies (JSON format):</label>
            <div id="dependencies"></div>
          </div>
          <button onclick="handleSubmit()">Bundle & Preview</button>
          <div id="error" class="error"></div>
        </div>
        <div class="preview-container">
          <h2>Preview:</h2>
          <iframe id="preview"></iframe>
        </div>
      </div>
      
      <script>
        // Setup Monaco Editor
        require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@latest/min/vs' }});
        require(['vs/editor/editor.main'], function() {
          window.editor = monaco.editor.create(document.getElementById('editor'), {
            value: \`export default function App() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-blue-600">
        Hello World!
      </h1>
    </div>
  )
}\`,
            language: 'typescript',
            theme: 'vs-light',
            minimap: { enabled: false }
          });

          window.dependenciesEditor = monaco.editor.create(document.getElementById('dependencies'), {
            value: \`{
  // Add your npm dependencies here
  // "package-name": "version"
}\`,
            language: 'json',
            theme: 'vs-light',
            minimap: { enabled: false }
          });
        });

        async function handleSubmit() {
          const code = window.editor.getValue();
          const id = document.getElementById('id').value;
          const bundler = document.getElementById('bundler').value;
          const dependenciesStr = window.dependenciesEditor.getValue();
          const errorDiv = document.getElementById('error');
          const preview = document.getElementById('preview');
          
          let dependencies;
          try {
            // Parse dependencies, removing comments
            const cleanJson = dependenciesStr.replace(/\\s*\\/\\/.*$/gm, '');
            dependencies = JSON.parse(cleanJson);
          } catch (error) {
            errorDiv.textContent = 'Invalid dependencies JSON: ' + error.message;
            return;
          }
          
          try {
            const response = await fetch('/bundle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, id, dependencies, bundler })
            });
            
            const result = await response.json();
            
            if (result.success) {
              preview.src = '/bundled-page?id=' + id;
              errorDiv.textContent = '';
            } else {
              errorDiv.textContent = result.details || result.error;
            }
          } catch (error) {
            errorDiv.textContent = 'Failed to bundle: ' + error.message;
          }
        }
      </script>
    </body>
  </html>
`

// Add a new function to get static files from R2
const getStaticFileFromR2 = async (
  filename: string,
): Promise<{ content: string; contentType: string } | null> => {
  try {
    const bucketName = "components-code"
    const key = `bundled/${filename}`

    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    )

    if (!response.Body) {
      return null
    }

    const content = await response.Body.transformToString()
    const contentType = filename.endsWith(".js")
      ? "application/javascript"
      : filename.endsWith(".css")
        ? "text/css"
        : "text/plain"

    return { content, contentType }
  } catch (error) {
    console.error("Error fetching static file from R2:", error)
    return null
  }
}

const server = serve({
  port: 80,
  async fetch(req) {
    const origin = req.headers.get("origin")
    const allowedOrigins = ["http://localhost:3000", "https://21st.dev"]
    const headers = {
      "Access-Control-Allow-Origin": allowedOrigins.includes(origin ?? "")
        ? (origin ?? "")
        : "",
      "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
      "Access-Control-Allow-Headers": "Content-Type",
    }

    if (req.method === "OPTIONS") {
      return new Response(null, { headers })
    }

    const url = new URL(req.url)

    if (url.pathname === "/" && req.method === "GET") {
      return new Response(editorHTML, {
        headers: {
          ...headers,
          "Content-Type": "text/html",
        },
      })
    }

    if (url.pathname === "/compile-css" && req.method === "POST") {
      try {
        const {
          code,
          demoCode,
          baseTailwindConfig,
          baseGlobalCss,
          customTailwindConfig,
          customGlobalCss,
          dependencies,
        } = await req.json()

        if (!code) {
          throw new Error("No code provided")
        }

        const filteredCode = code
          .split("\n")
          .filter((line: string) => !line.trim().startsWith("import"))
          .join("\n")

        const filteredDemoCode = demoCode
          .split("\n")
          .filter((line: string) => !line.trim().startsWith("import"))
          .join("\n")

        const filteredDependencies = dependencies.map((dep: string) =>
          dep
            .split("\n")
            .filter((line: string) => !line.trim().startsWith("import"))
            .join("\n"),
        )

        try {
          const css = await compileCSS({
            jsx: `${filteredCode}\n${filteredDemoCode}\n${filteredDependencies.join("\n")}`,
            baseTailwindConfig,
            customTailwindConfig,
            baseGlobalCss,
            customGlobalCss,
          })

          return Response.json({ css }, { headers })
        } catch (cssError) {
          console.error("CSS compilation error details:", {
            error: cssError,
            code: filteredCode.slice(0, 200) + "...", // First 200 chars for debugging
            demoCode: filteredDemoCode.slice(0, 200) + "...",
            customTailwindConfig: customTailwindConfig?.slice(0, 200) + "...",
            customGlobalCss: customGlobalCss?.slice(0, 200) + "...",
          })

          return Response.json(
            {
              error: "Failed to compile CSS",
              details:
                cssError instanceof Error ? cssError.message : String(cssError),
              code: "CSS_COMPILATION_ERROR",
            },
            { status: 500, headers },
          )
        }
      } catch (error) {
        console.error("Request processing error:", error)
        return Response.json(
          {
            error: "Failed to process request",
            details: error instanceof Error ? error.message : String(error),
            code: "REQUEST_PROCESSING_ERROR",
          },
          { status: 500, headers },
        )
      }
    }

    if (url.pathname === "/bundle" && req.method === "POST") {
      try {
        const {
          files,
          id,
          dependencies,
          baseTailwindConfig,
          baseGlobalCss,
          customTailwindConfig,
          customGlobalCss,
        } = await req.json()

        if (!files || !Object.keys(files).length) {
          throw new Error("No files provided")
        }

        if (!id) {
          throw new Error("No ID provided")
        }

        // Bundle React code with optional dependencies
        const { html } = await bundleReact({
          files,
          baseTailwindConfig,
          baseGlobalCss,
          customTailwindConfig,
          customGlobalCss,
          dependencies,
        })

        // Save the bundled files
        const { htmlUrl } = await saveBundledFilesToR2(id, {
          html: html ?? "",
        })

        const response: any = { success: true, id, html: htmlUrl }

        return Response.json(response, { headers })
      } catch (error) {
        console.error("Bundling error:", error)
        return Response.json(
          {
            error: "Failed to bundle code",
            details: error instanceof Error ? error.message : String(error),
            code: "BUNDLE_ERROR",
          },
          { status: 500, headers },
        )
      }
    }

    if (url.pathname === "/convert" && req.method === "POST") {
      try {
        console.log("Converting video")
        const formData = await req.formData()
        const file = formData.get("video") as File

        if (!file) {
          console.log("No video file found in request")
          return Response.json(
            { error: "No video file provided" },
            { status: 400, headers },
          )
        }

        const tempDir = path.join(os.tmpdir(), "video-conversions")
        await fs.mkdir(tempDir, { recursive: true })

        // Sanitize the filename
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")

        const tempInputPath = path.join(tempDir, sanitizedFilename)
        const tempOutputPath = path.join(
          tempDir,
          sanitizedFilename.replace(/\.[^/.]+$/, "") +
            `_converted_${Date.now()}.mp4`,
        )

        const bytes = await file.arrayBuffer()
        await fs.writeFile(tempInputPath, Buffer.from(bytes))

        await convertVideo(tempInputPath, tempOutputPath)

        const processedVideo = await fs.readFile(tempOutputPath)

        await Promise.all([fs.unlink(tempInputPath), fs.unlink(tempOutputPath)])

        // Encode the filename for the Content-Disposition header
        const encodedFilename = encodeURIComponent(
          path.basename(tempOutputPath),
        )

        console.log("successfuly converted video")

        return new Response(processedVideo, {
          headers: {
            ...headers,
            "Content-Type": "video/mp4",
            "Content-Disposition": `attachment; filename="${encodedFilename}"`,
          },
        })
      } catch (error) {
        console.error("Error processing video:", error)
        return Response.json(
          { error: "Error processing video" },
          { status: 500, headers },
        )
      }
    }

    if (url.pathname === "/bundled-page" && req.method === "GET") {
      try {
        const id = url.searchParams.get("id")
        if (!id) {
          throw new Error("No ID provided")
        }

        const html = await getBundledPageFromR2(id)
        if (!html) {
          throw new Error("Page not found")
        }

        return new Response(html, {
          headers: {
            ...headers,
            "Content-Type": "text/html",
          },
        })
      } catch (error) {
        console.error("Error fetching bundled page:", error)
        return Response.json(
          {
            error: "Failed to fetch bundled page",
            details: error instanceof Error ? error.message : String(error),
            code: "BUNDLED_PAGE_FETCH_ERROR",
          },
          { status: 500, headers },
        )
      }
    }

    // Update the static file serving route
    if (url.pathname.startsWith("/static/") && req.method === "GET") {
      try {
        const filename = url.pathname.replace("/static/", "")
        const file = await getStaticFileFromR2(filename)

        if (!file) {
          return new Response("Not Found", { status: 404, headers })
        }

        return new Response(file.content, {
          headers: {
            ...headers,
            "Content-Type": file.contentType,
          },
        })
      } catch (error) {
        return new Response("Not Found", { status: 404, headers })
      }
    }

    return new Response("Not Found", { status: 404, headers })
  },
})

console.log(`Server running at http://localhost:${server.port}`)
