import { useClerkSupabaseClient } from "@/lib/clerk"
import { Database } from "@/types/supabase"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { FormData } from "../config/utils"

type Tag = {
  id?: number
  name: string
  slug: string
}

export const useComponentData = (componentId: number | null | undefined) => {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormData | null>(null)
  const client = useClerkSupabaseClient()

  useEffect(() => {
    const fetchComponentData = async () => {
      if (!componentId) {
        setFormData(null)
        return
      }

      setIsLoading(true)
      try {
        // Fetch component data
        const { data: componentData, error: componentError } = await client
          .from("components")
          .select("*")
          .eq("id", componentId)
          .single()

        if (componentError) throw componentError

        // Fetch demo data
        const { data: demosData, error: demosError } = await client
          .from("demos")
          .select("*")
          .eq("component_id", componentId)
          .order("created_at", { ascending: true })

        if (demosError) throw demosError

        // Fetch tags for each demo
        const demoWithTags = await Promise.all(
          demosData.map(
            async (demo: Database["public"]["Tables"]["demos"]["Row"]) => {
              const { data: tagsData, error: tagsError } = await client
                .from("demo_tags")
                .select("tags(*)")
                .eq("demo_id", demo.id)

              if (tagsError) {
                console.error("Error fetching tags:", tagsError)
                return { ...demo, tags: [] }
              }

              const tags = tagsData.map((tagItem: any) => tagItem.tags)
              return { ...demo, tags }
            },
          ),
        )

        // Transform data to match FormData structure
        const transformedData: FormData = {
          name: componentData.name,
          component_slug: componentData.component_slug,
          registry: componentData.registry,
          description: componentData.description || "",
          license: componentData.license,
          website_url: componentData.website_url || "",
          is_public: componentData.is_public,
          publish_as_username: undefined, // Will be set by main component
          code: "", // Will be populated by sandbox
          unknown_dependencies: [],
          direct_registry_dependencies: Array.isArray(
            componentData.direct_registry_dependencies,
          )
            ? componentData.direct_registry_dependencies.filter(
                (d) => typeof d === "string",
              )
            : [],
          demos: demoWithTags.map((demo: any) => ({
            name: demo.name,
            demo_code: "", // Will be populated by sandbox
            demo_slug: demo.demo_slug,
            tags: demo.tags || [],
            preview_image_data_url: demo.preview_url || "",
            preview_image_file: undefined,
            preview_video_data_url: demo.video_url || "",
            preview_video_file: undefined,
            demo_direct_registry_dependencies:
              demo.demo_direct_registry_dependencies || [],
            demo_dependencies: demo.demo_dependencies || {},
          })),
        }

        setFormData(transformedData)
      } catch (error) {
        console.error("Error fetching component data:", error)
        toast.error("Failed to load component data")
        setFormData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchComponentData()
  }, [componentId, client])

  return { isLoading, formData }
}
