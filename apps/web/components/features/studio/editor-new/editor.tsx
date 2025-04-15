import {
  SandpackFileExplorer,
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from "@codesandbox/sandpack-react"
import { useTheme } from "next-themes"
import { autocompletion, completionKeymap } from "@codemirror/autocomplete"

export const Editor = () => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  // Define Tailwind classes for autocompletion styling
  const darkTooltipClasses = "!bg-gray-800 !text-white !border-none"
  const lightTooltipClasses = "!bg-white !text-gray-800 !border-none"
  const darkOptionClasses = "!text-gray-100"
  const lightOptionClasses = "!text-gray-700"

  return (
    <div className="h-full w-full">
      <SandpackProvider
        theme={resolvedTheme as "light" | "dark"}
        template="react-ts"
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
        }}
      >
        <SandpackLayout>
          <SandpackFileExplorer />
          <SandpackCodeEditor
            showLineNumbers={false}
            showTabs={false}
            extensions={[
              autocompletion({
                tooltipClass: () =>
                  isDark ? darkTooltipClasses : lightTooltipClasses,
                optionClass: () =>
                  isDark ? darkOptionClasses : lightOptionClasses,
              }),
            ]}
            extensionsKeymap={[completionKeymap]}
          />
          <SandpackPreview showRefreshButton />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  )
}

// Add this to your global CSS file:
// .cm-tooltip-autocomplete-dark {
//   background-color: #2d2d2d !important;
//   color: #fff !important;
//   border-color: #444 !important;
// }
// .cm-tooltip-autocomplete-dark .cm-completionLabel,
// .cm-tooltip-autocomplete-dark .cm-completionDetail {
//   color: #fff !important;
// }
// .cm-completion-option-dark.cm-completionIcon {
//   color: #ddd !important;
// }
