import * as z from "zod"

export const templateFormSchema = z.object({
  name: z.string().min(1, "Required field"),
  template_slug: z.string(),
  description: z.string().min(1, "Required field"),
  preview_url: z.string(),
  website_preview_url: z
    .string()
    .url("Invalid URL format")
    .min(1, "Required field"),
  payment_url: z.string().url("Invalid URL format").min(1, "Required field"),
  price: z.number().min(0),
  publish_as_username: z.string().optional(),
  preview_image_file: z.any(),
  preview_image_data_url: z.string(),
  preview_video_file: z.any().optional(),
  preview_video_data_url: z.string().optional(),
})

export type TemplateFormData = z.infer<typeof templateFormSchema>
