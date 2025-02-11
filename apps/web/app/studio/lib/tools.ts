import { z } from "zod"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { ComponentSearchResult, SearchResponse } from "@/types/global"

export type SearchResult = ComponentSearchResult

interface APISearchResult {
  id?: number
  name: string
  preview_url?: string
}

interface ComponentCode {
  demoCode: string
  componentCode: string
}

export interface ToolResponse {
  status: string
  message: string
}

type AsyncToolResponse<T> = AsyncGenerator<ToolResponse, T, unknown>

interface CustomTool<T, U> {
  name: string
  description: string
  parameters: z.ZodType<T>
  execute: (args: T) => AsyncToolResponse<U>
}

function createTool<T, U>(config: {
  name: string
  description: string
  parameters: z.ZodType<T>
  execute: (args: T) => AsyncToolResponse<U>
}): CustomTool<T, U> {
  return config
}

export const searchSimilarComponents = createTool({
  name: "searchSimilarComponents",
  description: "Поиск похожих компонентов по описанию",
  parameters: z.object({
    search: z
      .string()
      .describe("Поисковый запрос для поиска похожих компонентов"),
  }),
  execute: async function* ({ search }) {
    yield { status: "searching", message: "Ищу похожие компоненты..." }

    const response = await fetch("/api/studio/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ search }),
    })

    if (!response.ok) {
      throw new Error("Ошибка поиска компонентов")
    }

    const data = await response.json()
    console.log("Search API response:", data)

    if (!data.results || !Array.isArray(data.results)) {
      throw new Error("Некорректный формат ответа от API")
    }

    // Преобразуем результаты в правильный формат
    const validResults = data.results
      .slice(0, 3)
      .filter((result: unknown) => result && typeof result === "object")
      .map((result: Record<string, any>) => ({
        demo_id: result.demo_id,
        name: result.name || "Default",
        preview_url: result.preview_url || "",
        video_url: result.video_url || null,
        component_data: {
          name: result.component_data?.name || "",
          description: result.component_data?.description || "",
          code: result.component_data?.code || "",
          install_command: result.component_data?.install_command || "",
        },
        component_user_data: {
          name: result.component_user_data?.name || "",
          username: result.component_user_data?.username || "",
          image_url: result.component_user_data?.image_url || null,
        },
        usage_count: result.usage_count || 0,
      }))

    console.log("Transformed results:", validResults)
    return validResults
  },
})

export const getComponentCode = createTool({
  name: "getComponentCode",
  description: "Получение кода компонента и демо по ID",
  parameters: z.object({
    demoId: z.number().describe("ID демо компонента"),
  }),
  execute: async function* ({ demoId }) {
    yield { status: "fetching", message: "Получаю код компонента..." }
    const supabase = useClerkSupabaseClient()
    const { data: demo } = await supabase
      .from("demos")
      .select("demo_code, component_id")
      .eq("id", demoId)
      .single()

    if (!demo) {
      throw new Error("Демо не найдено")
    }

    if (!demo.component_id) {
      throw new Error("У демо отсутствует компонент")
    }

    const { data: component } = await supabase
      .from("components")
      .select("code")
      .eq("id", demo.component_id)
      .single()

    if (!component) {
      throw new Error("Компонент не найден")
    }

    return {
      demoCode: demo.demo_code,
      componentCode: component.code,
    }
  },
})

export const generateComponent = createTool({
  name: "generateComponent",
  description: "Генерация нового компонента на основе описания и референсов",
  parameters: z.object({
    prompt: z.string().describe("Описание компонента"),
    references: z
      .array(
        z.object({
          demoCode: z.string(),
          componentCode: z.string(),
        }),
      )
      .describe("Референсы для вдохновения"),
  }),
  execute: async function* ({ prompt, references }) {
    yield { status: "generating", message: "Генерирую компонент..." }

    const response = await fetch("/api/studio/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        references: references.map(
          (ref) => `${ref.componentCode}\n${ref.demoCode}`,
        ),
      }),
    })

    if (!response.ok) {
      throw new Error("Ошибка генерации компонента")
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error("Ошибка чтения ответа")
    }

    let code = ""
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      code += chunk
      yield { status: "streaming", message: code }
    }

    return code
  },
})
