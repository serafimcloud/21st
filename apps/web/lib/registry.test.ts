import { describe, it, expect } from "vitest"
import { resolveRegistryDependenciesV2 } from "./registry"

// demo depencncies
// "shadcn/button"

//

describe("resolveRegistryDependencies", () => {
  it("resolves basic component", async () => {
    const authorSlug = "mikolajdobrucki/hero-section"
    const result = await resolveRegistryDependenciesV2([authorSlug])

    console.log("Result of ", JSON.stringify(authorSlug, null, 2), result)

    expect(result).not.toBeNull()
    expect(Object.keys(result).length).toBe(1)
    expect(result[authorSlug]).toBeDefined()

    const component = result[authorSlug]
    if (component) {
      expect(component.fullSlug).toBe(authorSlug)
      expect(component.code).not.toBeNull()
    }
  })

  it("resolves shadcn component", async () => {
    const shadcnSlug = "shadcn/button"
    const result = await resolveRegistryDependenciesV2([shadcnSlug])

    console.log("Result of ", JSON.stringify(shadcnSlug, null, 2), result)

    expect(result).not.toBeNull()
    expect(Object.keys(result).length).toBe(1)
    expect(result[shadcnSlug]).toBeDefined()

    const component = result[shadcnSlug]
    if (component) {
      expect(component.fullSlug).toBe(shadcnSlug)
    }
  })

  it("returns empty record for invalid slug format", async () => {
    const result = await resolveRegistryDependenciesV2(["invalid-slug-format"])

    console.log("Result of ", "invalid-slug-format", result)

    expect(result).toEqual({})
  })

  it("returns empty record for non-existent user", async () => {
    const result = await resolveRegistryDependenciesV2([
      "nonexistent-user/component",
    ])

    console.log("Result of ", "nonexistent-user/component", result)

    expect(result).toEqual({})
  })

  it("returns empty record for non-existent component", async () => {
    const result = await resolveRegistryDependenciesV2([
      "shadcn/nonexistent-component-12345",
    ])

    console.log("Result of ", "shadcn/nonexistent-component-12345", result)

    expect(result).toEqual({})
  })

  it("handles circular dependencies gracefully", async () => {
    // Note: This test assumes there's no circular dependency in production
    // It's testing the protection mechanism by setting a low maxDepth
    const authorSlug = "mikolajdobrucki/hero-section"
    const result = await resolveRegistryDependenciesV2([authorSlug], {
      maxDepth: 1,
    })

    expect(result).not.toBeNull()
    expect(Object.keys(result).length).toBeGreaterThan(0)
  })

  it("resolves multiple components", async () => {
    const slugs = ["shadcn/button", "mikolajdobrucki/hero-section"]
    const result = await resolveRegistryDependenciesV2(slugs)

    expect(result).not.toBeNull()
    expect(Object.keys(result).length).toBeGreaterThanOrEqual(2)

    if (slugs[0] && slugs[1]) {
      expect(result[slugs[0]]).toBeDefined()
      expect(result[slugs[1]]).toBeDefined()
    }
  })
})
