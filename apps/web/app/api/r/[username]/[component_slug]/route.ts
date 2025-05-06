import { supabaseWithAdminAccess } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"
import { ComponentRegistryResponse } from "./types"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"
import { Tables } from "@/types/supabase"
import { extractCssVars } from "@/lib/parsers"
import { AnalyticsActivityType } from "@/types/global"

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

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ username: string; component_slug: string }> },
) {
  const params = await props.params
  const { username, component_slug } = params
  console.log("🔍 Fetching component:", { username, component_slug })

  try {
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

    const dependencies = component.dependencies as Record<string, string>

    const resolvedRegistryDependencies = await resolveRegistryDependencyTree({
      supabase: supabaseWithAdminAccess,
      sourceDependencySlugs: [`${component.user.username}/${component_slug}`],
      withDemoDependencies: false,
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

    const cssVars = globalCss ? extractCssVars(globalCss) : null

    const tailwindConfigObject = tailwindConfig
      ? (() => {
          try {
            // First get the whole config object
            const configMatch = tailwindConfig.match(
              /module\.exports\s*=\s*({[\s\S]*})/,
            )
            if (!configMatch?.[1]) {
              return {}
            }

            // First clean up the config string
            const cleanConfig = configMatch[1]
              .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "") // Remove comments
              .replace(/(\w+):/g, '"$1":') // Add quotes to keys
              .replace(/'/g, '"') // Normalize quotes

            // First find the theme object
            const themeMatch = cleanConfig.match(
              /"theme"\s*:\s*({[^}]*(?:}[^}]*)*})/,
            )
            if (!themeMatch?.[1]) {
              return {}
            }

            // Then find the extend object within theme
            const extendMatch = themeMatch[1].match(
              /"extend"\s*:\s*({[^}]*(?:}[^}]*)*})[^}]*$/,
            )
            if (!extendMatch?.[1]) {
              return {}
            }

            let cleanThemeExtend = extendMatch[1]
              .replace(/\s+/g, " ") // Normalize whitespace
              .replace(/,\s*,/g, ",") // Remove double commas
              .replace(/,\s*}/g, "}") // Remove trailing commas before closing braces
              .replace(/}\s*,?\s*"plugins"[\s\S]*$/, "}") // Remove everything after the extend object
              .replace(/}\s*}/g, "}") // Remove whitespace between closing braces
              .replace(/}(?!}|$)/g, "},") // Add commas between objects where missing
              .replace(/,+/g, ",") // Remove any remaining multiple commas
              // Handle template literals with data URLs
              .replace(/`([^`]*)`/g, function (match, p1) {
                return JSON.stringify(p1)
              })
              // Quote unquoted property names, but skip already quoted ones
              .replace(/([{,]\s*)(?!")([a-zA-Z0-9-]+):/g, '$1"$2":')
              // Remove any remaining trailing commas
              .replace(/,(\s*})/g, "$1")
              .trim()

            try {
              const parsed = JSON.parse(cleanThemeExtend)
              return { theme: { extend: parsed } }
            } catch (error) {
              // If parsing fails, try a simpler approach
              const simpleObject = {
                backgroundImage: {
                  "grid-pattern":
                    tailwindConfig.match(
                      /['"]grid-pattern['"]:\s*`([^`]*)`/,
                    )?.[1] || "",
                  "grid-pattern-light":
                    tailwindConfig.match(
                      /['"]grid-pattern-light['"]:\s*`([^`]*)`/,
                    )?.[1] || "",
                },
              }
              return { theme: { extend: simpleObject } }
            }
          } catch (error) {
            throw error
          }
        })()
      : {}

    const responseData: ComponentRegistryResponse = {
      name: component_slug,
      type: getShadcnRegistrySlug(component.registry),
      dependencies: npmDependencies.length > 0 ? npmDependencies : undefined,
      files,
      ...(cssVars ? { cssVars } : {}),
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
