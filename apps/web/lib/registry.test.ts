import { describe, it, expect } from "vitest"
import { resolveRegistryDependecyTreeV2 } from "./registry"

describe("resolveRegistryDependecyTree", () => {
  it("resolves basic component", async () => {
    const authorSlug = "mikolajdobrucki/hero-section"
    const result = await resolveRegistryDependecyTreeV2(authorSlug)

    expect(result).not.toBeNull()
    expect(result?.fullSlug).toBe(authorSlug)
    expect(result?.code).not.toBeNull()
  })

  it("resolves shadcn component", async () => {
    const shadcnSlug = "shadcn/button"
    const result = await resolveRegistryDependecyTreeV2(shadcnSlug)

    expect(result).not.toBeNull()
    expect(result?.fullSlug).toBe(shadcnSlug)
  })

  it("returns null for invalid slug format", async () => {
    const result = await resolveRegistryDependecyTreeV2("invalid-slug-format")
    expect(result).toBeNull()
  })

  it("returns null for non-existent user", async () => {
    const result = await resolveRegistryDependecyTreeV2(
      "nonexistent-user/component",
    )
    expect(result).toBeNull()
  })

  it("returns null for non-existent component", async () => {
    const result = await resolveRegistryDependecyTreeV2(
      "shadcn/nonexistent-component-12345",
    )
    expect(result).toBeNull()
  })

  it("handles circular dependencies gracefully", async () => {
    // Note: This test assumes there's no circular dependency in production
    // It's testing the protection mechanism by setting a low maxDepth
    const authorSlug = "mikolajdobrucki/hero-section"
    const result = await resolveRegistryDependecyTreeV2(authorSlug, 1)

    expect(result).not.toBeNull()
  })
})
