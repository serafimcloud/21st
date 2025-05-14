import { CodeSandbox } from "@codesandbox/sdk"

export const codesandboxSdk = new CodeSandbox(process.env.CSB_API_KEY!)

export const DEFAULT_TEMPLATE = "21st-vite"

export const TEMPLATES = {
  "21st-vite": "kwk42j", // "d5t2cg",
}

export const DEFAULT_HIBERNATION_TIMEOUT = 60
