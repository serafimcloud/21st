export type IdeOption = "cursor" | "windsurf" | "cline"
export type OsType = "windows" | "mac" | "linux"

interface McpCommandConfig {
  command: string
  args: string[]
}

const PACKAGE_NAMES = {
  CLI: "@21st-dev/cli@latest",
  MAGIC_MCP: "@21st-dev/magic@latest",
} as const

export const getMcpConfig = (apiKey: string): McpCommandConfig => ({
  command: "npx",
  args: ["-y", PACKAGE_NAMES.CLI, `API_KEY="${apiKey}"`],
})

export const getInstallCommand = (
  ide: IdeOption,
  apiKey: string,
  osType: OsType = "mac",
): string => {
  const platformCmd = createPlatformCommand(
    ["-y", PACKAGE_NAMES.CLI, "install", ide, `--api-key "${apiKey}"`],
    osType,
  )

  return `${platformCmd.command} ${platformCmd.args.join(" ")}`
}

export const getMcpConfigJson = (
  apiKey: string,
  osType: OsType = "mac",
): string => {
  const platformCmd = createPlatformCommand(
    ["-y", PACKAGE_NAMES.MAGIC_MCP, `API_KEY="${apiKey}"`],
    osType,
  )

  const config = {
    mcpServers: {
      "@21st-dev/magic": platformCmd,
    },
  }
  return JSON.stringify(config, null, 2)
}

export const createPlatformCommand = (
  args: string[],
  osType: OsType = "mac",
) => {
  if (osType === "windows") {
    return {
      command: "cmd",
      args: ["/c", "npx", ...args],
    }
  }
  return {
    command: "npx",
    args,
  }
}
