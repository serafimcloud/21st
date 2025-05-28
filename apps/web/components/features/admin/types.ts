export type SubmissionStatus = "on_review" | "featured" | "posted" | "rejected"

export interface Submission {
  id: number
  name: string
  preview_url: string
  video_url: string
  updated_at: string
  demo_slug: string
  component_data: {
    id: number
    name: string
    component_slug: string
    downloads_count: number
    likes_count: number
    license: string
    registry: string
    website_url: string | null
  }
  user_data: {
    id: string
    username: string
    display_name: string
    display_username: string
    email?: string
  }
  component_user_data: any
  total_count: number
  view_count: number
  bookmarks_count: number
  bundle_url: {
    html: string
  } | null
  submission_status: string | null
  moderators_feedback: string | null
  contest_round_id?: number | null
  is_public?: boolean
}

export interface AdminRpcResponse {
  success: boolean
  error?: string
}

export interface UpdateSubmissionParams {
  p_component_id: number
  p_status: SubmissionStatus
  p_feedback: string
  p_demo_name?: string
  p_demo_slug?: string
}

export interface UpdateDemoParams {
  p_component_id: number
  p_demo_name: string
  p_demo_slug: string
}
