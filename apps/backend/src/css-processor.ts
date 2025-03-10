import endent from "endent"
import tailwindcss from "tailwindcss"
import postcss from "postcss"
import * as ts from "typescript"
import { merge } from "lodash"

export const compileCSS = async ({
  jsx,
  baseTailwindConfig,
  customTailwindConfig,
  baseGlobalCss,
  customGlobalCss,
}: {
  jsx: string
  baseTailwindConfig: string
  customTailwindConfig?: string
  baseGlobalCss?: string
  customGlobalCss?: string
}) => {
  try {
    const globalCss = endent`
      ${baseGlobalCss}
      ${customGlobalCss ?? ""}
    `

    const baseConfigObj = Function(
      "require",
      "module",
      `
      module.exports = ${baseTailwindConfig};
      return module.exports;
    `,
    )(require, { exports: {} })

    if (customTailwindConfig) {
      try {
        const transpiledCustomTailwindConfig = ts.transpileModule(
          customTailwindConfig,
          {
            compilerOptions: {
              target: ts.ScriptTarget.ES2015,
              module: ts.ModuleKind.CommonJS,
              removeComments: true,
            },
          },
        ).outputText

        const matches = transpiledCustomTailwindConfig.match(
          /([\s\S]*?)(module\.exports\s*=\s*({[\s\S]*?});)([\s\S]*)/,
        )

        if (!matches) {
          console.warn(
            "Invalid Tailwind config format: Could not parse configuration object. Falling back to base config.",
          )
          return await processCSS(jsx, baseConfigObj, globalCss)
        }

        const [_, beforeConfig, __, configObject, afterConfig] = matches

        try {
          const customConfigObj = Function(
            "require",
            "module",
            `
            ${beforeConfig || ""}
            module.exports = ${configObject};
            ${afterConfig || ""}
            return module.exports;
          `,
          )(require, { exports: {} })

          const mergedConfig = merge(baseConfigObj, customConfigObj)
          const serializedConfig = serializeConfig(mergedConfig)

          const finalConfig = endent`
            ${beforeConfig || ""}
            module.exports = ${serializedConfig};
            ${afterConfig || ""}
          `

          try {
            const evaluatedFinalConfig = Function(
              "require",
              "module",
              `
              ${finalConfig};
              return module.exports;
            `,
            )(require, { exports: {} })

            return await processCSS(jsx, evaluatedFinalConfig, globalCss)
          } catch (evalError) {
            console.warn(
              `Error evaluating final Tailwind config: ${evalError instanceof Error ? evalError.message : String(evalError)}. Falling back to base config.`,
            )
            return await processCSS(jsx, baseConfigObj, globalCss)
          }
        } catch (functionError) {
          console.warn(
            `Error processing custom Tailwind config: ${functionError instanceof Error ? functionError.message : String(functionError)}. Falling back to base config.`,
          )
          return await processCSS(jsx, baseConfigObj, globalCss)
        }
      } catch (transpileError) {
        console.warn(
          `Error transpiling custom Tailwind config: ${transpileError instanceof Error ? transpileError.message : String(transpileError)}. Falling back to base config.`,
        )
        return await processCSS(jsx, baseConfigObj, globalCss)
      }
    }

    try {
      const evaluatedBaseConfig = Function(
        "require",
        "module",
        `
        module.exports = ${baseTailwindConfig};
        return module.exports;
      `,
      )(require, { exports: {} })

      return await processCSS(jsx, evaluatedBaseConfig, globalCss)
    } catch (baseConfigError) {
      throw new Error(
        `Error processing base Tailwind config: ${baseConfigError instanceof Error ? baseConfigError.message : String(baseConfigError)}`,
      )
    }
  } catch (error) {
    console.error("Detailed CSS compilation error:", {
      error,
      jsx: jsx.slice(0, 200) + "...",
      customTailwindConfig: customTailwindConfig?.slice(0, 200) + "...",
      customGlobalCss: customGlobalCss?.slice(0, 200) + "...",
    })
    throw error
  }
}

const serializeConfig = (config: any) => {
  let serializedConfig = JSON.stringify(
    config,
    (key, value) => {
      if (typeof value === "function") {
        return value.name || value.toString()
      }
      return value
    },
    2,
  )

  return serializedConfig.replace(
    /"(function[\s\S]*?\{[\s\S]*?\}|[\w]+)"/g,
    (match, functionContent) => {
      if (functionContent.startsWith("function")) {
        return functionContent
          .replace(/\\"/g, '"')
          .replace(/\\n/g, "\n")
          .replace(/\\\\/g, "\\")
      }

      if (
        config.plugins?.some(
          (plugin: Function) => plugin.name === functionContent,
        )
      ) {
        return functionContent
      }

      return `"${functionContent}"`
    },
  )
}

const processCSS = async (jsx: string, config: object, globalCss: string) => {
  try {
    const result = await postcss([
      tailwindcss({
        ...config,
        content: [{ raw: jsx, extension: "tsx" }],
      }),
    ]).process(globalCss, {
      from: undefined,
    })
    return result.css
  } catch (error) {
    throw new Error(
      `PostCSS processing error: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
