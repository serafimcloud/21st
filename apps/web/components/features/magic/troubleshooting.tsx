"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Hammer } from "lucide-react"
import { useState, useEffect } from "react"

interface TroubleshootingSectionProps {
  selectedOS?: "windows" | "mac"
  selectedIde?: "cursor" | "cline" | "windsurf"
}

export function TroubleshootingSection({
  selectedOS = "mac",
  selectedIde = "cursor",
}: TroubleshootingSectionProps) {
  const [os, setOs] = useState<"windows" | "mac">(selectedOS)
  const [latestVersion, setLatestVersion] = useState<string>("0.0.34")

  // Fetch latest version from npm registry
  useEffect(() => {
    async function fetchLatestVersion() {
      try {
        const response = await fetch(
          "https://registry.npmjs.org/@21st-dev/magic",
        )
        const data = await response.json()
        if (data && data["dist-tags"] && data["dist-tags"].latest) {
          setLatestVersion(data["dist-tags"].latest)
        }
      } catch (error) {
        console.error("Failed to fetch latest version", error)
      }
    }

    fetchLatestVersion()
  }, [])

  // Log the selectedIde value to debug
  useEffect(() => {
    console.log("TroubleshootingSection received selectedIde:", selectedIde)
  }, [selectedIde])

  const commonIssues = [
    {
      problem: "Client closed",
      solutions: [
        `Go to MCP configuration`,
        `Use explicit version number: "npx -y @21st-dev/magic@${latestVersion}" instead of "@latest"`,
      ],
    },
    {
      problem: "No tools found error",
      solutions: [
        "Update npm to the latest version: npm install -g npm@latest",
        "Restart your IDE after adding the MCP server",
        "Make sure your API key is correctly entered in the configuration",
        "Check internet connection and firewall settings",
      ],
    },
    {
      problem: "Magic Agent doesn't respond to commands",
      solutions: [
        "Try using /21 instead of /ui in your IDE's chat",
        "Ensure you're in agent mode, not regular chat mode",
        "Verify that the MCP server shows a green status light",
        "Try restarting your IDE",
      ],
    },
  ]

  const windowsIssues = [
    {
      problem: "Command parsing errors on Windows",
      solutions: [
        "Ensure you include C:\\Windows\\System32\\cmd.exe /c before the npx command",
        "Check for proper escaping of quotes in your command",
        "Try closing and reopening Cursor after adding the MCP server",
      ],
    },
    {
      problem: "Timeout waiting for EverythingProvider error",
      solutions: [
        "Update npm to the latest version: npm install -g npm@latest",
        "Check your internet connection",
        "Temporarily disable firewall or antivirus to test",
      ],
    },
  ]

  const macIssues = [
    {
      problem: "Request timed out error on Mac",
      solutions: [
        "Check your internet connection",
        "Try running the command directly in terminal to see specific errors",
        "Restart your IDE",
      ],
    },
  ]

  const ideIssues = {
    cursor: [
      {
        problem: "Cursor crashes after adding MCP",
        solutions: [
          "Update Cursor to the latest version",
          "Try reinstalling the MCP with the correct command",
          "Delete and recreate the MCP configuration",
        ],
      },
    ],
    windsurf: [
      {
        problem: "Conflicts with existing MCPs in Windsurf",
        solutions: [
          "Remove all existing Magic MCP entries from your configuration",
          "Use the specific Windsurf installation command",
          "Check your mcp_config.json file for duplicate entries",
        ],
      },
      {
        problem: "Magic Agent doesn't respond in Windsurf",
        solutions: [
          "Magic MCP only works with Windsurf Next beta",
          "Ensure you're using the latest version of Windsurf Next",
        ],
      },
    ],
    cline: [
      {
        problem: "MCP server list errors in Cline",
        solutions: [
          "These errors can safely be ignored and don't affect functionality in Cline",
          "The MCP integration with Cline is still in beta and these messages are normal",
        ],
      },
    ],
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={os}
        onValueChange={(value) => setOs(value as "mac" | "windows")}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 mb-4 rounded-md h-7 p-0.5 w-[200px]">
          <TabsTrigger className="text-xs h-6" value="mac">
            Mac OS
          </TabsTrigger>
          <TabsTrigger className="text-xs h-6" value="windows">
            Windows
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div>
        <h4 className="text-lg font-medium mb-2">Common Issues</h4>
        <div className="space-y-4">
          {commonIssues.map((issue, index) => (
            <div key={index} className="rounded-md border bg-card p-3">
              <p className="font-medium mb-2">{issue.problem}</p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {issue.solutions.map((solution, sIndex) => (
                  <li key={sIndex}>{solution}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium mb-2">
          {os === "windows" ? "Windows-Specific Issues" : "Mac-Specific Issues"}
        </h4>
        <div className="space-y-4">
          {(os === "windows" ? windowsIssues : macIssues).map(
            (issue, index) => (
              <div key={index} className="rounded-md border bg-card p-3">
                <p className="font-medium mb-2">{issue.problem}</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {issue.solutions.map((solution, sIndex) => (
                    <li key={sIndex}>{solution}</li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium mb-2">IDE-Specific Issues</h4>
        <Tabs defaultValue={selectedIde} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 rounded-md h-7 p-0.5">
            <TabsTrigger className="text-xs h-6" value="cursor">
              Cursor
            </TabsTrigger>
            <TabsTrigger className="text-xs h-6" value="windsurf">
              Windsurf
            </TabsTrigger>
            <TabsTrigger className="text-xs h-6" value="cline">
              Cline
            </TabsTrigger>
          </TabsList>
          {Object.entries(ideIssues).map(([ide, issues]) => (
            <TabsContent key={ide} value={ide} className="space-y-4">
              {issues.map((issue, index) => (
                <div key={index} className="rounded-md border bg-card p-3">
                  <p className="font-medium mb-2">{issue.problem}</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {issue.solutions.map((solution, sIndex) => (
                      <li key={sIndex}>{solution}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
