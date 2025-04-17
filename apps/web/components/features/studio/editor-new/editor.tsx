import {
  SandpackFileExplorer,
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from "@codesandbox/sandpack-react"
import { useTheme } from "next-themes"
import { autocompletion, completionKeymap } from "@codemirror/autocomplete"
import { files } from "./utils/sandpack-files"
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
        files={files}
        theme={resolvedTheme as "light" | "dark"}
        template="vite-react-ts"
        // options={{
        //   externalResources: ["https://cdn.tailwindcss.com"],
        // }}
        customSetup={{
          dependencies: {
            // default Sandpack dependencies written explicitly
            react: "^18.3.1",
            "react-dom": "^18.2.0",
          },
          devDependencies: {
            // default Sandpack dependencies written explicitly
            "@types/react": "^18.0.28",
            "@types/react-dom": "^18.0.11",
            "@vitejs/plugin-react": "^4.1.4",
            typescript: "^4.9.5",
            vite: "4.1.4",
            "esbuild-wasm": "^0.17.12",
          },
        }}
      >
        <SandpackLayout>
          <SandpackFileExplorer />
          <SandpackCodeEditor
            showLineNumbers={true}
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
