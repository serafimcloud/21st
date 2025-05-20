/* eslint-disable no-unused-vars */
import { PostgrestFilterBuilder } from "@supabase/postgrest-js"
import { Database } from "./supabase"

export type Component = Database["public"]["Tables"]["components"]["Row"]
export type User = Database["public"]["Tables"]["users"]["Row"]
export type Demo = Database["public"]["Tables"]["demos"]["Row"]
export type Tag = Database["public"]["Tables"]["tags"]["Row"]
export type Submission = Database["public"]["Tables"]["submissions"]["Row"]
export type Category = {
  tag_slug: string
  tag_name: string
  preview_url: string | null
  video_url: string | null
}

export type DemoWithComponent = Demo & {
  component: Component & { user: User }
  user: User
  tags: Tag[]
  component_id: number | null
  user_id: string
  fts: unknown | null
  pro_preview_image_url: string | null
  view_count: number | null
  bookmarks_count: number | null
  bundle_url?: {
    html: string
    js?: string
    css?: string
  }
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

export type SortOption =
  | "downloads"
  | "likes"
  | "date"
  | "recommended"
  | "bookmarks"

export type QuickFilterOption = "all" | "last_released" | "most_downloaded"

export const QUICK_FILTER_OPTIONS = {
  all: "All Components",
  last_released: "Latest",
  most_downloaded: "Popular",
} as const

export const SORT_OPTIONS = {
  recommended: "Recommended",
  downloads: "Most downloaded",
  bookmarks: "Most bookmarked",
  date: "Newest",
} as const

export const PROMPT_TYPES = {
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
  demo_id: number
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

export interface SearchResponseMCP {
  results: {
    demoName: string
    demoCode: string
    componentName: string
    componentCode: string
    registryDependencies?: {
      filesWithRegistry: Record<string, { code: string; registry: string }>
      npmDependencies: Record<string, string>
    }
  }[]
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

export type Template = Database["public"]["Tables"]["templates"]["Row"]

export type TemplateWithUser = Template & {
  user_data: {
    id: string
    name: string | null
    username: string | null
    display_name: string | null
    display_username: string | null
    image_url: string | null
    display_image_url: string | null
  }
}

export type GetTemplatesResponse =
  Database["public"]["Functions"]["get_templates_v3"]["Returns"][0]

export type ThemeOptions = {
  dark: string
  light: string
}

export type PlanType = "free" | "pro" | "pro_plus"

export interface PlanPrice {
  monthly: number
  yearly: number
}

export interface PlanFeature {
  name: string
  included: PlanType
  category?: string
  valueByPlan: Record<PlanType, string>
}

export interface PricingPlan {
  name: string
  level: PlanType
  price: PlanPrice
  popular?: boolean
}

export interface PlanLimits {
  generationsPerMonth: number
  displayName: string
  name: string
  description: string
  features: string[]
  monthlyPrice?: number
  yearlyPrice?: number
  tokenPricing: {
    pricePerToken: {
      monthly: number
      yearly: number
    }
    componentCost: number
    generationCost: number
  }
}

export interface SVGLogo {
  id?: number
  title: string
  category: string | string[]
  route: string | ThemeOptions
  wordmark?: string | ThemeOptions
  brandUrl?: string
  url: string
}

export interface SVGCategory {
  category: string
  total: number
}

export interface CollectionWithUser {
  id: string
  name: string
  description: string | null
  cover_url: string | null
  user_id: string
  created_at: string
  updated_at: string
  is_public: boolean
  slug: string
  components_count: number
  user_data: User
}

export type Bundle = Database["public"]["Tables"]["bundles"]["Row"]
export type BundlePlan = Database["public"]["Tables"]["bundle_plans"]["Row"]
export type BundlePurchase =
  Database["public"]["Tables"]["bundle_purchases"]["Row"]
export type BundlePlanType =
  Database["public"]["Tables"]["bundle_plans"]["Row"]["type"]
export type BundlePaymentStatus =
  Database["public"]["Tables"]["bundle_purchases"]["Row"]["status"]
export type BundlesSelectQuery = PostgrestFilterBuilder<
  Database["public"],
  Bundle,
  Bundle[]
>
