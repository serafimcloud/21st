import { Editor } from "@monaco-editor/react"

import { FormField, FormItem, FormControl } from "@/components/ui/form"

import { UseFormReturn } from "react-hook-form"
import { FormData } from "../config/utils"
import { editorOptions } from "../config/editor-themes"
import { editorThemes } from "../config/editor-themes"

type EditorFieldName =
  | keyof Pick<FormData, "code" | "tailwind_config" | "globals_css">
  | `demos.${number}.demo_code`

interface EditorStepProps {
  form: UseFormReturn<FormData>
  isDarkTheme: boolean
  fieldName: EditorFieldName
  value: string
  onChange: (value: string) => void
  language?: string
}

export function EditorStep({
  form,
  isDarkTheme,
  fieldName,
  value,
  onChange,
  language = "typescript",
}: EditorStepProps) {
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="h-full">
          <FormControl>
            <Editor
              defaultLanguage={language}
              value={value}
              onChange={(value) => {
                onChange(value || "")
                field.onChange(value || "")
              }}
              theme={isDarkTheme ? "github-dark" : "github-light"}
              options={{
                ...editorOptions,
                roundedSelection: false,
                minimap: { enabled: false },
                lineNumbers: "on",
                lineNumbersMinChars: 3,
                scrollbar: {
                  vertical: "visible",
                  horizontal: "visible",
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                  useShadows: false,
                },
                padding: { top: 16, bottom: 16 },
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 0,
              }}
              className="h-full w-full bg-muted"
              beforeMount={(monaco) => {
                monaco.editor.defineTheme("github-dark", editorThemes.dark)
                monaco.editor.defineTheme("github-light", editorThemes.light)
              }}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
