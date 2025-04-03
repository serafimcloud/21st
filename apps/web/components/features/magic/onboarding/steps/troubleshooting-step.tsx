"use client"

import { Button } from "@/components/ui/button"
import { IdeOption, OsType } from "@/app/magic/onboarding/page.client"
import { ArrowLeft } from "lucide-react"
import { useEffect, useState } from "react"
import { Icons } from "@/components/icons"
import { OnboardingStep } from "@/app/magic/onboarding/page.client"

interface TroubleshootingStepProps {
  selectedIde: IdeOption
  osType: OsType
  previousStep: OnboardingStep
  onComplete: (returnToStep: OnboardingStep) => void
}

export function TroubleshootingStep({
  selectedIde,
  osType,
  previousStep,
  onComplete,
}: TroubleshootingStepProps) {
  const [latestVersion, setLatestVersion] = useState<string>("0.0.34")

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

  // Add keyboard shortcut for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        onComplete(previousStep)
      }
      if (e.key.toLowerCase() === "c") {
        e.preventDefault()
        window.open("https://discord.gg/Qx4rFunHfm", "_blank")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onComplete, previousStep])

  // Common issues for all IDEs
  const commonIssues = [
    {
      problem: "Client closed",
      solutions: [
        `Go to MCP config and use explicit version number: npx -y @21st-dev/magic@${latestVersion} instead of latest`,
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

  // OS-specific issues
  const osIssues = {
    windows: [
      {
        problem: "Command parsing errors on Windows",
        solutions: [
          "Ensure you include C:\\Windows\\System32\\cmd.exe /c before the npx command",
          "Check for proper escaping of quotes in your command",
          "Try closing and reopening your IDE after adding the MCP server",
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
    ],
    mac: [
      {
        problem: "Request timed out error on Mac",
        solutions: [
          "Check your internet connection",
          "Try running the command directly in terminal to see specific errors",
          "Restart your IDE",
        ],
      },
    ],
  }

  // IDE-specific issues
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

  const currentOsIssues = osType === "windows" ? osIssues.windows : osIssues.mac
  const currentIdeIssues = ideIssues[selectedIde]

  return (
    <div className="flex flex-col space-y-8 px-4 max-w-[700px] mx-auto w-full z-10">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Troubleshooting</h1>
        <p className="text-lg text-muted-foreground">
          Common issues and solutions for{" "}
          {selectedIde === "cursor"
            ? "Cursor"
            : selectedIde === "windsurf"
              ? "Windsurf"
              : "Cline"}{" "}
          on {osType === "windows" ? "Windows" : "Mac"}
        </p>
      </div>

      <div className="space-y-8">
        {/* Common Issues */}
        <div>
          <h4 className="text-lg font-medium mb-4">Common Issues</h4>
          <div className="space-y-4">
            {commonIssues.map((issue, index) => (
              <div key={index} className="rounded-md border bg-card p-4">
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

        {/* OS-Specific Issues */}
        <div>
          <h4 className="text-lg font-medium mb-4">
            {osType === "windows" ? "Windows" : "Mac"}-Specific Issues
          </h4>
          <div className="space-y-4">
            {currentOsIssues.map((issue, index) => (
              <div key={index} className="rounded-md border bg-card p-4">
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

        {/* IDE-Specific Issues */}
        <div>
          <h4 className="text-lg font-medium mb-4">
            {selectedIde === "cursor"
              ? "Cursor"
              : selectedIde === "windsurf"
                ? "Windsurf"
                : "Cline"}
            -Specific Issues
          </h4>
          <div className="space-y-4">
            {currentIdeIssues.map((issue, index) => (
              <div key={index} className="rounded-md border bg-card p-4">
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
      </div>

      <div className="sticky bottom-5 w-full pt-8 pb-4">
        <div className="flex justify-center w-full gap-4">
          <Button onClick={() => onComplete(previousStep)} className="p-1.5">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to{" "}
            {previousStep === "install-ide"
              ? "installation"
              : "component creation"}
            <kbd className="pointer-events-none h-5 w-5 justify-center select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100 flex">
              <Icons.enter className="h-2.5 w-2.5" />
            </kbd>
          </Button>
          <Button
            onClick={() =>
              window.open("https://discord.gg/Qx4rFunHfm", "_blank")
            }
            variant="outline"
            className="pr-1.5"
          >
            <Icons.discord className="h-4 w-4 mr-2" />
            Ask community
            <kbd className="pointer-events-none h-5 w-5 justify-center select-none items-center gap-1 rounded border-muted-foreground/40 bg-foreground/10 px-1.5 ml-1.5 font-sans text-[11px] text-foreground leading-none opacity-100 flex">
              C
            </kbd>
          </Button>
        </div>
      </div>
    </div>
  )
}
