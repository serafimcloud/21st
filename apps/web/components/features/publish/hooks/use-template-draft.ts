import { useEffect } from "react"
import { UseFormReturn } from "react-hook-form"
import type { TemplateFormData } from "../template/schema"

const TEMPLATE_DRAFT_KEY = "template_draft"

const isClient = typeof window !== "undefined"

export function useTemplateDraft(form: UseFormReturn<TemplateFormData>) {
  const saveDraft = (data: Partial<TemplateFormData>) => {
    if (!isClient) return
    try {
      const draftData = { ...data }
      delete draftData.preview_image_file
      delete draftData.preview_video_file
      delete draftData.preview_image_data_url
      delete draftData.preview_video_data_url

      localStorage.setItem(TEMPLATE_DRAFT_KEY, JSON.stringify(draftData))
    } catch (error) {}
  }

  const loadDraft = (): Partial<TemplateFormData> | null => {
    if (!isClient) return null
    try {
      const draft = localStorage.getItem(TEMPLATE_DRAFT_KEY)
      return draft ? JSON.parse(draft) : null
    } catch (error) {
      return null
    }
  }

  const clearDraft = () => {
    if (!isClient) return
    try {
      localStorage.removeItem(TEMPLATE_DRAFT_KEY)
    } catch (error) {}
  }

  const hasDraft = (): boolean => {
    if (!isClient) return false
    return !!localStorage.getItem(TEMPLATE_DRAFT_KEY)
  }

  const restoreDraft = () => {
    const draft = loadDraft()
    if (draft) {
      Object.entries(draft).forEach(([key, value]) => {
        if (value !== undefined) {
          form.setValue(key as keyof TemplateFormData, value)
        }
      })
    }
  }

  useEffect(() => {
    const subscription = form.watch((data) => {
      saveDraft(data)
    })

    return () => subscription.unsubscribe()
  }, [form])

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    restoreDraft,
  }
}
