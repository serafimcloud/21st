import { describe, it, expect } from "vitest"
import { resolveRegistryDependecyTreeV2 } from "./registry"

describe("resolveRegistryDependecyTree", () => {
  it("resolves basic component", async () => {
    const authorSlug = "mikolajdobrucki/hero-section"
    const result = await resolveRegistryDependecyTreeV2(authorSlug)

    console.log("Result of ", JSON.stringify(authorSlug, null, 2), result)

    expect(result).not.toBeNull()
    expect(result?.fullSlug).toBe(authorSlug)
    expect(result?.code).not.toBeNull()
  })

  it("resolves shadcn component", async () => {
    const shadcnSlug = "shadcn/button"
    const result = await resolveRegistryDependecyTreeV2(shadcnSlug)

    console.log("Result of ", JSON.stringify(shadcnSlug, null, 2), result)

    expect(result).not.toBeNull()
    expect(result?.fullSlug).toBe(shadcnSlug)
  })

  it("returns null for invalid slug format", async () => {
    const result = await resolveRegistryDependecyTreeV2("invalid-slug-format")

    console.log("Result of ", "invalid-slug-format", result)

    expect(result).toBeNull()
  })

  it("returns null for non-existent user", async () => {
    const result = await resolveRegistryDependecyTreeV2(
      "nonexistent-user/component",
    )

    console.log("Result of ", "nonexistent-user/component", result)

    expect(result).toBeNull()
  })

  it("returns null for non-existent component", async () => {
    const result = await resolveRegistryDependecyTreeV2(
      "shadcn/nonexistent-component-12345",
    )

    console.log("Result of ", "shadcn/nonexistent-component-12345", result)

    expect(result).toBeNull()
  })

  it("handles circular dependencies gracefully", async () => {
    // Note: This test assumes there's no circular dependency in production
    // It's testing the protection mechanism by setting a low maxDepth
    const authorSlug = "mikolajdobrucki/hero-section"
    const result = await resolveRegistryDependecyTreeV2(authorSlug, {
      maxDepth: 1,
    })

    expect(result).not.toBeNull()
  })
})
