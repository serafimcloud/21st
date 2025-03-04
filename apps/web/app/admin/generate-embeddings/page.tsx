"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { motion } from "motion/react"

// Функция для добавления задержки между запросами
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Функция для форматирования объекта в строку для логов
const formatObjectForLog = (obj: any): string => {
  try {
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return `[Невозможно сериализовать объект: ${e}]`
  }
}

export default function GenerateEmbeddingsPage() {
  const supabase = useClerkSupabaseClient()
  const [activeTab, setActiveTab] = useState("components")

  const [isGeneratingComponents, setIsGeneratingComponents] = useState(false)
  const [isGeneratingDemos, setIsGeneratingDemos] = useState(false)
  const [isGeneratingContexts, setIsGeneratingContexts] = useState(false)

  const [componentsProgress, setComponentsProgress] = useState(0)
  const [componentsTotal, setComponentsTotal] = useState(0)
  const [demosProgress, setDemosProgress] = useState(0)
  const [demosTotal, setDemosTotal] = useState(0)
  const [contextsProgress, setContextsProgress] = useState(0)
  const [contextsTotal, setContextsTotal] = useState(0)

  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prevLogs) => [
      ...prevLogs,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ])
  }

  // Generate embeddings for all components
  const generateComponentEmbeddings = async () => {
    if (isGeneratingComponents) return
    setIsGeneratingComponents(true)
    setComponentsProgress(0)
    addLog("Начинаю генерацию эмбедингов для компонентов...")

    try {
      // Получаем все компоненты
      const { data: components, error: componentsError } = await supabase
        .from("components")
        .select("id, name, code")
        .order("id")

      if (componentsError) throw componentsError
      
      if (!components || components.length === 0) {
        addLog("Не найдено компонентов для генерации эмбедингов")
        return
      }

      addLog(`Найдено ${components.length} компонентов для обработки`)
      setComponentsTotal(components.length)
      
      let processed = 0
      
      for (const component of components) {
        addLog(`[Компонент] Обработка ${component.name} (ID: ${component.id})...`)
        
        // Выводим полный код компонента для отладки
        addLog(
          `[КОД] Код компонента ${component.name} (ID: ${component.id}):\n${component.code || "Код не найден"}`,
        )

        // Небольшая задержка для избежания лимитов API
        await sleep(500)

        const { data: response, error: invokeError } =
          await supabase.functions.invoke("generate-embeddings", {
            body: { type: "component_capability", componentId: component.id },
          })

        if (invokeError) {
          addLog(
            `[Компонент] Ошибка при генерации для ${component.name}: ${invokeError.message}`,
          )
        } else {
          addLog(
            `[Компонент] Успешно сгенерирован эмбединг для ${component.name} (ID: ${component.id})`,
          )

          // Выводим весь объект ответа в консоль и логи
          console.log("Полный ответ от функции generate-embeddings:", response)
          addLog(`[ОТЛАДКА] Полный ответ: ${formatObjectForLog(response)}`)

          // Используем response.data
          const result = response.data

          if (result && result.description) {
            addLog(
              `[Компонент] Сгенерировано описание (полностью):\n"${result.description}"`,
            )
          }

          // Показываем полный промпт
          if (result && result.prompt_preview) {
            addLog(
              `[Компонент] Промпт для AI (полностью):\n${result.prompt_preview}`,
            )
          }

          // Показываем полный текст для эмбединга
          if (result && result.embedding_text_preview) {
            addLog(
              `[Компонент] Текст для эмбединга (полностью):\n${result.embedding_text_preview}`,
            )
          }
        }
        
        processed++
        setComponentsProgress(Math.floor((processed / components.length) * 100))
      }

      addLog(`Завершена генерация эмбедингов для ${processed} компонентов`)
      toast.success(`Успешно сгенерированы эмбединги для ${processed} компонентов`)
    } catch (error) {
      console.error("Error generating component embeddings:", error)
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      addLog(`Ошибка генерации эмбедингов: ${errorMessage}`)
      toast.error(`Не удалось сгенерировать эмбединг: ${errorMessage}`)
    } finally {
      setIsGeneratingComponents(false)
    }
  }

  // Generate embeddings for all demos
  const generateDemoEmbeddings = async () => {
    if (isGeneratingDemos) return
    setIsGeneratingDemos(true)
    setDemosProgress(0)
    addLog("Начинаю генерацию эмбедингов для демо...")

    try {
      // Fetch only the first demo for testing
      const { data, error } = await supabase
        .from("demos")
        .select("id, name, component_id")
        .order("id")
        .limit(1)

      if (error) throw error

      if (!data || data.length === 0) {
        addLog("Не найдено демо для генерации эмбедингов")
        return
      }

      addLog(`Найдено демо для обработки`)

      setDemosTotal(1)
      const demo = data[0]
      
      try {
        const demoName = demo.name || "Без имени"
        const demoId = demo.id
        const componentId = demo.component_id

        addLog(
          `[Демо] Обработка ${demoName} (ID: ${demoId}, Component ID: ${componentId || "нет"})...`,
        )

        const { data: response, error: invokeError } =
          await supabase.functions.invoke("generate-embeddings", {
            body: { type: "demo_usage", demoId: demoId },
          })

        if (invokeError) {
          addLog(
            `[Демо] Ошибка при генерации для ${demoName}: ${invokeError.message}`,
          )
        } else {
          addLog(
            `[Демо] Успешно сгенерирован эмбединг для ${demoName} (ID: ${demoId})`,
          )

          // Выводим весь объект ответа в консоль для отладки
          console.log(
            "Полный ответ от функции generate-embeddings:",
            response,
          )

          // Добавляем полный ответ в лог
          addLog(`[ОТЛАДКА] Полный ответ: ${formatObjectForLog(response)}`)

          // Используем response.data вместо response
          const result = response.data

          if (result && result.description) {
            // Показываем полное описание, а не превью
            addLog(
              `[Демо] Сгенерировано описание (полностью):\n"${result.description}"`,
            )
          }

          // Показываем полный промпт, а не превью
          if (result && result.prompt_preview) {
            addLog(
              `[Демо] Промпт для AI (полностью):\n"${result.prompt_preview}"`,
            )
            // Добавляем оригинальный текст без ... после превью
            const originalPrompt = result.prompt_preview.replace(
              /\.\.\.$/,
              "",
            )
            addLog(`[ПРОМПТ] ${originalPrompt}`)
          }

          // Показываем полный текст для эмбединга, а не превью
          if (result && result.embedding_text_preview) {
            addLog(
              `[Демо] Текст для эмбединга (полностью):\n"${result.embedding_text_preview}"`,
            )
            // Добавляем оригинальный текст без ... после превью
            const originalEmbeddingText =
              result.embedding_text_preview.replace(/\.\.\.$/, "")
            addLog(`[ЭМБЕДИНГ] ${originalEmbeddingText}`)
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        addLog(`[Демо] Исключение для демо ${demo.id}: ${errorMessage}`)
      }

      setDemosProgress(100)
      addLog(`Завершена генерация эмбедингов для тестового демо`)
      toast.success(`Успешно сгенерирован эмбединг для тестового демо`)
    } catch (error) {
      console.error("Error generating demo embeddings:", error)
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      addLog(`Ошибка генерации эмбедингов демо: ${errorMessage}`)
      toast.error(`Не удалось сгенерировать эмбединги демо: ${errorMessage}`)
    } finally {
      setIsGeneratingDemos(false)
    }
  }

  // Generate usage context embeddings
  const generateContextEmbeddings = async () => {
    if (isGeneratingContexts) return
    setIsGeneratingContexts(true)
    setContextsProgress(0)
    addLog("Начинаю генерацию контекстных эмбедингов...")

    try {
      // Fetch all demos with their component_id
      const { data, error } = await supabase
        .from("demos")
        .select("id, name, component_id")
        .order("id")

      if (error) throw error

      if (!data || data.length === 0) {
        addLog("Не найдено демо для генерации контекстных эмбедингов")
        return
      }

      addLog(`Найдено ${data.length} демо для обработки контекстных эмбедингов`)

      // Filter out demos that don't have a component_id
      const contextData = data.filter(
        (demo) => demo.component_id !== null && demo.component_id !== undefined,
      )

      if (contextData.length === 0) {
        addLog(
          "Не найдено демо с привязкой к компоненту для генерации контекстных эмбедингов",
        )
        return
      }

      addLog(
        `Для обработки доступно ${contextData.length} демо с привязкой к компоненту`,
      )

      let processed = 0
      setContextsTotal(contextData.length)

      // Process each demo
      for (const demo of contextData) {
        try {
          // Здесь мы точно знаем, что component_id существует после фильтрации
          const demoId = demo.id
          const demoName = demo.name || "Без имени"
          const componentId = demo.component_id as number // Safe cast after filter

          const { data: component } = await supabase
            .from("components")
            .select("name")
            .eq("id", componentId)
            .single()

          const componentName = component?.name || "Неизвестный компонент"
          addLog(
            `[Контекст] Обработка демо "${demoName}" (ID: ${demoId}) с компонентом "${componentName}" (ID: ${componentId})...`,
          )

          const { data: response, error: invokeError } =
            await supabase.functions.invoke("generate-embeddings", {
              body: {
                type: "usage_context",
                componentId: componentId,
                demoId: demoId,
              },
            })

          if (invokeError) {
            addLog(
              `[Контекст] Ошибка при генерации для демо ${demoId} с компонентом ${componentId}: ${invokeError.message}`,
            )
          } else {
            addLog(
              `[Контекст] Успешно сгенерирован контекстный эмбединг для демо ${demoId} с компонентом ${componentId}`,
            )

            // Выводим весь объект ответа в консоль для отладки
            console.log(
              "Полный ответ от функции generate-embeddings:",
              response,
            )

            // Добавляем полный ответ в лог
            addLog(`[ОТЛАДКА] Полный ответ: ${formatObjectForLog(response)}`)

            // Используем response.data вместо response
            const result = response.data

            if (result && result.description) {
              // Показываем полное описание, а не превью
              addLog(
                `[Контекст] Сгенерировано описание (полностью):\n"${result.description}"`,
              )
            }

            // Показываем полный промпт, а не превью
            if (result && result.prompt_preview) {
              addLog(
                `[Контекст] Промпт для AI (полностью):\n"${result.prompt_preview}"`,
              )
              // Добавляем оригинальный текст без ... после превью
              const originalPrompt = result.prompt_preview.replace(
                /\.\.\.$/,
                "",
              )
              addLog(`[ПРОМПТ] ${originalPrompt}`)
            }

            // Показываем полный текст для эмбединга, а не превью
            if (result && result.embedding_text_preview) {
              addLog(
                `[Контекст] Текст для эмбединга (полностью):\n"${result.embedding_text_preview}"`,
              )
              // Добавляем оригинальный текст без ... после превью
              const originalEmbeddingText =
                result.embedding_text_preview.replace(/\.\.\.$/, "")
              addLog(`[ЭМБЕДИНГ] ${originalEmbeddingText}`)
            }
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          addLog(
            `[Контекст] Исключение для контекста ${demo.id}/${demo.component_id}: ${errorMessage}`,
          )
        }

        processed++
        setContextsProgress(Math.floor((processed / contextData.length) * 100))
      }

      addLog(`Завершена генерация ${processed} контекстных эмбедингов`)
      toast.success(`Успешно сгенерированы ${processed} контекстных эмбедингов`)
    } catch (error) {
      console.error("Error generating context embeddings:", error)
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      addLog(`Ошибка генерации контекстных эмбедингов: ${errorMessage}`)
      toast.error(
        `Не удалось сгенерировать контекстные эмбединги: ${errorMessage}`,
      )
    } finally {
      setIsGeneratingContexts(false)
    }
  }

  return (
    <div className="container py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-8">Generate Embeddings</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="demos">Demos</TabsTrigger>
            <TabsTrigger value="contexts">Usage Contexts</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="components">
            <Card>
              <CardHeader>
                <CardTitle>Component Embeddings</CardTitle>
                <CardDescription>
                  Generate embeddings for all public components. This will
                  enhance search capabilities by creating AI-powered
                  descriptions and vector embeddings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isGeneratingComponents && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Processing {componentsProgress}% (
                      {Math.floor((componentsTotal * componentsProgress) / 100)}
                      /{componentsTotal})
                    </p>
                    <Progress value={componentsProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={generateComponentEmbeddings}
                  disabled={isGeneratingComponents}
                >
                  {isGeneratingComponents
                    ? "Generating..."
                    : "Generate Component Embeddings"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="demos">
            <Card>
              <CardHeader>
                <CardTitle>Demo Embeddings</CardTitle>
                <CardDescription>
                  Generate embeddings for all demos. This will create searchable
                  vectors based on demo usage patterns and functionality.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isGeneratingDemos && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Processing {demosProgress}% (
                      {Math.floor((demosTotal * demosProgress) / 100)}/
                      {demosTotal})
                    </p>
                    <Progress value={demosProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={generateDemoEmbeddings}
                  disabled={isGeneratingDemos}
                >
                  {isGeneratingDemos
                    ? "Generating..."
                    : "Generate Demo Embeddings"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="contexts">
            <Card>
              <CardHeader>
                <CardTitle>Usage Context Embeddings</CardTitle>
                <CardDescription>
                  Generate embeddings for component usage contexts in demos.
                  This will improve component recommendations based on specific
                  usage patterns.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isGeneratingContexts && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Processing {contextsProgress}% (
                      {Math.floor((contextsTotal * contextsProgress) / 100)}/
                      {contextsTotal})
                    </p>
                    <Progress value={contextsProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={generateContextEmbeddings}
                  disabled={isGeneratingContexts}
                >
                  {isGeneratingContexts
                    ? "Generating..."
                    : "Generate Context Embeddings"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Generation Logs</CardTitle>
                <CardDescription>
                  View logs from the embedding generation process.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md max-h-[500px] overflow-y-auto font-mono text-sm">
                  {logs.length === 0 ? (
                    <p className="text-muted-foreground">
                      No logs yet. Start a generation process to see logs.
                    </p>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="pb-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  onClick={() => setLogs([])}
                  disabled={logs.length === 0}
                >
                  Clear Logs
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
