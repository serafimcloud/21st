"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { TemplateWithUser } from "@/types/global"
import { TemplateCard } from "./template-card"
import { TemplateCardSkeleton } from "@/components/ui/skeletons"

export function TemplatesListSEO() {
  const supabase = useClerkSupabaseClient()
  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates-seo"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_templates_v3", {
        p_offset: 0,
        p_limit: 100,
        p_include_private: false,
      })

      if (error) throw error
      return data as TemplateWithUser[]
    },
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <TemplateCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!templates?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">No templates found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <article key={template.id} className="flex flex-col">
            <TemplateCard template={template} />
            <div className="mt-4 prose prose-sm max-w-none">
              <h2 className="text-xl font-semibold mb-2">{template.name}</h2>
              <p className="text-muted-foreground">{template.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
