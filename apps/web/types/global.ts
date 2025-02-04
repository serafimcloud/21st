/* eslint-disable no-unused-vars */
import { Database } from "./supabase"

export type Component = Database["public"]["Tables"]["components"]["Row"]
export type Demo = Database["public"]["Tables"]["demos"]["Row"]
export type User = Database["public"]["Tables"]["users"]["Row"]
export type Tag = Database["public"]["Tables"]["tags"]["Row"]
export type Submission = Database["public"]["Tables"]["submissions"]["Row"]

export type Category =
  Database["public"]["Functions"]["get_sections"]["Returns"][0]

export type HuntedComponents =
  Database["public"]["Functions"]["get_hunted_components"]["Returns"]

export type DemoWithComponent = Demo & {
  component: Component & { user: User }
  user: User
  tags: Tag[]
  component_id: number | null
  user_id: string
  fts: unknown | null
  pro_preview_image_url: string | null
  view_count: number | null
}

export type DemoWithTags = Demo & {
  tags: Tag[]
  user: User
  component: Component & { user: User }
}

export type DemoWithComponentAndTags = DemoWithComponent & {
  tags: Tag[]
}

export type DemoTag = Database["public"]["Tables"]["demo_tags"]["Row"]

export type ComponentTag = Database["public"]["Tables"]["component_tags"]["Row"]

export type SortOption = "downloads" | "likes" | "date" | "recommended"

export type QuickFilterOption = "all" | "last_released" | "most_downloaded"

export const QUICK_FILTER_OPTIONS = {
  all: "All Components",
  last_released: "Latest",
  most_downloaded: "Popular",
} as const

export const SORT_OPTIONS = {
  recommended: "Recommended",
  downloads: "Most downloaded",
  likes: "Most liked",
  date: "Newest",
} as const

export const PROMPT_TYPES = {
  BASIC: "basic",
  SITEBREW: "sitebrew",
  V0: "v0",
  LOVABLE: "lovable",
  BOLT: "bolt",
  EXTENDED: "extended",
  REPLIT: "replit",
  MAGIC_PATTERNS: "magic_patterns",
} as const

export type PromptType = (typeof PROMPT_TYPES)[keyof typeof PROMPT_TYPES]

export type ComponentWithUser = Component & { user: User }

// Define activity types enum
export enum AnalyticsActivityType {
  COMPONENT_VIEW = "component_view",
  COMPONENT_CODE_COPY = "component_code_copy",
  COMPONENT_PROMPT_COPY = "component_prompt_copy",
  COMPONENT_CLI_DOWNLOAD = "component_cli_download",
}

export type FormStep =
  | "nameSlugForm"
  | "code"
  | "demoCode"
  | "demoDetails"
  | "detailedForm"

// API Types
export interface ComponentSearchResult {
  name: string
  preview_url: string
  video_url: string | null
  component_data: {
    name: string
    description: string
    code: string
    install_command: string
  }
  component_user_data: {
    name: string
    username: string
    image_url: string | null
  }
  usage_count: number
}

export interface SearchResponse {
  results: ComponentSearchResult[]
  metadata?: {
    plan: string
    requests_remaining: number
    pagination: {
      total: number
      page: number
      per_page: number
      total_pages: number
    }
  }
}

export type ApiKey = {
  id: string
  key: string
  user_id: string
  plan: "free" | "pro" | "enterprise"
  requests_limit: number
  requests_count: number
  created_at: string
  expires_at: string | null
  last_used_at: string | null
  is_active: boolean
  project_url: string
}
