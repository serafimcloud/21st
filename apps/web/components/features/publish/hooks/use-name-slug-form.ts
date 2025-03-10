import { useEffect } from "react"
import { UseFormReturn } from "react-hook-form"
import { debounce } from "lodash"
import { FormData } from "../config/utils"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import { generateUniqueSlug } from "./use-is-check-slug-available"

export const useAutoFocusNameInput = (
  nameInputRef: React.RefObject<HTMLInputElement>,
) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [])
}

const debouncedPrefillSlug = debounce((prefillSlug: () => void) => {
  prefillSlug()
}, 200)

export const usePrefillAutogeneratedSlug = ({
  form,
  isSlugReadOnly,
  isSlugManuallyEdited,
  publishAsUserId,
}: {
  form: UseFormReturn<FormData>
  isSlugReadOnly: boolean
  isSlugManuallyEdited: boolean
  publishAsUserId?: string | null
}) => {
  const client = useClerkSupabaseClient()
  const { user: currentUser } = useUser()
  const userId = publishAsUserId ?? currentUser?.id
  const name = form.watch("name")

  const { data: generatedSlug } = useQuery({
    queryKey: ["generateUniqueSlug", name, userId],
    queryFn: async () => {
      if (name && !isSlugManuallyEdited && !isSlugReadOnly) {
        return await generateUniqueSlug(client, name, "component", userId ?? "")
      }
      return null
    },
    enabled: !!name && !isSlugManuallyEdited && !isSlugReadOnly,
  })

  useEffect(() => {
    if (isSlugReadOnly) return

    debouncedPrefillSlug(() => {
      if (generatedSlug) {
        form.setValue("component_slug", generatedSlug)
      }
    })
    return () => debouncedPrefillSlug.cancel()
  }, [generatedSlug, isSlugReadOnly])
}
