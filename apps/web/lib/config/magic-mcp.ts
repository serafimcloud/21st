export type IdeOption = "cursor" | "windsurf" | "cline"
export type OsType = "windows" | "mac" | "linux"

interface McpCommandConfig {
  command: string
  args: string[]
}

export const getMcpConfig = (apiKey: string): McpCommandConfig => ({
  command: "npx",
  args: ["-y", "@21st-dev/magic@latest", `API_KEY="${apiKey}"`],
})

export const getInstallCommand = (
  ide: IdeOption,
  apiKey: string,
  osType: OsType,
): string => {
  const windowsPrefix =
    osType === "windows" ? "C:\\Windows\\System32\\cmd.exe /c " : ""

  switch (ide) {
    case "cursor":
      return `${windowsPrefix}npx -y @21st-dev/cli@latest install cursor --api-key "${apiKey}"`
    case "windsurf":
      return `${windowsPrefix}npx -y @21st-dev/cli@latest install windsurf --api-key "${apiKey}"`
    case "cline":
      return `${windowsPrefix}npx -y @21st-dev/cli@latest install cline --api-key "${apiKey}"`
    default:
      return ""
  }
}

export const getMcpConfigJson = (apiKey: string): string => {
  const config = {
    mcpServers: {
      "@21st-dev-magic-mcp": {
        ...getMcpConfig(apiKey),
      },
    },
  }
  return JSON.stringify(config, null, 2)
}
