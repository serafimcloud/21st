import { isComponentPaid } from "@/lib/api/server/bundle_purchases"
import { hasUserComponentAccess } from "@/lib/api/server/components"
import { extractCssVars } from "@/lib/parsers"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"
import { verifyJwtToken } from "@/lib/server/clerk"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { AnalyticsActivityType } from "@/types/global"
import { Tables } from "@/types/supabase"
import { NextRequest, NextResponse } from "next/server"
import { ComponentRegistryResponse } from "./types"

// registry:hooks in 21st.dev -> registry:hook in shadcn/ui
const getShadcnRegistrySlug = (registryName: string) => {
  if (registryName === "hooks") {
    return "registry:hook"
  }
  if (registryName === "blocks") {
    return "registry:block"
  }
  if (registryName === "icons") {
    return "registry:ui"
  }
  return `registry:${registryName}`
}

// --- New tailwind config parsers ---
// Tries to evaluate raw config string using Function constructor.
// Falls back to legacy regex-based implementation on failure.
const transformTailwindConfig = (raw: string): Record<string, any> => {
  try {
    const sanitized = raw.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "") // strip comments
    const match = sanitized.match(/module\.exports\s*=\s*({[\s\S]*})/)
    if (match?.[1]) {
      const module: { exports: any } = { exports: {} }
      // eslint-disable-next-line no-new-func
      new Function("module", "exports", `module.exports = ${match[1]}`)(
        module,
        module.exports,
      )
      const cfg = module.exports
      if (cfg && typeof cfg === "object") {
        if (cfg.theme?.extend) return { theme: { extend: cfg.theme.extend } }
        if (cfg.theme) return { theme: cfg.theme }
        return cfg
      }
    }
  } catch (_) {
    // ignore and fallback
  }
  return legacyTransformTailwindConfig(raw)
}

// Previous regex-based parser kept for fallback compatibility
const legacyTransformTailwindConfig = (
  tailwindConfig: string,
): Record<string, any> => {
  try {
    const configMatch = tailwindConfig.match(
      /module\.exports\s*=\s*({[\s\S]*})/,
    )
    if (!configMatch?.[1]) return {}

    const cleanConfig = configMatch[1]
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "")
      .replace(/(\w+):/g, '"$1":')
      .replace(/'/g, '"')

    const themeMatch = cleanConfig.match(/"theme"\s*:\s*({[^}]*(?:}[^}]*)*})/)
    if (!themeMatch?.[1]) return {}

    const extendMatch = themeMatch[1].match(
      /"extend"\s*:\s*({[^}]*(?:}[^}]*)*})[^}]*$/,
    )
    if (!extendMatch?.[1]) return {}

    let cleanThemeExtend = extendMatch[1]
      .replace(/\s+/g, " ")
      .replace(/,\s*,/g, ",")
      .replace(/,\s*}/g, "}")
      .replace(/}\s*,?\s*"plugins"[\s\S]*$/, "}")
      .replace(/}\s*}/g, "}")
      .replace(/}(?!}|$)/g, "},")
      .replace(/,+/g, ",")
      .replace(/`([^`]*)`/g, (_m, p1) => JSON.stringify(p1))
      .replace(/([{,]\s*)(?!")([a-zA-Z0-9-]+):/g, '$1"$2":')
      .replace(/,(\s*})/g, "$1")
      .trim()

    try {
      const parsed = JSON.parse(cleanThemeExtend)
      return { theme: { extend: parsed } }
    } catch {
      const simpleObject = {
        backgroundImage: {
          "grid-pattern":
            tailwindConfig.match(/['"]grid-pattern['"]:\s*`([^`]*)`/)?.[1] ||
            "",
          "grid-pattern-light":
            tailwindConfig.match(
              /['"]grid-pattern-light['"]:\s*`([^`]*)`/,
            )?.[1] || "",
        },
      }
      return { theme: { extend: simpleObject } }
    }
  } catch {
    return {}
  }
}

// Generate cssVars.theme and css definitions from Tailwind config object
const generateCssData = (
  tailwindObj: Record<string, any>,
): {
  cssVars?: { theme: Record<string, string> }
  css?: Record<string, any>
} => {
  if (!tailwindObj?.theme?.extend) return {}
  const { animation, keyframes } = tailwindObj.theme.extend
  const cssVarsTheme: Record<string, string> = {}
  const css: Record<string, any> = {}

  if (animation && typeof animation === "object") {
    Object.entries(animation).forEach(([name, value]) => {
      if (typeof value === "string") {
        cssVarsTheme[`animate-${name}`] = value
      }
    })
  }

  if (keyframes && typeof keyframes === "object") {
    Object.entries(keyframes).forEach(([name, frames]) => {
      css[`@keyframes ${name}`] = frames
    })
  }

  return {
    cssVars: Object.keys(cssVarsTheme).length
      ? { theme: cssVarsTheme }
      : undefined,
    css: Object.keys(css).length ? css : undefined,
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ username: string; component_slug: string }> },
) {
  const params = await props.params
  const { username, component_slug } = params
  console.log("🔍 Fetching component:", { username, component_slug })

  try {
    const apiKey = request.nextUrl.searchParams.get("api_key")

    console.log("📊 Executing Supabase query...")
    const { data: user, error: userError } = await supabaseWithAdminAccess
      .from("users")
      .select("*")
      .or(`username.eq.${username},display_username.eq.${username}`)
      .single()

    if (userError) {
      console.error("❌ User error:", userError)
      throw new Error(`Error fetching user: ${userError.message}`)
    }

    if (!user) {
      console.log("⚠️ User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { data: component, error } = await supabaseWithAdminAccess
      .from("components")
      .select("*, user:users!user_id(*)")
      .eq("component_slug", component_slug)
      .eq("user_id", user.id)
      .not("user", "is", null)
      .returns<(Tables<"components"> & { user: Tables<"users"> })[]>()
      .single()

    console.log("📋 Query result:", {
      hasData: !!component,
      error: error
        ? {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
        : null,
    })

    if (error) {
      console.error("❌ Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw new Error(`Error fetching component: ${error.message}`)
    }

    if (!component) {
      console.log("⚠️ Component not found")
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 },
      )
    }

    // Check payment status
    const isPaid = await isComponentPaid(component.id)
    if (isPaid) {
      if (!apiKey) {
        return NextResponse.json(
          { error: "No API key provided" },
          { status: 403 },
        )
      }

      let verifiedToken
      try {
        verifiedToken = await verifyJwtToken(apiKey)
      } catch (error) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 403 })
      }

      const hasPurchased = await hasUserComponentAccess(
        verifiedToken.sub,
        component.id,
      )
      if (!hasPurchased) {
        return NextResponse.json(
          { error: "Component not purchased" },
          { status: 403 },
        )
      }
    }

    const userAgent = request.headers.get("user-agent") || ""
    const isPackageManager = /node-fetch|npm|yarn|pnpm|bun/i.test(userAgent)

    if (isPackageManager) {
      // This should finish reliably in serverless even without await
      // because we are using Vercel In-Function Concurrency
      // TODO: test this
      supabaseWithAdminAccess
        .from("components")
        .update({ downloads_count: component.downloads_count + 1 })
        .eq("id", component.id)
        .then(({ error }) => {
          if (error) {
            console.error("Error incrementing downloads count:", error)
          } else {
            console.log("Downloads count incremented")
          }
        })

      supabaseWithAdminAccess
        .from("component_analytics")
        .insert({
          component_id: component.id,
          activity_type: AnalyticsActivityType.COMPONENT_CLI_DOWNLOAD,
          created_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) {
            console.error("Error capturing analytics:", error)
          } else {
            console.log("Analytics captured")
          }
        })
    }

    // Early return for components backed by new flow
    if (component.sandbox_id && component.registry_url) {
      try {
        const registryRes = await fetch(component.registry_url)
        if (registryRes.ok) {
          const registryJson = await registryRes.json()
          return NextResponse.json(registryJson)
        }
      } catch (fetchErr) {
        console.error("Failed to fetch registry_url content:", fetchErr)
      }
      // If fetch fails we continue with local fallback implementation
    }

    const dependencies = component.dependencies as Record<string, string>

    const resolvedRegistryDependencies = await resolveRegistryDependencyTree({
      supabase: supabaseWithAdminAccess,
      sourceDependencySlugs: [`${component.user.username}/${component_slug}`],
      withDemoDependencies: false,
    })

    const registryDependencies = (
      component.direct_registry_dependencies as string[]
    ).map((fullSlug) => {
      return `https://21st.dev/r/${fullSlug}`
    })

    console.log("Resolved registry dependencies:", resolvedRegistryDependencies)

    if (resolvedRegistryDependencies.error) {
      throw resolvedRegistryDependencies.error
    }

    const files = Object.entries(
      resolvedRegistryDependencies.data.filesWithRegistry,
    ).map(([path, { code, registry }]) => ({
      path,
      content: code,
      type: getShadcnRegistrySlug(registry),
      target: "",
    }))

    const npmDependencies = Array.from(
      new Set([
        ...Object.keys(dependencies),
        ...Object.keys(resolvedRegistryDependencies.data.npmDependencies),
      ]),
    )

    const cssPromises = [
      component.tailwind_config_extension
        ? fetch(component.tailwind_config_extension).then((res) => res.text())
        : Promise.resolve(null),
      component.global_css_extension
        ? fetch(component.global_css_extension).then((res) => res.text())
        : Promise.resolve(null),
    ]

    const [tailwindConfig, globalCss] = await Promise.all(cssPromises)

    console.log("tailwindConfig", tailwindConfig)
    // console.log("globalCss", globalCss)

    const cssVarsGlobal = globalCss ? extractCssVars(globalCss) : null

    const tailwindConfigObject = tailwindConfig
      ? transformTailwindConfig(tailwindConfig)
      : {}

    const { cssVars: cssVarsTheme, css } = generateCssData(tailwindConfigObject)

    const mergedCssVars = (() => {
      if (!cssVarsGlobal && !cssVarsTheme) return undefined
      const base: any = cssVarsGlobal ? { ...cssVarsGlobal } : {}
      if (cssVarsTheme) {
        base.theme = { ...(base.theme || {}), ...cssVarsTheme.theme }
      }
      return base
    })()

    const responseData: ComponentRegistryResponse = {
      name: component_slug,
      type: getShadcnRegistrySlug(component.registry),
      dependencies: npmDependencies.length > 0 ? npmDependencies : undefined,
      registryDependencies,
      files,
      ...(mergedCssVars ? { cssVars: mergedCssVars } : {}),
      ...(css ? { css } : {}),
      ...(tailwindConfigObject
        ? { tailwind: { config: tailwindConfigObject as any } }
        : {}),
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Unexpected error:", error)
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
