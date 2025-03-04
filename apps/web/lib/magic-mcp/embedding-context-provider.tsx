"use client"

import { useEffect, useState } from "react"
import { searchEmbeddings, SearchResultsData } from "@/lib/embedding-search"
import { useClerkSupabaseClient } from "@/lib/clerk"

/**
 * Format search results for Magic MCP
 */
function formatResultsForMCP(searchResults: SearchResultsData | null): string {
  if (!searchResults) {
    return "Не найдено релевантных компонентов. Попробуйте изменить запрос или описать потребность подробнее."
  }

  const { fullSolutions, contextualComponents, adaptableComponents } =
    searchResults

  let formattedText = ""

  // Секция с полными решениями (демо)
  if (fullSolutions.length > 0) {
    formattedText += "# Готовые решения\n\n"
    formattedText +=
      "Вот несколько полных решений, которые могут подойти для вашей задачи:\n\n"

    fullSolutions.slice(0, 3).forEach((solution, index) => {
      formattedText += `### ${index + 1}. ${solution.demo_name}\n`
      formattedText += `${solution.metadata.description || "Готовое решение с использованием компонентов 21st."}\n`
      formattedText += `Соответствие запросу: ${Math.round(solution.similarity * 100)}%\n\n`
    })
  }

  // Секция с контекстными компонентами
  if (contextualComponents.length > 0) {
    formattedText += "# Контекстные компоненты\n\n"
    formattedText += "Эти компоненты использовались в схожих сценариях:\n\n"

    contextualComponents.slice(0, 3).forEach((context, index) => {
      formattedText += `### ${index + 1}. ${context.component_name} в ${context.demo_name}\n`
      formattedText += `${context.context_description || "Компонент, использованный в релевантном контексте."}\n`
      formattedText += `Соответствие запросу: ${Math.round(context.similarity * 100)}%\n\n`
    })
  }

  // Секция с гибкими компонентами
  if (adaptableComponents.length > 0) {
    formattedText += "# Универсальные компоненты\n\n"
    formattedText += "Эти компоненты можно адаптировать для вашей задачи:\n\n"

    adaptableComponents.slice(0, 3).forEach((component, index) => {
      formattedText += `### ${index + 1}. ${component.component_name}\n`
      formattedText += `${component.metadata.description || "Универсальный компонент с широкими возможностями применения."}\n`
      formattedText += `Соответствие запросу: ${Math.round(component.similarity * 100)}%\n\n`
    })
  }

  // Если ничего не найдено
  if (formattedText === "") {
    formattedText =
      "К сожалению, не найдено релевантных компонентов. Попробуйте изменить запрос или описать потребность подробнее."
  }

  return formattedText
}

interface EmbeddingContextProviderProps {
  query: string
  onContextReady: (context: string) => void
}

/**
 * Component to search for relevant components/demos and provide context for Magic MCP
 */
export function EmbeddingContextProvider({
  query,
  onContextReady,
}: EmbeddingContextProviderProps) {
  const supabase = useClerkSupabaseClient()

  useEffect(() => {
    if (!query) return

    const searchForComponents = async () => {
      try {
        const results = await searchEmbeddings(supabase, {
          query,
          searchType: "combined",
        })

        const formattedContext = formatResultsForMCP(results)
        onContextReady(formattedContext)
      } catch (error) {
        console.error("Ошибка при поиске компонентов:", error)
        onContextReady(
          "Произошла ошибка при поиске компонентов. Пожалуйста, попробуйте позже.",
        )
      }
    }

    searchForComponents()
  }, [query, onContextReady, supabase])

  return null // Этот компонент не отображает UI
}

/**
 * Helper function to integrate with Magic MCP
 */
export async function enhanceMagicMCPContext(
  supabase: any,
  userQuery: string,
): Promise<string> {
  if (!userQuery || userQuery.trim() === "") {
    return ""
  }

  try {
    const results = await searchEmbeddings(supabase, {
      query: userQuery,
      searchType: "combined",
    })

    return formatResultsForMCP(results)
  } catch (error) {
    console.error("Ошибка при поиске компонентов для контекста:", error)
    return ""
  }
}
