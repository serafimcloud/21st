"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiKey } from "@/types/global"
import { Code } from "@/components/ui/code"

import { Icons } from "@/components/icons"
import { CursorDark } from "@/components/icons/cursor-dark"

import Image from "next/image"

import { Copy, Check, RefreshCw, AlertTriangle, Hammer } from "lucide-react"
import { useState, useEffect } from "react"

interface IdeInstructionsProps {
  apiKey: ApiKey | null
  selectedOS: "windows" | "mac"
}

export function IdeInstructions({ apiKey, selectedOS }: IdeInstructionsProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("cursor")

  const getCommandForTab = (tab: string) => {
    if (!apiKey) return ""

    const windowsPrefix =
      selectedOS === "windows" ? "C:\\Windows\\System32\\cmd.exe /c " : ""

    switch (tab) {
      case "cursor":
        return `${windowsPrefix}npx -y @smithery/cli@latest run @21st-dev/magic-mcp --config "{\\\"TWENTY_FIRST_API_KEY\\\":\\\"${apiKey.key}\\\"}"`
      case "windsurf":
        return `${windowsPrefix}npx -y @smithery/cli@latest install @21st-dev/magic-mcp --client windsurf`
      case "cline":
        return `${windowsPrefix}npx -y @smithery/cli@latest install @21st-dev/magic-mcp --client cline`
      default:
        return ""
    }
  }

  const handleCopy = async () => {
    if (!apiKey) return
    try {
      await navigator.clipboard.writeText(getCommandForTab(activeTab))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs
        defaultValue="cursor"
        className="space-y-4"
        onValueChange={setActiveTab}
      >
        <TabsList className="min-h-[56px] rounded-md p-0.5 h-auto flex-wrap gap-2 sm:h-[56px] w-full sm:w-auto">
          <TabsTrigger
            value="cursor"
            className="flex flex-col items-center justify-center min-h-[52px] text-[12px] w-full sm:w-auto px-4"
          >
            <div className="bg-black rounded-md flex items-center justify-center p-1 mb-1">
              <CursorDark className="h-4 w-4" />
            </div>
            <span>Cursor</span>
          </TabsTrigger>
          <TabsTrigger
            value="windsurf"
            className="flex flex-col items-center justify-center min-h-[52px] text-[12px] w-full sm:w-auto px-4"
          >
            <Icons.windsurfTealLogo className="h-6 w-10 mb-1" />
            <span>Windsurf</span>
          </TabsTrigger>

          <TabsTrigger
            value="cline"
            className="flex flex-col items-center justify-center min-h-[52px] text-[12px] w-full sm:w-auto px-4"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Icons.vscode className="w-5 h-5" />
              <span className="text-sm text-neutral-400">+</span>
              <div className="flex items-center justify-center bg-gradient-to-b from-[#0E0F0F] to-[#0C0C0C] overflow-hidden rounded border border-white/10 w-[24px] h-[24px]">
                <Image
                  src="https://avatars.githubusercontent.com/u/184127137?s=200&v=4"
                  alt="Cline"
                  width={24}
                  height={24}
                  className="mix-blend-difference"
                />
              </div>
            </div>
            <span>VSCode + Cline</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cursor">
          <div className="space-y-4">
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="space-y-3 flex-1">
                  <h3 className="font-medium text-base sm:text-lg">
                    Open Cursor Settings
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Use keyboard shortcut:</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        <kbd className="pointer-events-none h-5 text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[11px] leading-none font-sans">
                          {selectedOS === "windows" ? "Ctrl" : "⌘"}
                        </kbd>
                        +
                        <kbd className="pointer-events-none h-5 min-w-5 justify-center text-muted-foreground select-none items-center gap-1 rounded border bg-muted px-1.5 opacity-100 flex text-[13px] leading-none font-sans">
                          ,
                        </kbd>
                      </div>
                      <span className="text-xs">
                        ({selectedOS === "windows" ? "Windows" : "Mac"})
                      </span>
                    </div>
                    <p className="mt-2">Navigate to:</p>
                    <p className="text-primary font-medium break-words text-sm sm:text-base">
                      Cursor → Full Settings → Features → MCP Servers
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium">Add MCP Server</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Click "+ Add New MCP Server" and fill in:</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Name:</span>
                        <Code
                          className="text-primary bg-muted px-2 py-0.5 rounded text-xs"
                          code={"Magic"}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Type:</span>
                        <Code
                          className="text-primary bg-muted px-2 py-0.5 rounded text-xs"
                          code={"command"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="space-y-3 w-full">
                  <h3 className="font-medium">Add Magic Command</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Paste into Command field:</p>
                    {apiKey ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="bg-muted rounded-md flex-1 flex items-center w-full group relative">
                          <input
                            type="text"
                            readOnly
                            value={getCommandForTab("cursor")}
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
                    ) : (
                      <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground w-full">
                        Generate an API key first
                      </div>
                    )}
                    <div className="space-y-1.5 mt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        <span>Click Save</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <RefreshCw className="h-3.5 w-3.5 text-primary" />
                        <span>Refresh tools list</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="windsurf">
          <div className="space-y-4">
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="space-y-3 w-full">
                  <h3 className="font-medium">Open MCP Configuration</h3>
                  <div className="text-sm text-muted-foreground space-y-2 w-full">
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
                        code="~/.codeium/windsurf/mcp_config.json"
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
                  <h3 className="font-medium">Add Magic MCP Configuration</h3>
                  <div className="text-sm text-muted-foreground space-y-2 w-full max-w-[600px]">
                    <p>
                      Add the following configuration to your MCP config file:
                    </p>
                    {apiKey ? (
                      <Code
                        code={`{
  "mcpServers": {
    "magic": {
      "command": "npx",
      "args": [
        "-y",
        "@smithery/cli@latest",
        "install",
        "@21st-dev/magic-mcp",
        "--client",
        "windsurf"
      ],
      "env": {
        "TWENTY_FIRST_API_KEY": "${apiKey.key}"
      }
    }
  }
}`}
                        language="json"
                        className=" overflow-x-auto bg-muted"
                        display="block"
                      />
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
                <div className="space-y-3">
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
          </div>
        </TabsContent>

        <TabsContent value="cline">
          <div className="space-y-4">
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium">Open MCP Server Panel</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      In the Cline extension, locate and click the MCP Server
                      tab.
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
                  <h3 className="font-medium">Edit MCP Settings</h3>
                  <div className="text-sm text-muted-foreground space-y-2 w-full max-w-[600px]">
                    <p>
                      Click the "Configure MCP Servers" button to open the
                      configuration file.
                    </p>
                    {apiKey ? (
                      <Code
                        code={`{
  "mcpServers": {
    "magic": {
      "command": "npx",
      "args": [
        "-y",
        "@smithery/cli@latest",
        "install",
        "@21st-dev/magic-mcp",
        "--client",
        "cline"
      ],
      "env": {
        "TWENTY_FIRST_API_KEY": "${apiKey.key}"
      }
    }
  }
}`}
                        language="json"
                        className="overflow-x-auto bg-muted"
                        display="block"
                      />
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
                <div className="space-y-3">
                  <h3 className="font-medium">Save and Apply Settings</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>After saving the configuration:</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <RefreshCw className="h-3.5 w-3.5 text-primary" />
                        <span>
                          Cline will automatically detect the changes and start
                          the MCP server
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3 max-w-[600px]">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <div className="text-sm text-yellow-500">
                          Note: Cline's MCP integration is currently in beta and
                          may behave unexpectedly. We're actively working with
                          the Cline team on improvements.
                        </div>
                      </div>
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
}
