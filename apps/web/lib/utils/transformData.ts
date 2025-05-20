import { Component, DemoWithComponent, Tag, User } from "@/types/global"
import ShortUUID from "short-uuid"

// Define the extended type here
export interface ExtendedDemoWithComponent extends DemoWithComponent {
  is_private?: boolean
  submission_status?: string
  moderators_feedback?: string
}

const shortUUID = ShortUUID()

export const transformDemoResult = (result: any): ExtendedDemoWithComponent => {
  const componentUser =
    result.component_user_data ||
    (result.component_data && result.component_data.user) ||
    result.user_data

  const transformed = {
    id: result.id,
    name: result.name,
    demo_code: result.demo_code,
    preview_url: result.preview_url,
    video_url: result.video_url,
    compiled_css: result.compiled_css,
    demo_dependencies: result.demo_dependencies,
    demo_direct_registry_dependencies: result.demo_direct_registry_dependencies,
    demo_slug: result.demo_slug,
    component_id: result.component_id ?? result.component_data.id,
    user_id: result.user_id || (result.user_data as User)?.id,
    pro_preview_image_url: result.pro_preview_image_url,
    created_at: result.created_at,
    updated_at: result.updated_at,
    fts: result.fts,
    component: {
      ...(result.component_data as Component),
      sandbox_id: result.component_data.sandbox_id
        ? shortUUID.fromUUID(result.component_data.sandbox_id)
        : null,
      user: componentUser as User,
    } as Component & { user: User },
    user: result.user_data as User,
    tags: (result.tags as Tag[]) || [],
    view_count: result.view_count,
    bookmarks_count: result.bookmarks_count || 0,
    embedding: result.embedding || null,
    embedding_oai: result.embedding_oai || null,
    bundle_url: result.bundle_url || null,
    is_private: result.is_private || false,
    submission_status: result.submission_status || "featured",
    moderators_feedback: result.moderators_feedback || null,
  }
  // @ts-ignore TODO: fix this
  return transformed
}
