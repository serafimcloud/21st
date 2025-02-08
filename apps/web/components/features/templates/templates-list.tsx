// apps/web/components/features/templates/templates-list.tsx
"use client"

import React, { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"

import { useClerkSupabaseClient } from "@/lib/clerk"
import { TemplateWithUser } from "@/types/global"
import { TemplateCard } from "./template-card"
import { TemplateCardSkeleton } from "@/components/ui/skeletons"
import { TemplatePreviewModal } from "./template-preview-modal"

const TemplatesList = React.memo(function TemplatesList({
  templates,
}: {
  templates: TemplateWithUser[]
}) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateWithUser | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {templates?.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onPreviewClick={setSelectedTemplate}
          />
        ))}
      </div>

      <TemplatePreviewModal
        template={selectedTemplate}
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
      />
    </>
  )
})

interface TemplatesContainerProps {
  tagSlug?: string
}

export function TemplatesContainer({ tagSlug }: TemplatesContainerProps) {
  const supabase = useClerkSupabaseClient()

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates", tagSlug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_templates_v3", {
        p_offset: 0,
        p_limit: 50,
        p_include_private: false,
        p_tag_slug: tagSlug === "all" ? undefined : tagSlug,
      })

      if (error) throw error
      return data as TemplateWithUser[]
    },
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <TemplateCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return <TemplatesList templates={templates || []} />
}
