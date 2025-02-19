"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiKey } from "@/types/global"
import { Code } from "@/components/ui/code"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Icons } from "@/components/icons"

interface IdeInstructionsProps {
  apiKey: ApiKey | null
}

export function IdeInstructions({ apiKey }: IdeInstructionsProps) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="cursor" className="space-y-4">
        <TabsList className="flex gap-2">
          <TabsTrigger
            value="cursor"
            className="flex flex-col items-center gap-1.5 min-w-[100px]"
          >
            <Icons.cursorLogo className="h-5 w-5" />
            <span className="text-sm">Cursor</span>
          </TabsTrigger>
          <TabsTrigger
            value="windsurf"
            className="flex flex-col items-center gap-1.5 min-w-[100px]"
          >
            <Icons.windsurfTealLogo className="h-5 w-5" />
            <span className="text-sm">Windsurf</span>
          </TabsTrigger>
          <TabsTrigger
            value="vscode"
            className="flex flex-col items-center gap-1.5 min-w-[100px]"
          >
            <Icons.vscode className="h-5 w-5" />
            <span className="text-sm">VSCode + CLI</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cursor">
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Install the Magic extension from the Cursor marketplace
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                After installation, add your API key to the extension settings:
              </p>
              {apiKey ? (
                <Code
                  code={`{
  "magic.apiKey": "${apiKey.key}"
}`}
                  language="json"
                />
              ) : (
                <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  Generate an API key first
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="windsurf">
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Magic is built into Windsurf. Just add your API key in settings.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Open Windsurf settings and add your API key:
              </p>
              {apiKey ? (
                <Code
                  code={`{
  "magic.apiKey": "${apiKey.key}"
}`}
                  language="json"
                />
              ) : (
                <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  Generate an API key first
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vscode">
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Install the Magic CLI and VSCode extension
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                1. Install the CLI:
              </p>
              <Code code="npm install -g @21st/magic-cli" language="bash" />
              <p className="text-sm text-muted-foreground mt-4">
                2. Set up your API key:
              </p>
              {apiKey ? (
                <Code
                  code={`magic config set apiKey ${apiKey.key}`}
                  language="bash"
                />
              ) : (
                <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  Generate an API key first
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-4">
                3. Install the VSCode extension from the marketplace
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
