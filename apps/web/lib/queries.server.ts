import { Database, Tables } from "@/types/supabase"
import { SupabaseClient } from "@supabase/supabase-js"

export async function resolveRegistryDependencyTree({
  supabase,
  sourceDependencySlugs,
  withDemoDependencies,
  withStyles = false,
}: {
  supabase: SupabaseClient<Database>
  sourceDependencySlugs: string[]
  withDemoDependencies: boolean
  withStyles?: boolean
}): Promise<
  | {
      data: {
        filesWithRegistry: Record<string, { code: string; registry: string }>
        npmDependencies: Record<string, string>
        styles?: {
          tailwindConfig?: string
          globalCss?: string
        }
      }
      error: null
    }
  | { data: null; error: Error }
> {
  const filterConditions = sourceDependencySlugs
    .map((slug) => {
      const [username, componentSlug] = slug.split("/")
      const baseAndCondition = (extra: string) =>
        `or(and(source_author_username.eq."${username}",source_component_slug.eq."${componentSlug}"${extra}),and(source_author_display_username.eq."${username}",source_component_slug.eq."${componentSlug}"${extra}))`
      return withDemoDependencies
        ? baseAndCondition("")
        : baseAndCondition(",or(is_demo_dependency.is.false,depth.eq.0)")
    })
    .join(",")
  const { data: dependencies, error } = await supabase
    .from("component_dependencies_graph_view_v3")
    .select("*")
    .or(filterConditions)
    .returns<
      (Partial<Tables<"components">> & {
        dependency_author_username: string
        source_component_slug: string
        source_author_username: string
        tailwind_config_extension: string | null
        global_css_extension: string | null
      })[]
    >()

  if (error)
    return {
      data: null,
      error: new Error(
        `Failed to fetch registry dependency tree: ${error.message}`,
      ),
    }

  const r2FetchPromises = dependencies.map(async (dep) => {
    const {
      code: r2Link,
      component_slug,
      dependency_author_username: username,
      registry,
      dependencies: npmDependencies,
      tailwind_config_extension,
      global_css_extension,
    } = dep

    const response = await fetch(r2Link!)
    if (!response.ok) {
      console.error(
        `Error downloading file for ${username}/${component_slug}:`,
        response.statusText,
        r2Link,
      )
      return {
        error: new Error(
          `Error downloading file for ${username}/${component_slug}: ${response.statusText}`,
        ),
        npmDependencies: npmDependencies,
        fileWithRegistry: null,
        styles: null,
      }
    }

    const code = await response.text()
    if (!code) {
      console.error(
        `Error loading dependency ${username}/${component_slug}: No code returned`,
      )
      return {
        error: new Error(
          `Error loading dependency ${username}/${component_slug}: no code returned`,
        ),
        npmDependencies: npmDependencies,
        fileWithRegistry: null,
        styles: null,
      }
    }

    // Fetch styles if requested and available
    let styles = null
    if (withStyles) {
      const stylesPromises = []
      if (tailwind_config_extension) {
        stylesPromises.push(fetch(tailwind_config_extension))
      }
      if (global_css_extension) {
        stylesPromises.push(fetch(global_css_extension))
      }

      if (stylesPromises.length > 0) {
        const responses = await Promise.all(stylesPromises)
        const texts = await Promise.all(responses.map((r) => r.text()))

        styles = {
          tailwindConfig: tailwind_config_extension ? texts[0] : undefined,
          globalCss: global_css_extension ? texts[texts.length - 1] : undefined,
        }
      }
    }

    // Determine the file path based on registry
    let fileWithRegistry = {}
    if (registry === "lib") {
      fileWithRegistry = {
        [`/lib/${component_slug}.tsx`]: { code, registry: registry! },
      }
    } else if (registry === "hooks") {
      // For hooks, add files in both locations
      fileWithRegistry = {
        [`/components/hooks/${component_slug}.tsx`]: {
          code,
          registry: registry!,
        },
        [`/hooks/${component_slug}.tsx`]: { code, registry: registry! },
      }
    } else {
      fileWithRegistry = {
        [`/components/${registry}/${component_slug}.tsx`]: {
          code,
          registry: registry!,
        },
      }
    }

    return {
      error: null,
      npmDependencies: npmDependencies,
      fileWithRegistry,
      styles,
    }
  })

  const results = await Promise.all(r2FetchPromises)

  const errors = results.filter((result) => result.error)
  if (errors.length > 0) {
    return {
      data: null,
      error: new Error(
        `Error loading registry dependencies: ${errors[0]?.error?.message.toLowerCase()}`,
      ),
    }
  }

  const npmDependencies = Object.assign(
    {},
    ...results.map((r) => r.npmDependencies),
  )
  const filesWithRegistry = Object.assign(
    {},
    ...results.map((r) => r.fileWithRegistry).filter(Boolean),
  )
  const styles = results.find((r) => r.styles)?.styles

  return {
    data: {
      filesWithRegistry,
      npmDependencies,
      ...(styles && { styles }),
    },
    error: null,
  }
}
