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

// Setup storage directory for bundled files
const STORAGE_DIR = path.join(process.cwd(), "bundled-pages")

// Ensure storage directory exists
await fs.mkdir(STORAGE_DIR, { recursive: true })

// R2 client config for external integrations (new)
interface R2Credentials {
  accessKeyId: string
  secretAccessKey: string
  endpoint: string
  cdnUrl: string
}

const isValidId = (id: string) => {
  // Only allow alphanumeric characters, hyphens, and underscores
  return /^[a-zA-Z0-9-_]+$/.test(id)
}

// New function to save bundled files to R2
const saveBundledFilesToR2 = async (
  componentSlug: string,
  demoSlug: string,
  { js, css, html }: { js: string; css: string; html: string },
  r2Credentials: R2Credentials,
): Promise<{ jsUrl: string; cssUrl: string; htmlUrl: string }> => {
  try {
    // Create S3 client for R2
    const r2Client = new (await import("@aws-sdk/client-s3")).S3Client({
      region: "auto",
      endpoint: r2Credentials.endpoint,
      credentials: {
        accessKeyId: r2Credentials.accessKeyId,
        secretAccessKey: r2Credentials.secretAccessKey,
      },
    })

    // Create folder path using component and demo slugs
    const folderPath = `${componentSlug}/${demoSlug}/bundle`

    // Upload files
    const [jsUpload, cssUpload, htmlUpload] = await Promise.all([
      // Upload JS
      r2Client.send(
        new (await import("@aws-sdk/client-s3")).PutObjectCommand({
          Bucket: "components-code", // Using the same bucket as for other assets
          Key: `${folderPath}/bundle.js`,
          Body: js,
          ContentType: "text/javascript",
        }),
      ),
      // Upload CSS
      r2Client.send(
        new (await import("@aws-sdk/client-s3")).PutObjectCommand({
          Bucket: "components-code",
          Key: `${folderPath}/bundle.css`,
          Body: css,
          ContentType: "text/css",
        }),
      ),
      // Upload HTML
      r2Client.send(
        new (await import("@aws-sdk/client-s3")).PutObjectCommand({
          Bucket: "components-code",
          Key: `${folderPath}/index.html`,
          Body: html,
          ContentType: "text/html",
        }),
      ),
    ])

    // Return CDN URLs for the files
    return {
      jsUrl: `${r2Credentials.cdnUrl}/${folderPath}/bundle.js`,
      cssUrl: `${r2Credentials.cdnUrl}/${folderPath}/bundle.css`,
      htmlUrl: `${r2Credentials.cdnUrl}/${folderPath}/index.html`,
    }
  } catch (error) {
    console.error("Error uploading to R2:", error)
    throw error
  }
}

const saveBundledFiles = async (
  id: string,
  { js, css }: { js: string; css: string },
): Promise<void> => {
  if (!isValidId(id)) {
    throw new Error(
      "Invalid ID format. Only alphanumeric characters, hyphens, and underscores are allowed.",
    )
  }

  const htmlFilePath = path.join(STORAGE_DIR, `${id}.html`)
  const jsFilePath = path.join(STORAGE_DIR, `${id}.js`)
  const cssFilePath = path.join(STORAGE_DIR, `${id}.css`)

  // Check if files already exist
  try {
    await fs.access(htmlFilePath)
    // if the file exists, delete all the files
    await fs.unlink(htmlFilePath)
    await fs.unlink(jsFilePath)
    await fs.unlink(cssFilePath)
  } catch (error) {
    // Files don't exist, we can proceed
    if ((error as any).code === "ENOENT") {
      const html = generateHTML({ id })
      await Promise.all([
        fs.writeFile(htmlFilePath, html),
        fs.writeFile(jsFilePath, js),
        fs.writeFile(cssFilePath, css),
      ])
    } else {
      throw error
    }
  }
}

const getBundledPage = async (id: string): Promise<string | null> => {
  if (!isValidId(id)) {
    return null
  }

  try {
    const htmlFilePath = path.join(STORAGE_DIR, `${id}.html`)
    // Validate the file is within STORAGE_DIR to prevent directory traversal
    if (!htmlFilePath.startsWith(STORAGE_DIR)) {
      return null
    }
    const html = await fs.readFile(htmlFilePath, "utf-8")
    return html
  } catch (error) {
    return null
  }
}

const generateHTML = ({
  id,
  jsUrl,
  cssUrl,
}: {
  id: string
  jsUrl?: string
  cssUrl?: string
}) => endent`
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>React + Tailwind App</title>
      <link rel="stylesheet" href="${cssUrl || `/static/${id}.css`}">
    </head>
    <body>
      <div id="root"></div>
      <script type="text/javascript" src="${jsUrl || `/static/${id}.js`}"></script>
    </body>
  </html>
`

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
  code: string
  dependencies?: Record<string, string> // package name -> version
  uiComponentFiles?: Record<string, string> // path -> content
  aliases?: Record<string, string> // alias -> target path
}

const createTempProject = async (options: BundleOptions) => {
  const tempDir = path.join(".", `react-bundle-${Date.now()}`)
  await fs.mkdir(tempDir, { recursive: true })

  try {
    // Write package.json with dependencies
    const packageJson = {
      name: "react-bundle",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0",
        "framer-motion": "^10.16.4",
        ...(options.dependencies || {}),
      },
      devDependencies: {
        typescript: "^5.0.4",
        "@types/react": "^18.2.0",
        "@types/react-dom": "^18.2.0",
      },
    }

    await fs.writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify(packageJson, null, 2),
    )
    console.log(
      `[createTempProject] Created package.json with dependencies: ${Object.keys(packageJson.dependencies).join(", ")}`,
    )

    // Write the App component file
    await fs.writeFile(path.join(tempDir, "App.tsx"), options.code)
    console.log(
      `[createTempProject] Created App.tsx file at ${path.join(tempDir, "App.tsx")}`,
    )

    // Проверим, что файл был создан
    try {
      const appContent = await fs.readFile(
        path.join(tempDir, "App.tsx"),
        "utf-8",
      )
      console.log(
        `[createTempProject] App.tsx content length: ${appContent.length} bytes`,
      )
    } catch (error) {
      console.error(`[createTempProject] Failed to read App.tsx:`, error)
    }

    // Create UI components directory if needed
    if (
      options.uiComponentFiles &&
      Object.keys(options.uiComponentFiles).length > 0
    ) {
      // Create components directory structure
      await fs.mkdir(path.join(tempDir, "components", "ui"), {
        recursive: true,
      })

      // Write UI component files
      for (const [filePath, content] of Object.entries(
        options.uiComponentFiles,
      )) {
        // Create nested directories if they exist in the path
        const fullPath = path.join(tempDir, filePath)
        const dir = path.dirname(fullPath)

        console.log(
          `[createTempProject] Creating UI component: ${filePath} -> ${fullPath}`,
        )

        await fs.mkdir(dir, { recursive: true })

        // Write component file
        await fs.writeFile(fullPath, content)
        console.log(
          `[createTempProject] UI component file written: ${fullPath}`,
        )
      }
    }

    // Write the entry file with aliases for components
    await fs.writeFile(
      path.join(tempDir, "index.js"),
      endent`
        import React from "react";
        import { createRoot } from "react-dom/client";
        import App from "./App";

        // Убедимся что элемент root существует
        document.body.innerHTML = '<div id="root"></div>';
        const rootElement = document.getElementById("root");
        
        // Создаем корень React
        const root = createRoot(rootElement);

        // Рендерим приложение
        root.render(
          <React.StrictMode>
            <App />
          </React.StrictMode>
        );
      `,
    )
    console.log(`[createTempProject] Created index.js file`)

    // Write tsconfig.json with paths for @ alias
    await fs.writeFile(
      path.join(tempDir, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            jsx: "react-jsx",
            paths: {
              "@/*": ["./*"],
            },
            baseUrl: ".",
          },
        },
        null,
        2,
      ),
    )

    // Install dependencies
    console.log("Installing dependencies with pnpm...")

    // Проверяем сначала, есть ли pnpm
    try {
      const pnpmVersion = Bun.spawn(["pnpm", "--version"], {
        stdout: "pipe",
      })
      const stdout = await new Response(pnpmVersion.stdout).text()
      console.log(`[createTempProject] Using pnpm version: ${stdout.trim()}`)
    } catch (error) {
      console.error(
        `[createTempProject] pnpm not found, trying to install with npm...`,
      )
      // Если pnpm нет, установим его с помощью npm
      const npmInstall = Bun.spawn(["npm", "install", "-g", "pnpm"])
      await npmInstall.exited
    }

    // Устанавливаем зависимости с помощью pnpm
    const install = Bun.spawn(["pnpm", "install", "--no-frozen-lockfile"], {
      cwd: tempDir,
      stdout: "pipe",
      stderr: "pipe",
    })

    const stderr = await new Response(install.stderr).text()
    const exitCode = await install.exited

    console.log(`[createTempProject] pnpm install stderr: ${stderr}`)
    console.log(`[createTempProject] pnpm install exit code: ${exitCode}`)

    // Проверяем, что node_modules создана и что основные пакеты установлены
    try {
      const nodeModulesExists = await fs
        .stat(path.join(tempDir, "node_modules"))
        .then(
          (stat) => stat.isDirectory(),
          () => false,
        )

      console.log(
        `[createTempProject] node_modules exists: ${nodeModulesExists}`,
      )

      if (nodeModulesExists) {
        // Проверяем что есть основные пакеты
        const reactExists = await fs
          .stat(path.join(tempDir, "node_modules/react"))
          .then(
            (stat) => stat.isDirectory(),
            () => false,
          )
        const reactDomExists = await fs
          .stat(path.join(tempDir, "node_modules/react-dom"))
          .then(
            (stat) => stat.isDirectory(),
            () => false,
          )

        console.log(`[createTempProject] react package exists: ${reactExists}`)
        console.log(
          `[createTempProject] react-dom package exists: ${reactDomExists}`,
        )
      }
    } catch (error) {
      console.error(`[createTempProject] Error checking node_modules:`, error)
    }

    if (exitCode !== 0) {
      throw new Error(`Failed to install dependencies: ${stderr}`)
    }

    return tempDir
  } catch (error) {
    // Clean up on error
    await fs.rm(tempDir, { recursive: true, force: true })
    throw error
  }
}

const bundleReact = async (
  code: string,
  dependencies?: Record<string, string>,
  uiComponentFiles?: Record<string, string>,
) => {
  let tempDir: string | null = null

  try {
    console.log("Starting bundling process...")

    // Логируем зависимости для отладки
    console.log("Dependencies:", dependencies)

    // Логируем UI компоненты для отладки
    console.log(
      `UI Components count: ${Object.keys(uiComponentFiles || {}).length}`,
    )
    if (uiComponentFiles) {
      console.log("UI Component paths:", Object.keys(uiComponentFiles))
    }

    tempDir = await createTempProject({
      code,
      dependencies,
      uiComponentFiles,
    })
    console.log("Temp project created at:", tempDir)

    const outDir = path.join(tempDir, "dist")

    // Bundle the code
    console.log("Running Bun.build...")
    const result = await Bun.build({
      entrypoints: [path.join(tempDir, "index.js")],
      target: "browser",
      minify: true,
      root: tempDir,
      outdir: outDir,
      loader: {
        ".tsx": "tsx",
        ".ts": "ts",
        ".jsx": "jsx",
        ".js": "js",
      },
      sourcemap: "external",
      // Указываем внешние модули как пакеты npm
      external: ["react", "react-dom", "framer-motion"],
      // Определяем правильные пути для разрешения
      define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
      plugins: [
        {
          name: "alias-resolver",
          setup(build) {
            // Handle @ alias
            build.onResolve({ filter: /^@\// }, (args) => {
              const resolvedPath = args.path.replace(/^@\//, "")
              // Убедимся, что tempDir не null
              if (tempDir) {
                console.log(
                  `[alias-resolver] Resolving @/ alias: ${args.path} -> ${path.join(tempDir, resolvedPath)}`,
                )
                return {
                  path: path.join(tempDir, resolvedPath),
                  namespace: "file",
                }
              }
              return undefined
            })

            // Handle React modules
            build.onResolve(
              { filter: /^react$|^react\/|^react-dom\/|^react-dom$/ },
              (args) => {
                console.log(
                  `[alias-resolver] Resolving React module: ${args.path}`,
                )
                return {
                  path: args.path,
                  external: true,
                }
              },
            )

            // Handle motion/react -> framer-motion alias
            build.onResolve({ filter: /^motion\/react$/ }, (args) => {
              console.log(
                `[alias-resolver] Resolving motion/react -> framer-motion`,
              )
              return {
                path: "framer-motion",
                external: true,
              }
            })

            // Обработка путей в namespace "file"
            build.onResolve({ filter: /.*/, namespace: "file" }, (args) => {
              // Если путь не абсолютный, сделаем его абсолютным
              if (!path.isAbsolute(args.path)) {
                const absPath = path.resolve(
                  path.dirname(args.importer),
                  args.path,
                )
                console.log(
                  `[alias-resolver] Converting relative path to absolute: ${args.path} -> ${absPath}`,
                )
                return {
                  path: absPath,
                  namespace: "file",
                }
              }
              return undefined
            })
          },
        },
      ],
    })

    // Проверяем результат сборки
    if (!result.success) {
      console.error("Bundle failed. Logs:")

      // Подробно логируем каждую ошибку
      for (const log of result.logs) {
        console.error(`- ${log}`)
      }

      // Проверяем существование входных файлов
      try {
        const indexExists = await fs.stat(path.join(tempDir, "index.js")).then(
          () => true,
          () => false,
        )
        const appExists = await fs.stat(path.join(tempDir, "App.tsx")).then(
          () => true,
          () => false,
        )

        console.error(`Index.js exists: ${indexExists}`)
        console.error(`App.tsx exists: ${appExists}`)

        // Посмотрим, что за файлы в директории
        const tempDirFiles = await fs.readdir(tempDir)
        console.error(`Files in temp dir: ${tempDirFiles.join(", ")}`)

        // Проверим node_modules
        const nodeModulesExists = await fs
          .stat(path.join(tempDir, "node_modules"))
          .then(
            () => true,
            () => false,
          )

        if (nodeModulesExists) {
          const nodeModulesFiles = await fs.readdir(
            path.join(tempDir, "node_modules"),
          )
          console.error(`Files in node_modules: ${nodeModulesFiles.join(", ")}`)
        }
      } catch (error) {
        console.error("Error checking files:", error)
      }

      throw new Error("Bundle failed: " + result.logs.join("\n"))
    }

    // Read the bundled file
    console.log("Reading bundled file...")
    const bundledJs = await fs.readFile(path.join(outDir, "index.js"), "utf-8")
    console.log("Bundling completed successfully!")
    return bundledJs
  } catch (error) {
    console.error("Error in bundleReact:", error)
    throw error
  } finally {
    // Clean up temp directory
    if (tempDir) {
      console.log("Cleaning up temp directory:", tempDir)
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
        input[type="text"] {
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="editor-container">
          <div class="form-group">
            <label for="id">Page ID:</label>
            <input type="text" id="id" placeholder="Enter a unique ID (alphanumeric, hyphens, underscores)">
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
              body: JSON.stringify({ code, id, dependencies })
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
        const { code, id, baseTailwindConfig, dependencies } = await req.json()

        if (!code) {
          throw new Error("No code provided")
        }

        if (!id) {
          throw new Error("No ID provided")
        }

        // Bundle React code with optional dependencies
        const bundledJs = await bundleReact(code, dependencies)

        // Compile CSS
        const css = await compileCSS({
          jsx: code,
          baseTailwindConfig:
            baseTailwindConfig ||
            `
            module.exports = {
              content: ["./src/**/*.{js,ts,jsx,tsx}"],
              theme: {
                extend: {},
              },
              plugins: [],
            }
          `,
          baseGlobalCss: `
            @tailwind base;
            @tailwind components;
            @tailwind utilities;
          `,
        })

        // Save the bundled files
        await saveBundledFiles(id, { js: bundledJs, css })
        return Response.json({ success: true, id }, { headers })
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

        const html = await getBundledPage(id)
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

    if (url.pathname === "/bundle-demo" && req.method === "POST") {
      try {
        const {
          code,
          demoCode,
          componentSlug,
          demoSlug,
          dependencies,
          demoDependencies,
          baseTailwindConfig,
          globalCss,
          uiComponents = {}, // New parameter to pass UI components
        } = await req.json()

        if (!code || !demoCode) {
          throw new Error("Component code and demo code are required")
        }

        if (!componentSlug || !demoSlug) {
          throw new Error("Component slug and demo slug are required")
        }

        // Bundle React code with dependencies and UI components
        const bundledJs = await bundleReact(
          // Combine component code and demo code
          demoCode,
          { ...dependencies, ...demoDependencies },
          uiComponents, // Pass UI components
        )

        // Compile CSS
        const css = await compileCSS({
          jsx: code + "\n" + demoCode,
          baseTailwindConfig:
            baseTailwindConfig ||
            `
            module.exports = {
              content: ["./src/**/*.{js,ts,jsx,tsx}"],
              theme: {
                extend: {},
              },
              plugins: [],
            }
          `,
          baseGlobalCss:
            globalCss ||
            `
            @tailwind base;
            @tailwind components;
            @tailwind utilities;
          `,
        })

        // Check if R2 credentials are provided
        if (
          process.env.R2_ACCESS_KEY_ID &&
          process.env.R2_SECRET_ACCESS_KEY &&
          process.env.R2_ENDPOINT &&
          process.env.NEXT_PUBLIC_CDN_URL
        ) {
          // Generate HTML with the bundled files
          const html = generateHTML({
            id: demoSlug,
            jsUrl: "", // Will be replaced with actual URLs later
            cssUrl: "",
          })

          // Save the bundled files to R2
          const r2Credentials: R2Credentials = {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            endpoint: process.env.R2_ENDPOINT,
            cdnUrl: process.env.NEXT_PUBLIC_CDN_URL,
          }

          const urls = await saveBundledFilesToR2(
            componentSlug,
            demoSlug,
            { js: bundledJs, css, html },
            r2Credentials,
          )

          return Response.json(
            {
              success: true,
              urls,
              bundleReady: true,
            },
            { headers },
          )
        } else {
          console.warn(
            "R2 credentials not provided, using local storage instead",
          )
          // Save the bundled files locally if R2 is not configured
          await saveBundledFiles(demoSlug, { js: bundledJs, css })

          return Response.json(
            {
              success: true,
              urls: {
                jsUrl: `/static/${demoSlug}.js`,
                cssUrl: `/static/${demoSlug}.css`,
                htmlUrl: `/bundled-page?id=${demoSlug}`,
              },
              bundleReady: true,
            },
            { headers },
          )
        }
      } catch (error) {
        console.error("Bundling error:", error)
        return Response.json(
          {
            error: "Failed to bundle demo",
            details: error instanceof Error ? error.message : String(error),
            code: "BUNDLE_DEMO_ERROR",
          },
          { status: 500, headers },
        )
      }
    }

    // Add a new route to serve static files
    if (url.pathname.startsWith("/static/") && req.method === "GET") {
      try {
        const filename = url.pathname.replace("/static/", "")
        const filePath = path.join(STORAGE_DIR, filename)

        // Validate the file is within STORAGE_DIR to prevent directory traversal
        if (!filePath.startsWith(STORAGE_DIR)) {
          return new Response("Not Found", { status: 404, headers })
        }

        const file = await fs.readFile(filePath)
        const contentType = filename.endsWith(".js")
          ? "application/javascript"
          : filename.endsWith(".css")
            ? "text/css"
            : "text/plain"

        return new Response(file, {
          headers: {
            ...headers,
            "Content-Type": contentType,
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
