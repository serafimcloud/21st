import type { SandpackFiles } from "@codesandbox/sandpack-react"

const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
`

export const files: SandpackFiles = {
  "/vite.config.ts": {
    code: viteConfig,
  },
}
