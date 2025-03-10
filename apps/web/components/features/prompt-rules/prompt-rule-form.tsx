"use client"

import { useState, SetStateAction } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Code, Palette, FileText } from "lucide-react"
import { Tag, TagInput } from "emblor"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  CreatePromptRuleInput,
  PromptRule,
  TechStack,
  Theme,
} from "@/types/prompt-rules"
import { createPromptRule, updatePromptRule } from "@/lib/queries"
import { useClerkSupabaseClient } from "@/lib/clerk"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  additional_context: z.string().optional(),
})

interface PromptRuleFormProps {
  userId: string
  promptRule?: PromptRule
  isEditing?: boolean
}

export function PromptRuleForm({
  userId,
  promptRule,
  isEditing = false,
}: PromptRuleFormProps) {
  const router = useRouter()
  const supabase = useClerkSupabaseClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize with default values and explicit type casting
  const initialTechStack: TechStack[] = Array.isArray(promptRule?.tech_stack)
    ? promptRule.tech_stack
    : []
  const initialTheme: Theme =
    typeof promptRule?.theme === "object" && promptRule.theme !== null
      ? promptRule.theme
      : {}
  const initialTailwindConfig =
    typeof promptRule?.theme?.tailwindConfig === "string"
      ? promptRule.theme.tailwindConfig
      : ""
  const initialGlobalCss =
    typeof promptRule?.theme?.globalCss === "string"
      ? promptRule.theme.globalCss
      : ""

  const [techStack, setTechStack] = useState<TechStack[]>(initialTechStack)
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [tailwindConfig, setTailwindConfig] = useState(initialTailwindConfig)
  const [globalCss, setGlobalCss] = useState(initialGlobalCss)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: typeof promptRule?.name === "string" ? promptRule.name : "",
      additional_context:
        typeof promptRule?.additional_context === "string"
          ? promptRule.additional_context
          : "",
    },
  })

  const handleTagsUpdate = (newTagsOrUpdater: SetStateAction<Tag[]>) => {
    const newTags = Array.isArray(newTagsOrUpdater) ? newTagsOrUpdater : []
    const newTechStack: TechStack[] = newTags
      .filter(
        (tag): tag is Tag & { text: string } =>
          typeof tag.text === "string" && tag.text.trim() !== "",
      )
      .map((tag) => {
        const parts = tag.text.split(/\s*\((.*?)\)\s*/)
        return {
          name: parts[0]?.trim() || "",
          ...(parts[1] ? { version: parts[1].trim() } : {}),
        }
      })
    setTechStack(newTechStack)
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)

    try {
      const formData: CreatePromptRuleInput = {
        name: values.name,
        tech_stack: techStack,
        theme: {
          ...(promptRule?.theme || {}),
          ...theme,
          tailwindConfig: tailwindConfig || undefined,
          globalCss: globalCss || undefined,
        },
        additional_context: values.additional_context,
      }

      if (isEditing && promptRule?.id) {
        await updatePromptRule(supabase, promptRule.id, formData)
        toast.success("Rule updated successfully")
      } else {
        await createPromptRule(supabase, userId, formData)
        toast.success("Rule created successfully")
      }

      router.push("/settings/rules")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(
        isEditing
          ? "Failed to update rule. Please try again."
          : "Failed to create rule. Please try again.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rule Name</FormLabel>
              <FormControl>
                <Input placeholder="My Project Rules" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for this set of rules
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Tabs defaultValue="context" className="w-full">
          <TabsList className="rounded-md h-7 p-0.5">
            <TabsTrigger
              value="context"
              className="text-xs h-6 flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              Context
            </TabsTrigger>
            <TabsTrigger
              value="tech-stack"
              className="text-xs h-6 flex items-center gap-1"
            >
              <Code className="h-4 w-4" />
              Tech Stack
            </TabsTrigger>
            <TabsTrigger
              value="theme"
              className="text-xs h-6 flex items-center gap-1"
            >
              <Palette className="h-4 w-4" />
              Theme
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tech-stack" className="space-y-4 mt-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Tech Stack</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add technologies used in your project to improve AI code
                generation
              </p>

              <div className="space-y-2">
                <TagInput
                  tags={techStack.map((tech) => ({
                    id: tech.name,
                    text: tech.version
                      ? `${tech.name} (${tech.version})`
                      : tech.name,
                  }))}
                  setTags={handleTagsUpdate}
                  placeholder="Add technology (e.g., React v18, Next.js 14)"
                  styleClasses={{
                    tagList: {
                      container: "gap-1",
                    },
                    input:
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    tag: {
                      body: "relative h-7 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md font-medium text-xs ps-2 pe-7",
                      closeButton:
                        "absolute -inset-y-px -end-px p-0 rounded-s-none rounded-e-lg flex size-7 transition-colors outline-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 text-muted-foreground/80 hover:text-foreground",
                    },
                  }}
                  activeTagIndex={activeTagIndex}
                  setActiveTagIndex={setActiveTagIndex}
                  inlineTags={false}
                  inputFieldPosition="top"
                />
                <p className="text-xs text-muted-foreground">
                  Format: "Technology" or "Technology (version)" - press Enter
                  to add
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="theme" className="space-y-4 mt-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Theme Configuration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your project's theme configuration to improve styling in
                generated code
              </p>

              <div className="space-y-4">
                <div>
                  <FormLabel>Tailwind Config</FormLabel>
                  <Textarea
                    placeholder="Paste your tailwind.config.js content here"
                    className="font-mono text-xs h-40"
                    value={tailwindConfig}
                    onChange={(e) => setTailwindConfig(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This helps AI understand your custom Tailwind configuration
                  </p>
                </div>

                <div>
                  <FormLabel>Global CSS</FormLabel>
                  <Textarea
                    placeholder="Paste your global CSS content here"
                    className="font-mono text-xs h-40"
                    value={globalCss}
                    onChange={(e) => setGlobalCss(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Add your global CSS to ensure consistent styling
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="context" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="additional_context"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Context</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional context or requirements for your project..."
                      className="h-40"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide any additional information that would help the AI
                    generate better code for your project
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/settings/rules")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
                ? "Update Rule"
                : "Create Rule"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
