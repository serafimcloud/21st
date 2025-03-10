import { Json } from "./supabase"

export interface PromptRule {
  id: number
  user_id: string
  name: string
  tech_stack: TechStack[]
  theme: Theme
  additional_context: string | null
  created_at: string
  updated_at: string
}

export interface TechStack {
  name: string
  version?: string
}

export interface Theme {
  colors?: {
    primary?: string
    secondary?: string
    background?: string
    text?: string
    accent?: string
    [key: string]: string | undefined
  }
  spacing?: {
    padding?: string
    margin?: string
    gap?: string
    [key: string]: string | undefined
  }
  tailwindConfig?: string
  globalCss?: string
}

export interface CreatePromptRuleInput {
  name: string
  tech_stack: TechStack[]
  theme: Theme
  additional_context?: string
}

export interface UpdatePromptRuleInput {
  name?: string
  tech_stack?: TechStack[]
  theme?: Theme
  additional_context?: string
}
