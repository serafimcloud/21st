"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { motion } from "motion/react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

// Helper function to add delay between requests
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Function to format object for log display
const formatObjectForLog = (obj: any): string => {
  try {
    return typeof obj === "string"
      ? obj
      : JSON.stringify(obj, null, 2).substring(0, 1000) + "..."
  } catch (error) {
    return `[Unable to format object: ${error}]`
  }
}

// Interface for component
interface Component {
  id: number
  name: string
  code: string
}

// Interface for demo
interface Demo {
  id: number
  name: string
  demo_code: string
  component_id: number
}

export default function GenerateEmbeddingsPage() {
  const supabase = useClerkSupabaseClient()
  const [activeTab, setActiveTab] = useState("component-code")

  const [isGeneratingComponentCode, setIsGeneratingComponentCode] =
    useState(false)
  const [isGeneratingDemoCode, setIsGeneratingDemoCode] = useState(false)
  const [isGeneratingComponentUsage, setIsGeneratingComponentUsage] =
    useState(false)
  const [isGeneratingDemoUsage, setIsGeneratingDemoUsage] = useState(false)

  const [componentCodeProgress, setComponentCodeProgress] = useState(0)
  const [demoCodeProgress, setDemoCodeProgress] = useState(0)
  const [componentUsageProgress, setComponentUsageProgress] = useState(0)
  const [demoUsageProgress, setDemoUsageProgress] = useState(0)

  const [componentCodeLogs, setComponentCodeLogs] = useState<string[]>([])
  const [demoCodeLogs, setDemoCodeLogs] = useState<string[]>([])
  const [componentUsageLogs, setComponentUsageLogs] = useState<string[]>([])
  const [demoUsageLogs, setDemoUsageLogs] = useState<string[]>([])

  const addComponentCodeLog = (message: string) => {
    const now = new Date()
    const timestamp = now.toLocaleTimeString()
    setComponentCodeLogs((prev) => [...prev, `[${timestamp}] ${message}`])
  }

  const addDemoCodeLog = (message: string) => {
    const now = new Date()
    const timestamp = now.toLocaleTimeString()
    setDemoCodeLogs((prev) => [...prev, `[${timestamp}] ${message}`])
  }

  const addComponentUsageLog = (message: string) => {
    const now = new Date()
    const timestamp = now.toLocaleTimeString()
    setComponentUsageLogs((prev) => [...prev, `[${timestamp}] ${message}`])
  }

  const addDemoUsageLog = (message: string) => {
    const now = new Date()
    const timestamp = now.toLocaleTimeString()
    setDemoUsageLogs((prev) => [...prev, `[${timestamp}] ${message}`])
  }

  // Clear logs
  const clearComponentCodeLogs = () => setComponentCodeLogs([])
  const clearDemoCodeLogs = () => setDemoCodeLogs([])
  const clearComponentUsageLogs = () => setComponentUsageLogs([])
  const clearDemoUsageLogs = () => setDemoUsageLogs([])

  // Check if embeddings exist for a component
  const checkComponentEmbeddingsExist = async (componentId: number) => {
    // Check code embeddings
    const { data: codeEmbedding, error: codeError } = await supabase
      .from("code_embeddings")
      .select("id")
      .eq("item_id", componentId)
      .eq("item_type", "component")
      .maybeSingle()

    // Check usage embeddings
    const { data: usageEmbedding, error: usageError } = await supabase
      .from("usage_embeddings")
      .select("id")
      .eq("item_id", componentId)
      .eq("item_type", "component")
      .maybeSingle()

    return {
      codeExists: !!codeEmbedding,
      usageExists: !!usageEmbedding,
    }
  }

  // Check if embeddings exist for a demo
  const checkDemoEmbeddingsExist = async (demoId: number) => {
    // Check code embeddings
    const { data: codeEmbedding, error: codeError } = await supabase
      .from("code_embeddings")
      .select("id")
      .eq("item_id", demoId)
      .eq("item_type", "demo")
      .maybeSingle()

    // Check usage embeddings
    const { data: usageEmbedding, error: usageError } = await supabase
      .from("usage_embeddings")
      .select("id")
      .eq("item_id", demoId)
      .eq("item_type", "demo")
      .maybeSingle()

    return {
      codeExists: !!codeEmbedding,
      usageExists: !!usageEmbedding,
    }
  }

  // Generate code embeddings for components
  const generateComponentCodeEmbeddings = async () => {
    if (isGeneratingComponentCode) return
    setIsGeneratingComponentCode(true)
    setComponentCodeProgress(0)
    clearComponentCodeLogs()
    addComponentCodeLog("Starting component code embeddings generation...")

    try {
      // Get all components
      const { data: components, error: componentsError } = await supabase
        .from("components")
        .select("id, name, code")
        .order("id")

      if (componentsError) throw componentsError

      if (!components || components.length === 0) {
        addComponentCodeLog("No components found for code embedding generation")
        setIsGeneratingComponentCode(false)
        return
      }

      addComponentCodeLog(`Found ${components.length} components to process`)

      let processed = 0
      let totalSuccesses = 0
      let skipped = 0

      for (const component of components) {
        addComponentCodeLog(
          `[Code] Processing ${component.name} (ID: ${component.id})...`,
        )

        try {
          // Check if embeddings already exist
          const { codeExists } = await checkComponentEmbeddingsExist(
            component.id,
          )

          if (codeExists) {
            addComponentCodeLog(
              `[Code] Embeddings already exist for ${component.name}, skipping...`,
            )
            skipped++
            processed++
            setComponentCodeProgress(
              Math.floor((processed / components.length) * 100),
            )
            continue
          }

          // Generate embeddings using the existing "component" type
          // This will generate both usage and code embeddings
          await sleep(500)
          const { data: codeResponse, error: codeError } =
            await supabase.functions.invoke("generate-embeddings", {
              body: {
                type: "component",
                id: component.id,
              },
            })

          // Проверяем ошибку только если это не "Failed to send a request to the Edge Function"
          // или если нет ответа от Edge Function
          if (
            codeError &&
            (!codeError.message.includes(
              "Failed to send a request to the Edge Function",
            ) ||
              !codeResponse)
          ) {
            addComponentCodeLog(
              `[Code] Error generating code embeddings for ${component.name}: ${codeError.message}`,
            )
            // Только для отладки - не показываем пользователю
            console.error(`[Code] Error details:`, codeError)

            processed++
            setComponentCodeProgress(
              Math.floor((processed / components.length) * 100),
            )
            // Увеличиваем задержку после ошибки
            await sleep(2000)
            continue
          }

          // Отмечаем успех даже если была ошибка запроса, но есть ответ
          totalSuccesses++
          addComponentCodeLog(
            `[Code] Successfully generated code embeddings for ${component.name}`,
          )

          processed++
          setComponentCodeProgress(
            Math.floor((processed / components.length) * 100),
          )
        } catch (componentError: any) {
          addComponentCodeLog(
            `[Code] Exception while processing ${component.name}: ${componentError.message || String(componentError)}`,
          )
          addComponentCodeLog(
            `[Code] Continuing with next component after error...`,
          )
          processed++
          setComponentCodeProgress(
            Math.floor((processed / components.length) * 100),
          )
          // Увеличиваем задержку после ошибки
          await sleep(2000)
        }
      }

      addComponentCodeLog(
        `Completed code embedding generation. Successfully processed ${totalSuccesses} of ${processed} components. Skipped ${skipped} components with existing embeddings.`,
      )
      toast.success(
        `Successfully generated code embeddings for ${totalSuccesses} components. Skipped ${skipped} components.`,
      )
    } catch (error: any) {
      console.error("Error generating component code embeddings:", error)
      toast.error(`Error: ${error.message || String(error)}`)
      addComponentCodeLog(`[Error] ${error.message || String(error)}`)
      if (error.stack) {
        addComponentCodeLog(`[Error Stack] ${error.stack}`)
      }
    } finally {
      setIsGeneratingComponentCode(false)
    }
  }

  // Generate code embeddings for demos
  const generateDemoCodeEmbeddings = async () => {
    if (isGeneratingDemoCode) return
    setIsGeneratingDemoCode(true)
    setDemoCodeProgress(0)
    clearDemoCodeLogs()
    addDemoCodeLog("Starting demo code embeddings generation...")

    try {
      // Get all demos
      const { data: demos, error: demosError } = await supabase
        .from("demos")
        .select("id, name, demo_code")
        .order("id")

      if (demosError) throw demosError

      if (!demos || demos.length === 0) {
        addDemoCodeLog("No demos found for code embedding generation")
        setIsGeneratingDemoCode(false)
        return
      }

      addDemoCodeLog(`Found ${demos.length} demos to process`)

      let processed = 0
      let totalSuccesses = 0
      let skipped = 0

      for (const demo of demos) {
        addDemoCodeLog(
          `[Code] Processing demo ${demo.name || "Unnamed"} (ID: ${demo.id})...`,
        )

        try {
          // Check if embeddings already exist
          const { codeExists, usageExists } = await checkDemoEmbeddingsExist(
            demo.id,
          )

          if (codeExists && usageExists) {
            addDemoCodeLog(
              `[Code] Both code and usage embeddings already exist for demo ${demo.id}, skipping...`,
            )
            skipped++
            processed++
            setDemoCodeProgress(Math.floor((processed / demos.length) * 100))
            continue
          }

          // Generate embeddings using the existing "demo" type
          // This will generate usage embeddings for the demo
          await sleep(500)
          const { data: codeResponse, error: codeError } =
            await supabase.functions.invoke("generate-embeddings", {
              body: {
                type: "demo",
                id: demo.id,
              },
            })

          // Проверяем ошибку только если это не "Failed to send a request to the Edge Function"
          // или если нет ответа от Edge Function
          if (
            codeError &&
            (!codeError.message.includes(
              "Failed to send a request to the Edge Function",
            ) ||
              !codeResponse)
          ) {
            addDemoCodeLog(
              `[Code] Error generating code embeddings for demo ${demo.id}: ${codeError.message}`,
            )
            // Только для отладки - не показываем пользователю
            console.error(`[Code] Error details:`, codeError)

            processed++
            setDemoCodeProgress(Math.floor((processed / demos.length) * 100))
            // Увеличиваем задержку после ошибки
            await sleep(2000)
            continue
          }

          // Отмечаем успех даже если была ошибка запроса, но есть ответ
          totalSuccesses++
          addDemoCodeLog(
            `[Code] Successfully generated code embeddings for demo ${demo.id}`,
          )

          processed++
          setDemoCodeProgress(Math.floor((processed / demos.length) * 100))
        } catch (demoError: any) {
          addDemoCodeLog(
            `[Code] Exception while processing demo ${demo.id}: ${demoError.message || String(demoError)}`,
          )
          addDemoCodeLog(`[Code] Continuing with next demo after error...`)
          processed++
          setDemoCodeProgress(Math.floor((processed / demos.length) * 100))
          // Увеличиваем задержку после ошибки
          await sleep(2000)
        }
      }

      addDemoCodeLog(
        `Completed code embedding generation. Successfully processed ${totalSuccesses} of ${processed} demos. Skipped ${skipped} demos with existing embeddings.`,
      )
      toast.success(
        `Successfully generated code embeddings for ${totalSuccesses} demos. Skipped ${skipped} demos.`,
      )
    } catch (error: any) {
      console.error("Error generating demo code embeddings:", error)
      toast.error(`Error: ${error.message || String(error)}`)
      addDemoCodeLog(`[Error] ${error.message || String(error)}`)
      if (error.stack) {
        addDemoCodeLog(`[Error Stack] ${error.stack}`)
      }
    } finally {
      setIsGeneratingDemoCode(false)
    }
  }

  // Generate usage embeddings for components
  const generateComponentUsageEmbeddings = async () => {
    if (isGeneratingComponentUsage) return
    setIsGeneratingComponentUsage(true)
    setComponentUsageProgress(0)
    clearComponentUsageLogs()
    addComponentUsageLog("Starting component usage embeddings generation...")

    try {
      // Get all components
      const { data: components, error: componentsError } = await supabase
        .from("components")
        .select("id, name, code")
        .order("id")

      if (componentsError) throw componentsError

      if (!components || components.length === 0) {
        addComponentUsageLog(
          "No components found for usage embedding generation",
        )
        setIsGeneratingComponentUsage(false)
        return
      }

      addComponentUsageLog(`Found ${components.length} components to process`)

      let processed = 0
      let totalSuccesses = 0
      let skipped = 0

      for (const component of components) {
        addComponentUsageLog(
          `[Usage] Processing ${component.name} (ID: ${component.id})...`,
        )

        try {
          // Check if embeddings already exist
          const { usageExists } = await checkComponentEmbeddingsExist(
            component.id,
          )

          if (usageExists) {
            addComponentUsageLog(
              `[Usage] Embeddings already exist for ${component.name}, skipping...`,
            )
            skipped++
            processed++
            setComponentUsageProgress(
              Math.floor((processed / components.length) * 100),
            )
            continue
          }

          // Generate embeddings using the existing "component" type
          // This will generate both usage and code embeddings
          await sleep(500)
          const { data: usageResponse, error: usageError } =
            await supabase.functions.invoke("generate-embeddings", {
              body: {
                type: "component",
                id: component.id,
              },
            })

          // Проверяем ошибку только если это не "Failed to send a request to the Edge Function"
          // или если нет ответа от Edge Function
          if (
            usageError &&
            (!usageError.message.includes(
              "Failed to send a request to the Edge Function",
            ) ||
              !usageResponse)
          ) {
            addComponentUsageLog(
              `[Usage] Error generating usage embeddings for ${component.name}: ${usageError.message}`,
            )
            // Только для отладки - не показываем пользователю
            console.error(`[Usage] Error details:`, usageError)

            processed++
            setComponentUsageProgress(
              Math.floor((processed / components.length) * 100),
            )
            // Увеличиваем задержку после ошибки
            await sleep(2000)
            continue
          }

          // Отмечаем успех даже если была ошибка запроса, но есть ответ
          totalSuccesses++
          addComponentUsageLog(
            `[Usage] Successfully generated usage embeddings for ${component.name}`,
          )

          if (usageResponse?.data?.usage_description) {
            addComponentUsageLog(
              `[Usage] Generated description:\n${usageResponse.data.usage_description}`,
            )
          }

          processed++
          setComponentUsageProgress(
            Math.floor((processed / components.length) * 100),
          )
        } catch (componentError: any) {
          addComponentUsageLog(
            `[Usage] Exception while processing ${component.name}: ${componentError.message || String(componentError)}`,
          )
          addComponentUsageLog(
            `[Usage] Continuing with next component after error...`,
          )
          processed++
          setComponentUsageProgress(
            Math.floor((processed / components.length) * 100),
          )
          // Увеличиваем задержку после ошибки
          await sleep(2000)
        }
      }

      addComponentUsageLog(
        `Completed usage embedding generation. Successfully processed ${totalSuccesses} of ${processed} components. Skipped ${skipped} components with existing embeddings.`,
      )
      toast.success(
        `Successfully generated usage embeddings for ${totalSuccesses} components. Skipped ${skipped} components.`,
      )
    } catch (error: any) {
      console.error("Error generating component usage embeddings:", error)
      toast.error(`Error: ${error.message || String(error)}`)
      addComponentUsageLog(`[Error] ${error.message || String(error)}`)
      if (error.stack) {
        addComponentUsageLog(`[Error Stack] ${error.stack}`)
      }
    } finally {
      setIsGeneratingComponentUsage(false)
    }
  }

  // Generate usage embeddings for demos
  const generateDemoUsageEmbeddings = async () => {
    if (isGeneratingDemoUsage) return
    setIsGeneratingDemoUsage(true)
    setDemoUsageProgress(0)
    clearDemoUsageLogs()
    addDemoUsageLog("Starting demo usage embeddings generation...")

    try {
      // Get all demos
      const { data: demos, error: demosError } = await supabase
        .from("demos")
        .select("id, name, component_id")
        .order("id")

      if (demosError) throw demosError

      if (!demos || demos.length === 0) {
        addDemoUsageLog("No demos found for usage embedding generation")
        setIsGeneratingDemoUsage(false)
        return
      }

      addDemoUsageLog(`Found ${demos.length} demos to process`)

      let processed = 0
      let totalSuccesses = 0
      let skipped = 0

      for (const demo of demos) {
        addDemoUsageLog(
          `[Usage] Processing demo ${demo.name || "Unnamed"} (ID: ${demo.id})...`,
        )

        try {
          // Check if embeddings already exist
          const { codeExists, usageExists } = await checkDemoEmbeddingsExist(
            demo.id,
          )

          if (codeExists && usageExists) {
            addDemoUsageLog(
              `[Usage] Both code and usage embeddings already exist for demo ${demo.id}, skipping...`,
            )
            skipped++
            processed++
            setDemoUsageProgress(Math.floor((processed / demos.length) * 100))
            continue
          }

          // Generate embeddings using the existing "demo" type
          // This will generate usage embeddings for the demo
          await sleep(500)
          const { data: usageResponse, error: usageError } =
            await supabase.functions.invoke("generate-embeddings", {
              body: {
                type: "demo",
                id: demo.id,
              },
            })

          // Проверяем ошибку только если это не "Failed to send a request to the Edge Function"
          // или если нет ответа от Edge Function
          if (
            usageError &&
            (!usageError.message.includes(
              "Failed to send a request to the Edge Function",
            ) ||
              !usageResponse)
          ) {
            addDemoUsageLog(
              `[Usage] Error generating usage embeddings for demo ${demo.id}: ${usageError.message}`,
            )
            // Только для отладки - не показываем пользователю
            console.error(`[Usage] Error details:`, usageError)

            processed++
            setDemoUsageProgress(Math.floor((processed / demos.length) * 100))
            // Увеличиваем задержку после ошибки
            await sleep(2000)
            continue
          }

          // Отмечаем успех даже если была ошибка запроса, но есть ответ
          totalSuccesses++
          addDemoUsageLog(
            `[Usage] Successfully generated usage embeddings for demo ${demo.id}`,
          )

          if (usageResponse?.data?.usage_description) {
            addDemoUsageLog(
              `[Usage] Generated description:\n${usageResponse.data.usage_description}`,
            )
          }

          processed++
          setDemoUsageProgress(Math.floor((processed / demos.length) * 100))
        } catch (demoError: any) {
          addDemoUsageLog(
            `[Usage] Exception while processing demo ${demo.id}: ${demoError.message || String(demoError)}`,
          )
          addDemoUsageLog(`[Usage] Continuing with next demo after error...`)
          processed++
          setDemoUsageProgress(Math.floor((processed / demos.length) * 100))
          // Увеличиваем задержку после ошибки
          await sleep(2000)
        }
      }

      addDemoUsageLog(
        `Completed usage embedding generation. Successfully processed ${totalSuccesses} of ${processed} demos. Skipped ${skipped} demos with existing embeddings.`,
      )
      toast.success(
        `Successfully generated usage embeddings for ${totalSuccesses} demos. Skipped ${skipped} demos.`,
      )
    } catch (error: any) {
      console.error("Error generating demo usage embeddings:", error)
      toast.error(`Error: ${error.message || String(error)}`)
      addDemoUsageLog(`[Error] ${error.message || String(error)}`)
      if (error.stack) {
        addDemoUsageLog(`[Error Stack] ${error.stack}`)
      }
    } finally {
      setIsGeneratingDemoUsage(false)
    }
  }

  const isGenerating =
    isGeneratingComponentCode ||
    isGeneratingDemoCode ||
    isGeneratingComponentUsage ||
    isGeneratingDemoUsage

  return (
    <motion.div
      className="container py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold mb-6">
        Generate Embeddings for Search
      </h1>

      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>О системе эмбеддингов</AlertTitle>
        <AlertDescription>
          Система создает два типа эмбеддингов для каждого элемента:
          <ul className="list-disc ml-6 mt-2">
            <li>
              <strong>Эмбеддинги использования (Usage)</strong> - описания,
              фокусирующиеся на примерах использования и задачах, которые решает
              компонент. Отвечают на вопрос "когда и как использовать
              компонент".
            </li>
            <li>
              <strong>Эмбеддинги кода (Code)</strong> - эмбеддинги, основанные
              на техническом коде реализации, позволяющие искать по техническим
              деталям.
            </li>
          </ul>
          <p className="mt-2">
            <strong>Важно:</strong> При нажатии на любую кнопку генерации
            создаются оба типа эмбеддингов для выбранных элементов.
          </p>
        </AlertDescription>
      </Alert>

      <Tabs
        defaultValue="component-code"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full mb-6"
      >
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="component-code">Компоненты</TabsTrigger>
          <TabsTrigger value="demo-code">Демо</TabsTrigger>
          <TabsTrigger value="component-usage">
            Компоненты (Описания)
          </TabsTrigger>
          <TabsTrigger value="demo-usage">Демо (Описания)</TabsTrigger>
        </TabsList>

        <TabsContent value="component-code" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Генерация эмбеддингов для компонентов</CardTitle>
              <CardDescription>
                Запустить генерацию эмбеддингов для всех компонентов. Будут
                созданы как эмбеддинги кода, так и эмбеддинги использования.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={generateComponentCodeEmbeddings}
                disabled={isGenerating}
                className="mb-4"
                size="lg"
              >
                {isGeneratingComponentCode
                  ? "Генерация..."
                  : "Сгенерировать эмбеддинги для компонентов"}
              </Button>

              {isGeneratingComponentCode && (
                <div className="mb-4">
                  <Progress
                    value={componentCodeProgress}
                    className="h-2 mb-2"
                  />
                  <p className="text-sm text-gray-500">
                    Прогресс: {componentCodeProgress}%
                  </p>
                </div>
              )}

              <div className="mt-4">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearComponentCodeLogs}
                  >
                    Clear Logs
                  </Button>
                </div>
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  {componentCodeLogs.map((log, index) => (
                    <div key={index} className="mb-2">
                      {log}
                    </div>
                  ))}
                  {componentCodeLogs.length === 0 && (
                    <p className="text-gray-500">
                      No logs yet. Start the embedding generation to see logs.
                    </p>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo-code" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Генерация эмбеддингов для демо</CardTitle>
              <CardDescription>
                Запустить генерацию эмбеддингов для всех демонстраций. Это
                поможет пользователям находить конкретные примеры использования
                компонентов.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={generateDemoCodeEmbeddings}
                disabled={isGenerating}
                className="mb-4"
                size="lg"
              >
                {isGeneratingDemoCode
                  ? "Генерация..."
                  : "Сгенерировать эмбеддинги для демо"}
              </Button>

              {isGeneratingDemoCode && (
                <div className="mb-4">
                  <Progress value={demoCodeProgress} className="h-2 mb-2" />
                  <p className="text-sm text-gray-500">
                    Прогресс: {demoCodeProgress}%
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-md font-semibold">
                    Лог генерации эмбеддингов
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDemoCodeLogs}
                    disabled={isGeneratingDemoCode}
                  >
                    Очистить лог
                  </Button>
                </div>
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  {demoCodeLogs.map((log, index) => (
                    <div key={index} className="mb-2">
                      {log}
                    </div>
                  ))}
                  {demoCodeLogs.length === 0 && (
                    <p className="text-gray-500">
                      Логов пока нет. Запустите генерацию эмбеддингов, чтобы
                      увидеть логи.
                    </p>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="component-usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Генерация описаний использования для компонентов
              </CardTitle>
              <CardDescription>
                Создание альтернативных эмбеддингов, фокусирующихся на том, как
                и когда использовать компоненты. Результат будет содержать
                поисковые запросы.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={generateComponentUsageEmbeddings}
                disabled={isGenerating}
                className="mb-4"
                size="lg"
              >
                {isGeneratingComponentUsage
                  ? "Генерация..."
                  : "Сгенерировать описания использования"}
              </Button>

              {isGeneratingComponentUsage && (
                <div className="mb-4">
                  <Progress
                    value={componentUsageProgress}
                    className="h-2 mb-2"
                  />
                  <p className="text-sm text-gray-500">
                    Прогресс: {componentUsageProgress}%
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-md font-semibold">
                    Лог генерации описаний
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearComponentUsageLogs}
                    disabled={isGeneratingComponentUsage}
                  >
                    Очистить лог
                  </Button>
                </div>
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  {componentUsageLogs.map((log, index) => (
                    <div key={index} className="mb-2">
                      {log}
                    </div>
                  ))}
                  {componentUsageLogs.length === 0 && (
                    <p className="text-gray-500">
                      Логов пока нет. Запустите генерацию описаний, чтобы
                      увидеть логи.
                    </p>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo-usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Генерация описаний использования для демо</CardTitle>
              <CardDescription>
                Создание эмбеддингов для конкретных примеров использования
                компонентов. Поможет пользователям находить решения конкретных
                задач.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={generateDemoUsageEmbeddings}
                disabled={isGenerating}
                className="mb-4"
                size="lg"
              >
                {isGeneratingDemoUsage
                  ? "Генерация..."
                  : "Сгенерировать описания для демо"}
              </Button>

              {isGeneratingDemoUsage && (
                <div className="mb-4">
                  <Progress value={demoUsageProgress} className="h-2 mb-2" />
                  <p className="text-sm text-gray-500">
                    Прогресс: {demoUsageProgress}%
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-md font-semibold">
                    Лог генерации описаний
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDemoUsageLogs}
                    disabled={isGeneratingDemoUsage}
                  >
                    Очистить лог
                  </Button>
                </div>
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  {demoUsageLogs.map((log, index) => (
                    <div key={index} className="mb-2">
                      {log}
                    </div>
                  ))}
                  {demoUsageLogs.length === 0 && (
                    <p className="text-gray-500">
                      Логов пока нет. Запустите генерацию описаний, чтобы
                      увидеть логи.
                    </p>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
