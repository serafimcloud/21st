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
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { motion } from "motion/react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, SearchIcon, InfoIcon } from "lucide-react"

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

interface SearchResult {
  id: string
  item_id: number
  item_type: string
  name?: string
  similarity: number
  embedding?: string
  item_details?: {
    id: number
    name: string
    code?: string
    demo_code?: string
    description?: string
    slug?: string
    user_id?: string
    component_id?: number
  }
}

export default function TestEmbeddingsPage() {
  const supabase = useClerkSupabaseClient()
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLogs, setSearchLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchType, setSearchType] = useState<
    "combined" | "component" | "demo"
  >("combined")
  const [hydeDocuments, setHydeDocuments] = useState<{
    component_code: string
    demo_code: string
  } | null>(null)

  const addSearchLog = (message: string) => {
    setSearchLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev,
    ])
  }

  const clearSearchLogs = () => setSearchLogs([])

  const performSearch = async () => {
    if (!query.trim()) {
      toast.error("Please enter a search query")
      return
    }

    setIsLoading(true)
    clearSearchLogs()
    setSearchResults([])
    setHydeDocuments(null)

    try {
      addSearchLog(`Searching for: "${query}" with type: ${searchType}`)

      const { data, error } = await supabase.functions.invoke(
        "search-embeddings",
        {
          body: { query, searchType },
        },
      )

      if (error) {
        addSearchLog(`Error: ${error.message}`)
        toast.error(`Search failed: ${error.message}`)
        return
      }

      addSearchLog(`Search completed successfully`)

      if (data.hyde_documents) {
        setHydeDocuments(data.hyde_documents)
        addSearchLog(`HyDE documents generated:`)
        addSearchLog(`Component code: ${data.hyde_documents.component_code}`)
        addSearchLog(`Demo code: ${data.hyde_documents.demo_code}`)
      }

      if (data.results?.results && Array.isArray(data.results.results)) {
        setSearchResults(data.results.results)
        addSearchLog(`Found ${data.results.results.length} results`)
        data.results.results.forEach((result: SearchResult, index: number) => {
          addSearchLog(
            `Result #${index + 1}: ${result.item_details?.name || "Unnamed"} (${result.item_type}, similarity: ${(result.similarity * 100).toFixed(2)}%)`,
          )
          addSearchLog(
            `Details for #${index + 1}:
             - ID: ${result.item_id}
             - Type: ${result.item_type}
             - Name: ${result.item_details?.name || "Unnamed"}
             - Slug: ${result.item_details?.slug || "No slug"}
             - User ID: ${result.item_details?.user_id || "No user ID"}
            `,
          )
        })
      } else {
        addSearchLog("No results found")
        toast.info("No results found for your query")
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      addSearchLog(`Error: ${errorMessage}`)
      toast.error(`An unexpected error occurred: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Test Embeddings Search</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Search Components & Demos</CardTitle>
            <CardDescription>
              Test the new embeddings search functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter your search query..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && performSearch()}
                  className="w-full"
                />
              </div>
              <Button
                onClick={performSearch}
                disabled={isLoading || !query.trim()}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <SearchIcon className="h-4 w-4 mr-2" /> Search
                  </>
                )}
              </Button>
            </div>

            <div className="mb-4">
              <Tabs
                defaultValue="combined"
                value={searchType}
                onValueChange={(v) =>
                  setSearchType(v as "combined" | "component" | "demo")
                }
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="combined">Combined Search</TabsTrigger>
                  <TabsTrigger value="component">Components Only</TabsTrigger>
                  <TabsTrigger value="demo">Demos Only</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Alert className="mb-4">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>About this page</AlertTitle>
              <AlertDescription>
                This page helps test the new embeddings search functionality.
                Enter a query to search for components and demos using both code
                and usage embeddings.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {hydeDocuments && (
          <Card>
            <CardHeader>
              <CardTitle>HyDE Documents</CardTitle>
              <CardDescription>
                Hypothetical documents generated based on your query
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="component">
                <TabsList>
                  <TabsTrigger value="component">Component Code</TabsTrigger>
                  <TabsTrigger value="demo">Demo Code</TabsTrigger>
                </TabsList>
                <TabsContent value="component">
                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <pre className="text-sm">
                      {hydeDocuments.component_code}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="demo">
                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <pre className="text-sm">{hydeDocuments.demo_code}</pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                Found {searchResults.length} results for your query
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {searchResults.map((result, index) => (
                  <motion.div
                    key={`${result.item_type}-${result.item_id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">
                              {result.item_details?.name || "Unnamed"}
                            </CardTitle>
                            {result.item_details?.slug &&
                              result.item_details?.user_id && (
                                <a
                                  href={`https://21st.dev/${result.item_details.user_id}/${result.item_details.slug}${result.item_type === "demo" ? "/demo" : ""}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-500 hover:underline"
                                >
                                  View on 21st.dev
                                </a>
                              )}
                          </div>
                          <div className="text-sm font-medium">
                            Similarity: {(result.similarity * 100).toFixed(2)}%
                          </div>
                        </div>
                        <CardDescription>
                          {result.item_type === "demo" &&
                          result.item_details?.name
                            ? `Demo for ${result.item_details.name}`
                            : `${result.item_type.charAt(0).toUpperCase() + result.item_type.slice(1)}`}
                          {" - "}
                          {result.embedding === "code_embeddings"
                            ? "Code Match"
                            : "Usage Match"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {result.item_details?.description && (
                          <p className="text-sm mb-2">
                            {result.item_details.description}
                          </p>
                        )}
                        {(result.item_details?.code ||
                          result.item_details?.demo_code) && (
                          <ScrollArea className="h-[100px] rounded-md border p-2">
                            <pre className="text-xs">
                              {result.item_details?.code ||
                                result.item_details?.demo_code}
                            </pre>
                          </ScrollArea>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Search Logs</CardTitle>
            <CardDescription>Logs from the search operation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSearchLogs}
                disabled={searchLogs.length === 0}
              >
                Clear Logs
              </Button>
            </div>
            <ScrollArea className="h-[300px] rounded-md border p-4">
              {searchLogs.length > 0 ? (
                <div className="space-y-2">
                  {searchLogs.map((log, index) => (
                    <div
                      key={index}
                      className="text-sm font-mono whitespace-pre-wrap"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No logs yet. Perform a search to see logs here.
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
