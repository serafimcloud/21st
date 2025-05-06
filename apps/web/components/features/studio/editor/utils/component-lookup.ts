import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/types/supabase"

export type UnresolvedDependency = {
  path: string
  names: string[]
}

export type ComponentMatch = {
  id: number
  slug: string
  registry: string
  username?: string
}

/**
 * Looks up unresolved dependencies in the database
 * @param supabase Supabase client instance
 * @param unresolvedDependencies Array of unresolved dependencies to look up
 * @returns Object with lookupResults (matches found) and remainingDependencies (no matches found)
 */
export async function lookupComponentsInDatabase(
  supabase: SupabaseClient<Database>,
  unresolvedDependencies: UnresolvedDependency[],
): Promise<{
  lookupResults: { component: UnresolvedDependency; match: ComponentMatch }[]
  remainingDependencies: UnresolvedDependency[]
}> {
  if (!unresolvedDependencies || unresolvedDependencies.length === 0) {
    return { lookupResults: [], remainingDependencies: [] }
  }

  const lookupResults: {
    component: UnresolvedDependency
    match: ComponentMatch
  }[] = []
  const remainingDependencies: UnresolvedDependency[] = []

  for (const component of unresolvedDependencies) {
    const path = component.path
    const pathParts = path.split("/")
    const fileSlug = pathParts[pathParts.length - 1]

    if (!fileSlug) {
      remainingDependencies.push(component)
      continue
    }

    // Look for components in the database that match the slug
    const { data: matchingComponents, error } = await supabase
      .from("components")
      .select(
        "id, component_slug, component_names, registry, user:users!user_id(username, display_username)",
      )
      .eq("component_slug", fileSlug)

    if (error || !matchingComponents || matchingComponents.length === 0) {
      // No matches found, keep as remaining component
      remainingDependencies.push(component)
      continue
    }

    // Check each matching component to see if it contains all the required component names
    let foundMatch = false

    for (const matchingComponent of matchingComponents) {
      // Parse the component_names JSON array
      const componentNames = matchingComponent.component_names
        ? typeof matchingComponent.component_names === "string"
          ? JSON.parse(matchingComponent.component_names)
          : matchingComponent.component_names
        : []

      // Check if all required component names exist in this component
      const allNamesExist = component.names.every((name: string) =>
        componentNames.includes(name),
      )

      if (allNamesExist) {
        // Found a match!
        lookupResults.push({
          component,
          match: {
            id: matchingComponent.id,
            slug: matchingComponent.component_slug,
            registry: matchingComponent.registry,
            username:
              matchingComponent.user?.display_username ||
              matchingComponent.user?.username ||
              undefined,
          },
        })
        foundMatch = true
        break
      }
    }

    if (!foundMatch) {
      // No exact match found, add to remaining components
      remainingDependencies.push(component)
    }
  }

  return { lookupResults, remainingDependencies }
}

/**
 * Converts component matches to dependency slugs for resolveRegistryDependencyTree
 * @param matches Array of component matches
 * @returns Array of dependency slugs in the format "username/slug"
 */
export function convertComponentMatchesToDependencySlugs(
  matches: { component: UnresolvedDependency; match: ComponentMatch }[],
): string[] {
  return matches.map(({ match }) => {
    // For UI components, use 'shadcn' as the registry name to match shadcn convention
    const registryName = match.registry === "ui" ? "shadcn" : match.registry
    return `${match.username || registryName}/${match.slug}`
  })
}
