import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node", // Using 'node' as we don't need JSDOM for backend/lib functions
    globals: true, // Optional: use Vitest's global APIs (describe, it, expect) without importing
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 20000,
  },
})
