import { supabaseWithAdminAccess } from "@/lib/supabase"

export interface ResolvedComponent {
  fullSlug: string
  componentSlug: string
  author: string
  code: string | null
  globalCss: string | null
  tailwindConfig: string | null
  registryDependencies: string[]
  registryDependenciesTree: Record<string, ResolvedComponent | null>
  dependencies: Record<string, string>
}

/**
 * Resolves registry dependencies recursively by fullSlug (author/component-slug format)
 * Fetches component code, styles, configuration, and builds a dependency tree
 * @param registryDependenciesSlugs The component's full slug in author/component-slug format
 * @param maxDepth Maximum recursion depth to prevent stack overflow
 * @param currentDepth Current recursion depth
 * @param visitedSlugs Set of already visited component slugs to prevent circular dependencies
 */
export async function resolveRegistryDependenciesV2(
  registryDependenciesSlugs: string[],
  options: {
    shouldFetchR2Assets?: boolean
    maxDepth?: number
    currentDepth?: number
    visitedSlugs?: Set<string>
  } = {},
): Promise<Record<string, ResolvedComponent>> {
  console.log("registryDependenciesSlugs", registryDependenciesSlugs)
  const result: Record<string, ResolvedComponent> = {}
  const {
    maxDepth = 10,
    currentDepth = 0,
    visitedSlugs = new Set<string>(),
  } = options

  for (const fullSlug of registryDependenciesSlugs) {
    if (result[fullSlug]) continue

    if (visitedSlugs.has(fullSlug)) {
      console.warn("Circular dependency detected:", fullSlug)
      continue
    }

    if (currentDepth >= maxDepth) {
      console.warn("Maximum dependency depth reached for:", fullSlug)
      continue
    }

    visitedSlugs.add(fullSlug)

    const parts = fullSlug.split("/")
    if (parts.length !== 2) {
      console.error("Invalid authorSlug format:", fullSlug)
      continue
    }
    const [author, componentSlug] = parts

    if (!author || !componentSlug) {
      console.error("Author or componentSlug is missing after split:", fullSlug)
      continue
    }

    const { data: user, error: userError } = await supabaseWithAdminAccess
      .from("users")
      .select("id")
      .eq("username", author)
      .single()

    if (userError || !user?.id) {
      console.error(
        "Error fetching user or user not found:",
        userError?.message || "User not found",
      )
      continue
    }

    const { data: newComponent, error: componentError } =
      await supabaseWithAdminAccess
        .from("components")
        .select("*")
        .eq("user_id", user.id)
        .eq("component_slug", componentSlug)
        .single()

    if (componentError || !newComponent) {
      console.error(
        "Error fetching component or component not found:",
        componentError?.message || "Component not found",
      )
      continue
    }

    const codeUrl = newComponent.code
    const globalCssUrl = newComponent.global_css_extension
    const tailwindConfigUrl = newComponent.tailwind_config_extension

    const fetchR2Asset = async (url: string | null) => {
      if (!url) {
        return null
      }
      const response = await fetch(url)
      if (!response.ok) {
        console.error("Error fetching R2 asset:", response.statusText, url)
        return null
      }
      const code = await response.text()
      return code
    }

    const [code, globalCss, tailwindConfig] = await Promise.all([
      fetchR2Asset(codeUrl),
      fetchR2Asset(globalCssUrl),
      fetchR2Asset(tailwindConfigUrl),
    ])

    const dependenciesRaw = newComponent.dependencies
    let dependencies: Record<string, string> = {}
    if (typeof dependenciesRaw === "object" && dependenciesRaw !== null) {
      dependencies = dependenciesRaw as Record<string, string>
    } else if (typeof dependenciesRaw === "string") {
      try {
        dependencies = JSON.parse(dependenciesRaw)
      } catch (e) {
        console.error("Error parsing dependencies:", e)
      }
    }

    const registryDependenciesRaw = newComponent.direct_registry_dependencies
    let registryDependencies: string[] = []
    if (Array.isArray(registryDependenciesRaw)) {
      registryDependencies = registryDependenciesRaw as string[]
    } else if (typeof registryDependenciesRaw === "string") {
      try {
        const parsedJson = JSON.parse(registryDependenciesRaw)
        if (
          Array.isArray(parsedJson) &&
          parsedJson.every((item) => typeof item === "string")
        ) {
          registryDependencies = parsedJson as string[]
        } else {
          console.warn(
            "Parsed direct_registry_dependencies is not an array of strings or structure is unexpected.",
            parsedJson,
          )
          registryDependencies = parsedJson as string[]
        }
      } catch (e) {
        console.error(
          "Error parsing direct_registry_dependencies JSON string:",
          e,
        )
      }
    }

    const resolvedComponent: ResolvedComponent = {
      fullSlug,
      componentSlug,
      author,
      code,
      globalCss,
      tailwindConfig,
      dependencies,
      registryDependencies,
      registryDependenciesTree: {} as Record<string, ResolvedComponent | null>,
    }

    result[fullSlug] = resolvedComponent

    if (registryDependencies.length > 0) {
      const nestedDependencies = await resolveRegistryDependenciesV2(
        registryDependencies,
        {
          maxDepth,
          currentDepth: currentDepth + 1,
          visitedSlugs: new Set(visitedSlugs),
        },
      )

      for (const dependency of registryDependencies) {
        resolvedComponent.registryDependenciesTree[dependency] =
          nestedDependencies[dependency] || null
      }
    }
  }

  return result
}

/**
 * Transforms a nested component dependency tree into a flat structure
 * @param resolvedComponents - Either a single ResolvedComponent or a record of components
 * @param options - Configuration options
 * @param options.excludeRootComponent - Whether to exclude the root component from the result (default: true)
 * @returns A flat record of components indexed by their fullSlug
 */
export const transformToFlatDependencyTree = (
  resolvedComponents: Record<string, ResolvedComponent> | ResolvedComponent,
  options: { excludeRootComponent?: boolean } = {},
): Record<string, ResolvedComponent> => {
  const { excludeRootComponent = true } = options
  const flatDependencyTree: Record<string, ResolvedComponent> = {}

  console.log("RESOLVED COMPONENT", resolvedComponents)

  console.log("FLAT DEPENDENCY TREE v1", flatDependencyTree)

  /**
   * Recursively traverses the component tree and adds components to the flat structure
   * @param component - The component to process
   */
  function traverse(component: ResolvedComponent | null) {
    if (!component) {
      return
    }

    // If component is already in the tree, no need to process again.
    if (flatDependencyTree[component.fullSlug]) {
      return
    }

    // Add the current component to the flat dependency tree.
    flatDependencyTree[component.fullSlug] = component

    // Recursively traverse its direct dependencies.
    for (const dependencySlug in component.registryDependenciesTree) {
      const dependentComponent =
        component.registryDependenciesTree[dependencySlug] || null
      traverse(dependentComponent) // traverse will handle null and duplicate checks internally
    }
    console.log("FLAT DEPENDENCY TREE UPGRADE", flatDependencyTree)
  }

  // Handle both single component and record of components
  if (!resolvedComponents) {
    return flatDependencyTree
  }

  if ("fullSlug" in resolvedComponents) {
    // It's a single component
    traverse(resolvedComponents as ResolvedComponent)

    // If excludeRootComponent is true, remove the root component from the tree.
    if (excludeRootComponent) {
      delete flatDependencyTree[
        (resolvedComponents as ResolvedComponent).fullSlug
      ]
    }
  } else {
    // It's a record of components
    for (const key in resolvedComponents) {
      const component = resolvedComponents[key]
      if (component) {
        traverse(component)
      }
    }
  }

  console.log("FLAT DEPENDENCY TREE FINAL", flatDependencyTree)

  return flatDependencyTree
}
