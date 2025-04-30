export const getLatestPackageVersionFromError = async (
  errorMessage: string,
): Promise<{ packageName: string; latestVersion: string } | null> => {
  const match = errorMessage.match(/Failed to resolve import "([^"]+)" from/)
  let potentialPackageName = match?.[1]

  if (
    !potentialPackageName ||
    potentialPackageName.startsWith(".") ||
    potentialPackageName.startsWith("/")
  ) {
    console.log(`Skipping lookup for non-package path: ${potentialPackageName}`)
    return null
  }

  while (potentialPackageName) {
    try {
      console.log(
        `Attempting to fetch package info for: ${potentialPackageName}`,
      )
      const response = await fetch(
        `https://registry.npmjs.org/${potentialPackageName}`,
      )

      if (response.ok) {
        const data = await response.json()
        const latestVersion = data?.["dist-tags"]?.latest

        if (latestVersion) {
          console.log(
            `Found latest version for ${potentialPackageName}: ${latestVersion}`,
          )
          return { packageName: potentialPackageName, latestVersion }
        } else {
          console.log(
            `Found package ${potentialPackageName}, but no 'latest' version tag.`,
          )
          // Package exists, but no version found? Treat as not found for simplicity,
          // or could implement alternative logic (e.g., find highest version).
          return null
        }
      } else if (response.status === 404) {
        console.log(`Package ${potentialPackageName} not found (404).`)
        // Package not found, try removing the last path segment
        const lastSlashIndex = potentialPackageName.lastIndexOf("/")
        if (lastSlashIndex !== -1) {
          potentialPackageName = potentialPackageName.substring(
            0,
            lastSlashIndex,
          )
        } else {
          // No more slashes, this was the last attempt
          break // Exit the loop
        }
      } else {
        // Other HTTP error
        console.error(
          `Failed to fetch package info for ${potentialPackageName}: ${response.status} ${response.statusText}`,
        )
        return null
      }
    } catch (error) {
      console.error(
        `Error fetching latest version for ${potentialPackageName}:`,
        error,
      )
      return null // Network error or other fetch issue
    }
  }

  console.log("Could not determine package name after checking paths.")
  return null
}
