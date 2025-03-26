export type IdeOption = "cursor" | "windsurf" | "cline"
export type OsType = "windows" | "mac" | "linux"

interface McpCommandConfig {
  command: string
  args: string[]
}

const PACKAGE_NAMES = {
  CLI: "@21st-dev/cli@latest",
  MAGIC_MCP: "@21st-dev/magic-mcp",
} as const

export const getMcpConfig = (apiKey: string): McpCommandConfig => ({
  command: "npx",
  args: ["-y", PACKAGE_NAMES.CLI, `API_KEY="${apiKey}"`],
})

export const getInstallCommand = (
  ide: IdeOption,
  apiKey: string,
  osType: OsType,
): string => {
  const windowsPrefix =
    osType === "windows" ? "C:\\Windows\\System32\\cmd.exe /c " : ""

  return `${windowsPrefix}npx -y ${PACKAGE_NAMES.CLI} install ${ide} --api-key "${apiKey}"`
}

export const getMcpConfigJson = (apiKey: string, osType: OsType): string => {
  const config = {
    mcpServers: {
      "@21st-dev-magic-mcp": {
        command:
          osType === "windows" ? "C:\\Windows\\System32\\cmd.exe" : "npx",
        args: [
          ...(osType === "windows" ? ["/c", "npx"] : []),
          "-y",
          PACKAGE_NAMES.CLI,
          `API_KEY="${apiKey}"`,
        ],
      },
    },
  }
  return JSON.stringify(config, null, 2)
}
