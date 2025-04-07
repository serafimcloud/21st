import { useState, useCallback } from "react"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { toast } from "sonner"
import { resolveRegistryDependencyTree } from "@/lib/queries.server"
import {
  lookupComponentsInDatabase,
  convertComponentMatchesToDependencySlugs,
} from "@/components/features/studio/editor/utils/component-lookup"

/**
 * Hook for managing component dependencies
 */
export function useDependencies() {
  const [registryDependencies, setRegistryDependencies] = useState<
    Record<string, { code: string; registry: string }>
  >({})
  const [
    npmDependenciesOfRegistryDependencies,
    setNpmDependenciesOfRegistryDependencies,
  ] = useState<Record<string, string>>({})

  const [loadingShadcnComponents, setLoadingShadcnComponents] = useState<
    string[]
  >([])

  const supabase = useClerkSupabaseClient()

  // Reset dependencies state
  const resetDependencies = useCallback(() => {
    setRegistryDependencies({})
    setNpmDependenciesOfRegistryDependencies({})
    setLoadingShadcnComponents([])
  }, [])

  // Load dependencies for a component
  const loadDependencies = useCallback(
    async (processedData: any) => {
      setLoadingShadcnComponents([]) // Reset loading state

      // Collect shadcn components first
      const shadcnSlugs: string[] = []
      let shadcnLoadingPaths: string[] = []

      if (processedData?.shadcnComponentsImports?.length > 0) {
        shadcnLoadingPaths = processedData.shadcnComponentsImports.map(
          (component: { name: string }) => {
            const path = `/components/ui/${component.name.toLowerCase()}.tsx`
            shadcnSlugs.push(
              `shadcn/${component.name.toLowerCase().replace(/\s+/g, "-")}`,
            )
            return path
          },
        )
        setLoadingShadcnComponents(shadcnLoadingPaths)
      }

      // Check for non-shadcn components in the database
      const unresolvedComponentSlugs: string[] = []
      let resolvedDependencyPaths: string[] = []

      if (processedData?.unresolvedDependencyImports?.length > 0) {
        try {
          // Look up components in the database
          const { lookupResults, remainingDependencies } =
            await lookupComponentsInDatabase(
              supabase,
              processedData.unresolvedDependencyImports,
            )

          // Update the processedData with found matches
          if (lookupResults.length > 0) {
            // Create loading paths for UI feedback
            resolvedDependencyPaths = lookupResults.map(
              ({ match }) => `/components/${match.registry}/${match.slug}.tsx`,
            )

            // Add paths to loading state
            setLoadingShadcnComponents((prev) => [
              ...prev,
              ...resolvedDependencyPaths,
            ])

            // Convert matches to dependency slugs for resolveRegistryDependencyTree
            unresolvedComponentSlugs.push(
              ...convertComponentMatchesToDependencySlugs(lookupResults),
            )
          }

          // Return the updated unresolved dependencies
          return {
            remainingComponents: remainingDependencies,
            updatedLoadingPaths: [
              ...shadcnLoadingPaths,
              ...resolvedDependencyPaths,
            ],
            allDependencySlugs: [...shadcnSlugs, ...unresolvedComponentSlugs],
          }
        } catch (error) {
          console.error("Error looking up components:", error)
          toast.error(
            `Failed to look up components: ${error instanceof Error ? error.message : "Unknown error"}`,
          )
          return {
            remainingComponents: processedData.unresolvedDependencyImports,
            updatedLoadingPaths: shadcnLoadingPaths,
            allDependencySlugs: shadcnSlugs,
          }
        }
      }

      return {
        remainingComponents: processedData.unresolvedDependencyImports,
        updatedLoadingPaths: [
          ...shadcnLoadingPaths,
          ...resolvedDependencyPaths,
        ],
        allDependencySlugs: [...shadcnSlugs, ...unresolvedComponentSlugs],
      }
    },
    [supabase],
  )

  // Resolve dependencies from the registry
  const resolveDependencies = useCallback(
    async (dependencySlugs: string[], loadingPaths: string[]) => {
      if (dependencySlugs.length === 0) {
        return
      }

      try {
        // Create a mapping of dependency slugs to their file paths for tracking loading state
        const slugToFilePaths: Record<string, string> = {}

        // Map component paths to slugs
        loadingPaths.forEach((path) => {
          const componentName = path.split("/").pop()?.replace(".tsx", "") || ""
          const registry = path.split("/")[2] || "ui"
          const slug = `${registry}/${componentName}`
          slugToFilePaths[slug] = path
        })

        // Track which dependencies are loaded
        const loadedDependencies = new Set<string>()

        // Function to call when a dependency is loaded
        const handleDependencyLoaded = (slug: string) => {
          // When a dependency is resolved, remove it from the loading state
          const path = slugToFilePaths[slug]
          if (path) {
            setLoadingShadcnComponents((prev) =>
              prev.filter((filePath) => filePath !== path),
            )
            loadedDependencies.add(slug)
          }
        }

        const result = await resolveRegistryDependencyTree({
          supabase,
          sourceDependencySlugs: dependencySlugs,
          withDemoDependencies: false,
          withStyles: true, // Enable styles fetching
        })

        if (result.error) {
          throw new Error(
            `Failed to resolve dependencies: ${result.error.message}`,
          )
        }

        if (!result.data) {
          throw new Error("No data returned from dependency resolution")
        }

        // Process loaded dependencies directly since we've verified data exists
        Object.keys(result.data.filesWithRegistry).forEach((path) => {
          const slug = dependencySlugs.find((s) => {
            const basePath = path.split("/").pop()?.replace(".tsx", "") || ""
            return s.includes(basePath)
          })

          if (slug && !loadedDependencies.has(slug)) {
            handleDependencyLoaded(slug)
          }

          // Also check if this is a non-Shadcn component path that we need to remove from loading
          const nonShadcnPath = path.startsWith("/components/") ? path : null
          if (nonShadcnPath) {
            setLoadingShadcnComponents((prev) =>
              prev.filter((filePath) => filePath !== nonShadcnPath),
            )
          }
        })

        setRegistryDependencies(result.data.filesWithRegistry)
        setNpmDependenciesOfRegistryDependencies(result.data.npmDependencies)

        return true
      } catch (error) {
        console.error("Error resolving dependencies:", error)
        toast.error(
          `Failed to resolve dependencies: ${error instanceof Error ? error.message : "Unknown error"}`,
        )

        // Clear component loading state on error
        setLoadingShadcnComponents([])
        return false
      }
    },
    [supabase],
  )

  return {
    registryDependencies,
    npmDependenciesOfRegistryDependencies,
    loadingShadcnComponents,
    loadDependencies,
    resolveDependencies,
    resetDependencies,
    setLoadingShadcnComponents,
  }
}
