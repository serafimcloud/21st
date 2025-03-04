"use client"

import { Button } from "@/components/ui/button"
import { IdeOption, OsType } from "@/app/magic/onboarding/page.client"
import { ApiKey } from "@/types/global"
import { Code } from "@/components/ui/code"
import { Copy, Check, ArrowRight, AlertTriangle, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Icons } from "@/components/icons"

interface InstallIdeStepProps {
  apiKey: ApiKey | null
  selectedIde: IdeOption
  osType: OsType
  onComplete: () => void
}

export function InstallIdeStep({
  apiKey,
  selectedIde,
  osType,
  onComplete,
}: InstallIdeStepProps) {
  const [copied, setCopied] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState(false)
  const [currentSubStep, setCurrentSubStep] = useState<number>(1)

  const getCommandForIde = () => {
    if (!apiKey) return ""

    const windowsPrefix =
      osType === "windows" ? "C:\\Windows\\System32\\cmd.exe /c " : ""

    switch (selectedIde) {
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

  // Add keyboard shortcut for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        onComplete()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onComplete])


  const handleCopy = async () => {
    if (!apiKey) return
    try {
      await navigator.clipboard.writeText(getCommandForIde())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleCopyConfig = async () => {
    if (!apiKey) return
    try {
      const config = `{
  "mcpServers": {
    "@21st-dev-magic-mcp": {
      "command": "${osType === "windows" ? "C:\\\\Windows\\\\System32\\\\cmd.exe" : "npx"}",
      "args": [
        ${osType === "windows" ? '"/c",' : ""} 
        ${osType === "windows" ? '"npx",' : ""}
        "-y",
        "@smithery/cli@latest",
        "run",
        "@21st-dev/magic-mcp",
        "--config",
        "\\"{\\\\"TWENTY_FIRST_API_KEY\\\\":\\\\"${apiKey?.key || "YOUR_API_KEY"}\\\\"}\\"" 
      ]
    }
  }
}`
      await navigator.clipboard.writeText(config)
      setCopiedConfig(true)
      setTimeout(() => setCopiedConfig(false), 2000)
    } catch (err) {
      console.error("Failed to copy config:", err)
    }
  }

  const getIdeInstructions = () => {
    switch (selectedIde) {
      case "cursor":
        return (
          <div className="space-y-6">
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
                    Cursor → Full Settings → Features → MCP Servers
                  </p>
                </div>
              </div>
            </div>

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
                          value={getCommandForIde()}
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
                                Copied
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
                    <div className="text-yellow-500 flex items-center gap-2 text-sm">
                      <span>
                        API key not found. Please go back and get an API key
                        first.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      case "windsurf":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                1
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="font-medium text-base sm:text-lg">
                  Install Magic MCP Extension
                </h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Run this command in your terminal:</p>
                  {apiKey ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="bg-muted rounded-md flex-1 flex items-center w-full group relative">
                        <input
                          type="text"
                          readOnly
                          value={getCommandForIde()}
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
                                Copied
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
                    <div className="text-yellow-500 flex items-center gap-2 text-sm">
                      <span>
                        API key not found. Please go back and get an API key
                        first.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                2
              </div>
              <div className="space-y-3 w-full">
                <h3 className="font-medium">Configure MCP Server</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Click the "Configure MCP Servers" button and add
                    this configuration:
                  </p>
                  <Code
                    language="json"
                    className="overflow-x-auto bg-muted text-xs"
                    code={`{
  "mcpServers": {
    "@21st-dev-magic-mcp": {
      "command": "${osType === "windows" ? "C:\\\\Windows\\\\System32\\\\cmd.exe" : "npx"}",
      "args": [
        ${osType === "windows" ? '"/c",' : ""} 
        ${osType === "windows" ? '"npx",' : ""}
        "-y",
        "@smithery/cli@latest",
        "run",
        "@21st-dev/magic-mcp",
        "--config",
        "\\"{\\\\"TWENTY_FIRST_API_KEY\\\\":\\\\"${apiKey?.key || "YOUR_API_KEY"}\\\\"}\\"" 
      ]
    }
  }
}`}
                  />
                  <button
                    className="flex items-center gap-1.5 px-2 py-1 hover:bg-primary/10 rounded-md transition-colors mt-2"
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
                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span>Save the configuration</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <RefreshCw className="h-3.5 w-3.5 text-primary" />
                      <span>
                        Windsurf will automatically detect the changes and
                        start the MCP server
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3 max-w-[600px]">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="text-sm text-yellow-500">
                  Note: MCP server list errors can be safely ignored. Windsurf's
                  MCP integration is in beta and we're working on
                  improvements.
                </div>
              </div>
            </div>
          </div>
        )
      case "cline":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                1
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="font-medium text-base sm:text-lg">
                  Install Magic MCP Extension
                </h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Run this command in your terminal:</p>
                  {apiKey ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="bg-muted rounded-md flex-1 flex items-center w-full group relative">
                        <input
                          type="text"
                          readOnly
                          value={getCommandForIde()}
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
                                Copied
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
                    <div className="text-yellow-500 flex items-center gap-2 text-sm">
                      <span>
                        API key not found. Please go back and get an API key
                        first.
                      </span>
                    </div>
                  )}
                  <div className="mt-4">
                    <div className="rounded-lg border overflow-hidden">
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
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                2
              </div>
              <div className="space-y-3 w-full">
                <h3 className="font-medium">Configure MCP Server</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Click the "Configure MCP Servers" button and add
                    this configuration:
                  </p>
                  <Code
                    language="json"
                    className="overflow-x-auto bg-muted text-xs"
                    code={`{
  "mcpServers": {
    "@21st-dev-magic-mcp": {
      "command": "${osType === "windows" ? "C:\\\\Windows\\\\System32\\\\cmd.exe" : "npx"}",
      "args": [
        ${osType === "windows" ? '"/c",' : ""} 
        ${osType === "windows" ? '"npx",' : ""}
        "-y",
        "@smithery/cli@latest",
        "run",
        "@21st-dev/magic-mcp",
        "--config",
        "\\"{\\\\"TWENTY_FIRST_API_KEY\\\\":\\\\"${apiKey?.key || "YOUR_API_KEY"}\\\\"}\\"" 
      ]
    }
  }
}`}
                  />
                  <button
                    className="flex items-center gap-1.5 px-2 py-1 hover:bg-primary/10 rounded-md transition-colors mt-2"
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

            <div className="mt-4 rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3 max-w-[600px]">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="text-sm text-yellow-500">
                  Note: MCP server list errors can be safely ignored. Cline's
                  MCP integration is in beta and we're working on
                  improvements.
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col space-y-8 px-4">
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

      <div className="bg-card border rounded-lg p-6 max-w-3xl">
        {getIdeInstructions()}
      </div>

      <div className="flex justify-center w-full mt-8">
        <Button onClick={onComplete}>
          Continue
          <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-muted leading-none opacity-100 flex">
            <Icons.enter className="h-2.5 w-2.5" />
          </kbd>
        </Button>
      </div>
    </div>
  )
}
