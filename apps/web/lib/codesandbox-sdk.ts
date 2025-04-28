import { CodeSandbox } from "@codesandbox/sdk"

export const codesandboxSdk = new CodeSandbox(process.env.CSB_API_KEY!)

export const DEFAULT_TEMPLATE = "21st-vite"

export const TEMPLATES = {
  "21st-vite": "3cpq99",
}

export const DEFAULT_HIBERNATION_TIMEOUT = 60 * 1000 // 1 minute
