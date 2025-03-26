"use client"

import { Button } from "@/components/ui/button"
import { IdeOption, OsType } from "@/app/magic/onboarding/page.client"
import { ApiKey } from "@/types/global"
import { Code } from "@/components/ui/code"
import {
  Copy,
  Check,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Hammer,
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { Icons } from "@/components/icons"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import { getInstallCommand, getMcpConfigJson } from "@/lib/config/magic-mcp"

interface InstallIdeStepProps {
  apiKey: ApiKey | null
  selectedIde: IdeOption
  osType: OsType
  onComplete: (action: "next" | "troubleshooting") => void
  onGenerateApiKey?: () => Promise<void>
}

export function InstallIdeStep({
  apiKey,
  selectedIde,
  osType,
  onComplete,
  onGenerateApiKey,
}: InstallIdeStepProps) {
  const [copied, setCopied] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState(false)
  const [copiedApiKey, setCopiedApiKey] = useState(false)
  const [currentSubStep, setCurrentSubStep] = useState<number>(1)
  const [clineState, setClineState] = useState<"none" | "command" | "api">(
    "none",
  )
  const firstCopyDone = useRef(false)

  // Add useEffect for auto-copy
  useEffect(() => {
    if (!apiKey || firstCopyDone.current) return

    const autoCopy = () => {
      if (selectedIde === "cursor") {
        handleCopy()
      } else if (selectedIde === "cline") {
        if (clineState === "none") {
          handleCopy()
          setClineState("command")
        }
      } else if (selectedIde === "windsurf") {
        handleCopyConfig()
      }
      firstCopyDone.current = true
    }

    autoCopy()
  }, [apiKey, selectedIde])

  // Add useEffect for focus tracking
  useEffect(() => {
    const handleFocus = () => {
      if (selectedIde === "cline" && clineState === "command" && apiKey) {
        handleCopyApiKey()
        setClineState("api")
      }
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [selectedIde, clineState, apiKey])

  const command = apiKey
    ? getInstallCommand(selectedIde, apiKey.key, osType)
    : ""

  // Add keyboard shortcut for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        onComplete("next")
      } else if (
        e.code === "KeyH" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey
      ) {
        e.preventDefault()
        onComplete("troubleshooting")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onComplete])

  const handleCopy = () => {
    if (!apiKey) return
    try {
      const textArea = document.createElement("textarea")
      textArea.value = command
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      toast.success("Command copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleCopyConfig = () => {
    if (!apiKey) return
    try {
      const config = getMcpConfigJson(apiKey.key, osType)
      const textArea = document.createElement("textarea")
      textArea.value = config
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopiedConfig(true)
      toast.success("Configuration copied to clipboard")
      setTimeout(() => setCopiedConfig(false), 2000)
    } catch (err) {
      console.error("Failed to copy config:", err)
    }
  }

  const handleCopyApiKey = () => {
    if (!apiKey) return
    try {
      const textArea = document.createElement("textarea")
      textArea.value = apiKey.key
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopiedApiKey(true)
      toast.success("API Key copied to clipboard")
      setTimeout(() => setCopiedApiKey(false), 2000)
    } catch (err) {
      console.error("Failed to copy API key:", err)
    }
  }

  const getIdeInstructions = () => {
    switch (selectedIde) {
      case "cursor":
        return (
          <div className="space-y-6">
            <Tabs defaultValue="auto">
              <TabsList className="rounded-md h-7 p-0.5">
                <TabsTrigger value="auto" className="text-xs h-6">
                  Auto
                </TabsTrigger>
                <TabsTrigger value="manual" className="text-xs h-6">
                  Manual
                </TabsTrigger>
              </TabsList>
              <TabsContent value="auto" className="flex flex-col gap-4">
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div className="space-y-3 w-full">
                      <h3 className="font-medium">Run Installation Command</h3>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>Run this command in your terminal:</p>
                        <div className="bg-muted rounded-md flex items-center w-full group relative">
                          <input
                            type="text"
                            readOnly
                            value={getInstallCommand(
                              selectedIde,
                              apiKey?.key || "",
                              osType,
                            )}
                            className="bg-transparent px-3 py-2 text-xs w-full font-mono focus:outline-none overflow-x-auto"
                          />
                          <button
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-primary/10 rounded-md transition-colors shrink-0 mr-1"
                            onClick={handleCopy}
                          >
                            {copied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-green-500" />
                                <span className="text-xs text-green-500">
                                  Copied!
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span className="text-xs">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div className="space-y-3 w-full">
                      <h3 className="font-medium text-base sm:text-lg">
                        Verify Connection
                      </h3>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>Use keyboard shortcut to open settings:</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1">
                            <kbd className="pointer-events-none h-5 text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[11px] leading-none font-sans">
                              {osType === "windows" ? "Ctrl" : "⌘"}
                            </kbd>
                            +
                            <kbd className="pointer-events-none h-5 min-w-5 justify-center text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[13px] leading-none font-sans">
                              ,
                            </kbd>
                          </div>
                          <span className="text-xs">
                            (
                            {osType === "windows"
                              ? "Windows"
                              : osType === "mac"
                                ? "Mac"
                                : "Linux"}
                            )
                          </span>
                        </div>
                        <p className="mt-2">Navigate to:</p>
                        <p className="text-primary font-medium break-words text-sm sm:text-base">
                          Cursor → Full Settings → MCP
                        </p>
                        <div className="flex items-center gap-2 text-sm mt-4">
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          <span>
                            Magic MCP should now be available in the server list
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="manual" className="mt-4">
                <div className="text-sm text-muted-foreground space-y-4">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                        1
                      </div>
                      <div className="space-y-3 w-full">
                        <h3 className="font-medium">Open MCP Settings</h3>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <p>Use keyboard shortcut to open settings:</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1">
                              <kbd className="pointer-events-none h-5 text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 inline-flex text-[11px] leading-none font-sans">
                                {osType === "windows" ? "Ctrl" : "⌘"}
                              </kbd>
                              +
                              <kbd className="pointer-events-none h-5 min-w-5 justify-center text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 inline-flex text-[13px] leading-none font-sans">
                                ,
                              </kbd>
                            </div>
                          </div>
                          <p className="mt-2">Navigate to:</p>
                          <p className="text-primary font-medium break-words text-sm sm:text-base">
                            Cursor → Full Settings → MCP
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                        2
                      </div>
                      <div className="space-y-3 w-full">
                        <h3 className="font-medium">
                          Add MCP Server Configuration
                        </h3>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <div className="flex items-start gap-2.5 text-sm">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>
                              Click "+ Add new global MCP server" button
                            </span>
                          </div>
                          <div className="flex items-start gap-2.5 text-sm">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>
                              Copy paste this code into opened mcp.json
                            </span>
                          </div>
                          {apiKey ? (
                            <div className="relative">
                              <Code
                                language="json"
                                className="overflow-x-auto bg-muted"
                                display="block"
                                code={getMcpConfigJson(apiKey.key, osType)}
                              />
                              <button
                                className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 hover:bg-primary/10 rounded-md transition-colors"
                                onClick={handleCopyConfig}
                              >
                                {copiedConfig ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                    <span className="text-xs text-green-500">
                                      Copied!
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span className="text-xs">Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                              Generate an API key first
                            </div>
                          )}
                          <div className="flex items-start gap-2.5 text-sm">
                            <RefreshCw className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>
                              Cursor will automatically detect and initialize
                              the MCP server
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )
      case "windsurf":
        return (
          <div className="space-y-4">
            <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="text-sm text-yellow-500 flex-1">
                  Note: MCP is only available in Windsurf Next (Beta){" "}
                </div>
                <a
                  href="https://codeium.com/windsurf/download-next"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-yellow-500 underline hover:text-yellow-400"
                >
                  Download Windsurf Next
                </a>
              </div>
            </div>

            <Tabs defaultValue="auto">
              <TabsList className="rounded-md h-7 p-0.5">
                <TabsTrigger value="auto" className="text-xs h-6">
                  Auto
                </TabsTrigger>
                <TabsTrigger value="manual" className="text-xs h-6">
                  Manual
                </TabsTrigger>
              </TabsList>
              <TabsContent value="auto" className="flex flex-col gap-4">
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div className="space-y-3 w-full">
                      <h3 className="font-medium">Run Installation Command</h3>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>Run this command in your terminal:</p>
                        <div className="bg-muted rounded-md flex items-center w-full group relative">
                          <input
                            type="text"
                            readOnly
                            value={getInstallCommand(
                              selectedIde,
                              apiKey?.key || "",
                              osType,
                            )}
                            className="bg-transparent px-3 py-2 text-xs w-full font-mono focus:outline-none overflow-x-auto"
                          />
                          <button
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-primary/10 rounded-md transition-colors shrink-0 mr-1"
                            onClick={handleCopy}
                          >
                            {copied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-green-500" />
                                <span className="text-xs text-green-500">
                                  Copied!
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span className="text-xs">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div className="space-y-3 w-full">
                      <h3 className="font-medium">Verify Connection</h3>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>Find the toolbar above the Cascade input:</p>
                        <Image
                          src="https://mintlify.s3.us-west-1.amazonaws.com/codeium/assets/windsurf/cascade/evergreen-toolbar-mcp.png"
                          alt="Windsurf MCP toolbar"
                          className="rounded-xl border my-2 w-full mix-blend-difference"
                          width={600}
                          height={128}
                        />
                        <div className="flex items-center gap-2 text-sm mt-4">
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          <span>
                            Magic MCP should now be available in the MCP server
                            list
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="manual" className="mt-4">
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div className="space-y-3 w-full">
                      <h3 className="font-medium">Open MCP Configuration</h3>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>Find the toolbar above the Cascade input:</p>
                        <Image
                          src="https://mintlify.s3.us-west-1.amazonaws.com/codeium/assets/windsurf/cascade/evergreen-toolbar-mcp.png"
                          alt="Windsurf MCP toolbar"
                          className="rounded-xl border my-2 w-full mix-blend-difference"
                          width={600}
                          height={128}
                        />
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              1. Click the hammer{" "}
                              <span className="text-xs bg-primary/10 rounded-md p-1">
                                <Hammer className="h-3.5 w-3.5 text-primary" />
                              </span>
                              icon
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>2. Click "Configure" button</span>
                          </div>
                          <p className="mt-1">This will open:</p>
                          <Code
                            className="text-primary bg-muted px-2 py-0.5 rounded text-xs break-all"
                            code="~/.codeium/windsurf-next/mcp_config.json"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div className="space-y-3 w-full">
                      <h3 className="font-medium">
                        Add Magic MCP Configuration
                      </h3>
                      <div className="text-sm text-muted-foreground space-y-2 w-full max-w-[600px]">
                        <p>
                          Add the following configuration to your MCP config
                          file:
                        </p>
                        {apiKey ? (
                          <div className="relative">
                            <Code
                              language="json"
                              className="overflow-x-auto bg-muted"
                              display="block"
                              code={getMcpConfigJson(apiKey.key, osType)}
                            />
                            <button
                              className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 hover:bg-primary/10 rounded-md transition-colors"
                              onClick={handleCopyConfig}
                            >
                              {copiedConfig ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                  <span className="text-xs text-green-500">
                                    Copied!
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span className="text-xs">Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                            Generate an API key first
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div className="space-y-3 w-full">
                      <h3 className="font-medium">Refresh MCP Servers</h3>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>After saving the configuration:</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            <RefreshCw className="h-3.5 w-3.5 text-primary" />
                            <span>Click "Refresh" in the MCP toolbar</span>
                          </div>
                          <p className="text-muted-foreground mt-2">
                            The toolbar should now show Magic MCP server as
                            available
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )
      case "cline":
        return (
          <div className="space-y-4">
            <Tabs defaultValue="auto">
              <TabsList className="rounded-md h-7 p-0.5">
                <TabsTrigger value="auto" className="text-xs h-6">
                  Auto
                </TabsTrigger>
                <TabsTrigger value="manual" className="text-xs h-6">
                  Manual
                </TabsTrigger>
              </TabsList>
              <TabsContent value="auto" className="mt-4">
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div className="space-y-3 w-full">
                      <h3 className="font-medium">Run Installation Command</h3>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>Run this command in your terminal:</p>
                        <div className="bg-muted rounded-md flex items-center w-full group relative">
                          <input
                            type="text"
                            readOnly
                            value={getInstallCommand(
                              selectedIde,
                              apiKey?.key || "",
                              osType,
                            )}
                            className="bg-transparent px-3 py-2 text-xs w-full font-mono focus:outline-none overflow-x-auto"
                          />
                          <button
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-primary/10 rounded-md transition-colors shrink-0 mr-1"
                            onClick={handleCopy}
                          >
                            {copied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-green-500" />
                                <span className="text-xs text-green-500">
                                  Copied!
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span className="text-xs">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="manual" className="mt-4">
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div className="space-y-3 w-full">
                      <h3 className="font-medium">Open MCP Server Panel</h3>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                          In the Cline extension, locate and click the MCP
                          Server tab.
                        </p>
                        <Image
                          src="/cline-first-step.png"
                          alt="Cline MCP Server Panel"
                          width={0}
                          height={0}
                          sizes="100vw"
                          className="rounded-lg border w-full h-auto mix-blend-difference"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div className="space-y-3 w-full">
                      <h3 className="font-medium">Configure MCP Server</h3>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                          Click the "Configure MCP Servers" button and add this
                          configuration:
                        </p>
                        {apiKey ? (
                          <div className="relative">
                            <Code
                              language="json"
                              className="overflow-x-auto bg-muted"
                              display="block"
                              code={getMcpConfigJson(apiKey.key, osType)}
                            />
                            <button
                              className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 hover:bg-primary/10 rounded-md transition-colors"
                              onClick={handleCopyConfig}
                            >
                              {copiedConfig ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                  <span className="text-xs text-green-500">
                                    Copied!
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span className="text-xs">Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                            Generate an API key first
                          </div>
                        )}
                        <div className="space-y-1.5 mt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="h-3.5 w-3.5 text-green-500" />
                            <span>Save the configuration</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <RefreshCw className="h-3.5 w-3.5 text-primary" />
                            <span>
                              Cline will automatically detect the changes and
                              start the MCP server
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="text-sm text-yellow-500">
                  Note: MCP server list errors can be safely ignored. Cline's
                  MCP integration is in beta and we're working on improvements.
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  // Early in the component, we'll add a fallback UI for when API key is missing
  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight">API Key Missing</h1>
          <p className="text-lg text-muted-foreground">
            We couldn't find your API key, which is required to use Magic MCP.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {onGenerateApiKey && (
            <Button
              onClick={onGenerateApiKey}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Generate API Key
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => onComplete("troubleshooting")}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Go to Troubleshooting
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-8 px-4 max-w-[700px] mx-auto w-full">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Install Magic MCP</h1>
        <p className="text-lg text-muted-foreground">
          Follow these steps to install Magic MCP in{" "}
          {selectedIde === "cursor"
            ? "Cursor"
            : selectedIde === "windsurf"
              ? "Windsurf"
              : "Cline"}
        </p>
      </div>

      <div className="bg-card rounded-lg max-w-3xl">{getIdeInstructions()}</div>

      <div className="sticky bottom-5 w-full pt-8 pb-4">
        <div className="flex justify-center w-full gap-2">
          <Button
            variant="outline"
            onClick={() => onComplete("troubleshooting")}
            className="pr-1.5"
          >
            Need help?
            <kbd className="pointer-events-none h-5 w-5 justify-center select-none items-center gap-1 rounded border-muted-foreground/40 bg-foreground/10 px-1.5 ml-1.5 font-sans text-[11px] text-foreground leading-none opacity-100 flex">
              H
            </kbd>
          </Button>
          <Button className="pr-1.5" onClick={() => onComplete("next")}>
            Continue
            <kbd className="pointer-events-none h-5 w-5 justify-center select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100 flex">
              <Icons.enter className="h-2.5 w-2.5" />
            </kbd>
          </Button>
        </div>
      </div>
    </div>
  )
}
