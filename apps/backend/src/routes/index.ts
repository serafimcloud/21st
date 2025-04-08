import { compileCSS } from "../css-processor"
import { bundleReact } from "../bundler"
import {
  saveBundledFilesToR2,
  getBundledPageFromR2,
  getStaticFileFromR2,
} from "../r2"
import { handleVideoConversion } from "../video-converter"
import { editorHTML } from "../server/editor"

export const setupRoutes = (req: Request) => {
  const url = new URL(req.url)
  const origin = req.headers.get("origin")

  const staticAllowedOrigins = [
    "http://localhost:3000",
    "https://21st.dev",
    "https://mcp-logs-123.up.railway.app", // Temporary
  ]

  const isAllowedOrigin =
    origin && (staticAllowedOrigins.includes(origin) || isLocalDomain(origin))

  const headers = {
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers })
  }

  if (url.pathname === "/" && req.method === "GET") {
    return new Response(editorHTML, {
      headers: {
        ...headers,
        "Content-Type": "text/html",
      },
    })
  }

  if (url.pathname === "/compile-css" && req.method === "POST") {
    return handleCompileCss(req, headers)
  }

  if (url.pathname === "/bundle" && req.method === "POST") {
    return handleBundle(req, headers)
  }

  if (url.pathname === "/convert" && req.method === "POST") {
    return handleConvert(req, headers)
  }

  if (url.pathname === "/bundled-page" && req.method === "GET") {
    return handleBundledPage(url, headers)
  }

  if (url.pathname.startsWith("/static/") && req.method === "GET") {
    return handleStaticFile(url, headers)
  }

  return new Response("Not Found", { status: 404, headers })
}

async function handleCompileCss(req: Request, headers: Record<string, string>) {
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
      ? demoCode
          .split("\n")
          .filter((line: string) => !line.trim().startsWith("import"))
          .join("\n")
      : ""

    const filteredDependencies = dependencies
      ? dependencies.map((dep: string) =>
          dep
            .split("\n")
            .filter((line: string) => !line.trim().startsWith("import"))
            .join("\n"),
        )
      : []

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
        code: filteredCode.slice(0, 200) + "...",
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

async function handleBundle(req: Request, headers: Record<string, string>) {
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

    console.log("ID", id)

    if (!files || !Object.keys(files).length) {
      throw new Error("No files provided")
    }

    if (!id) {
      throw new Error("No ID provided")
    }

    const { html } = await bundleReact({
      files,
      baseTailwindConfig,
      baseGlobalCss,
      customTailwindConfig,
      customGlobalCss,
      dependencies,
    })

    const { htmlUrl } = await saveBundledFilesToR2(id, {
      html: html ?? "",
    })

    console.log("HTML URL", htmlUrl)
    console.log("REQUEST", req.headers)
    console.log("REQUEST2", JSON.stringify(req.body))

    return Response.json({ success: true, id, html: htmlUrl }, { headers })
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

async function handleConvert(req: Request, headers: Record<string, string>) {
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

    const { video, filename } = await handleVideoConversion(file)
    const encodedFilename = encodeURIComponent(filename)

    console.log("Successfully converted video")

    return new Response(video, {
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

async function handleBundledPage(url: URL, headers: Record<string, string>) {
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

async function handleStaticFile(url: URL, headers: Record<string, string>) {
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

function isLocalDomain(origin: string) {
  if (!origin) return false

  try {
    const url = new URL(origin)

    // Allow any localhost regardless of port
    if (url.hostname === "localhost") return true

    // Allow local IP addresses (192.168.x.x)
    if (url.hostname.startsWith("192.168.")) return true

    // Allow local IP addresses (127.0.0.x)
    if (url.hostname.startsWith("127.0.0.")) return true

    // Allow local hostname variations (*.local)
    if (url.hostname.endsWith(".local")) return true

    return false
  } catch {
    return false
  }
}
