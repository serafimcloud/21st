import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/types/supabase"

export type NonShadcnComponent = {
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
 * Looks up non-shadcn components in the database
 * @param supabase Supabase client instance
 * @param components Array of non-shadcn components to look up
 * @returns Object with lookupResults (matches found) and remainingComponents (no matches found)
 */
export async function lookupComponentsInDatabase(
  supabase: SupabaseClient<Database>,
  components: NonShadcnComponent[],
): Promise<{
  lookupResults: { component: NonShadcnComponent; match: ComponentMatch }[]
  remainingComponents: NonShadcnComponent[]
}> {
  if (!components || components.length === 0) {
    return { lookupResults: [], remainingComponents: [] }
  }

  const lookupResults: {
    component: NonShadcnComponent
    match: ComponentMatch
  }[] = []
  const remainingComponents: NonShadcnComponent[] = []

  for (const component of components) {
    const path = component.path
    const pathParts = path.split("/")
    const fileSlug = pathParts[pathParts.length - 1]

    if (!fileSlug) {
      remainingComponents.push(component)
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
      remainingComponents.push(component)
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
              matchingComponent.user?.username,
          },
        })
        foundMatch = true
        break
      }
    }

    if (!foundMatch) {
      // No exact match found, add to remaining components
      remainingComponents.push(component)
    }
  }

  return { lookupResults, remainingComponents }
}

/**
 * Converts component matches to dependency slugs for resolveRegistryDependencyTree
 * @param matches Array of component matches
 * @returns Array of dependency slugs in the format "username/slug"
 */
export function convertComponentMatchesToDependencySlugs(
  matches: { component: NonShadcnComponent; match: ComponentMatch }[],
): string[] {
  return matches.map(({ match }) => {
    // For UI components, use 'shadcn' as the registry name to match shadcn convention
    const registryName = match.registry === "ui" ? "shadcn" : match.registry
    return `${match.username || registryName}/${match.slug}`
  })
}
