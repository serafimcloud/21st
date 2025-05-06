import { supabaseWithAdminAccess } from "@/lib/supabase"

interface ResolvedComponent {
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
 * Resolves a component and its dependencies recursively by fullSlug (author/component-slug format)
 * Fetches component code, styles, configuration, and builds a dependency tree
 * @param fullSlug The component's full slug in author/component-slug format
 * @param maxDepth Maximum recursion depth to prevent stack overflow
 * @param currentDepth Current recursion depth
 * @param visitedSlugs Set of already visited component slugs to prevent circular dependencies
 */
export async function resolveRegistryDependecyTreeV2(
  fullSlug: string,
  options: {
    shouldFetchR2Assets?: boolean
    maxDepth?: number
    currentDepth?: number
    visitedSlugs?: Set<string>
  } = {},
): Promise<ResolvedComponent | null> {
  const {
    maxDepth = 10,
    currentDepth = 0,
    visitedSlugs = new Set<string>(),
  } = options

  // Check for circular dependencies
  if (visitedSlugs.has(fullSlug)) {
    console.warn("Circular dependency detected:", fullSlug)
    return null
  }

  // Check recursion depth limit
  if (currentDepth >= maxDepth) {
    console.warn("Maximum dependency depth reached for:", fullSlug)
    return null
  }

  // Add current slug to visited set
  visitedSlugs.add(fullSlug)

  const parts = fullSlug.split("/")
  if (parts.length !== 2) {
    console.error("Invalid authorSlug format:", fullSlug)
    return null
  }
  const [author, componentSlug] = parts

  if (!author || !componentSlug) {
    console.error("Author or componentSlug is missing after split:", fullSlug)
    return null
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
    return null
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
    return null
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

  // Fetch all assets from R2 urls
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

  // Handle different formats of dependency data (array or JSON string)
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
    registryDependencies: registryDependencies,
    registryDependenciesTree: {} as Record<string, ResolvedComponent | null>,
  }

  // Recursively resolve all dependencies with increased depth
  if (registryDependencies.length > 0) {
    for (const dependency of registryDependencies) {
      const resolvedDependencyComponent = await resolveRegistryDependecyTreeV2(
        dependency,
        {
          maxDepth: maxDepth,
          currentDepth: currentDepth + 1,
          visitedSlugs: new Set(visitedSlugs), // Create a new copy of the set for each branch
        },
      )

      resolvedComponent.registryDependenciesTree[dependency] =
        resolvedDependencyComponent
    }
  }

  return resolvedComponent
}

export const transformToFlatDependencyTree = (
  resolvedComponent: ResolvedComponent,
  options: { excludeRootComponent?: boolean } = {},
): Record<string, ResolvedComponent> => {
  const { excludeRootComponent = true } = options
  const flatDependencyTree: Record<string, ResolvedComponent> = {}

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
  }

  // Start traversal with the root component.
  traverse(resolvedComponent)

  // If excludeRootComponent is true, remove the root component from the tree.
  if (excludeRootComponent && resolvedComponent) {
    delete flatDependencyTree[resolvedComponent.fullSlug]
  }

  return flatDependencyTree
}
