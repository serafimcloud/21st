import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

// Это упрощенная реализация для прототипа - в реальном приложении
// нужна более безопасная и правильная обработка путей

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    // Получаем асинхронные params
    const resolvedParams = await params

    // Безопасное получение имени компонента
    const componentName = resolvedParams?.name || ""
    console.log("Request for component:", componentName)

    // Валидация имени компонента (простая, для примера)
    if (!componentName || !/^[a-zA-Z0-9-_]+$/.test(componentName)) {
      return NextResponse.json(
        { error: "Invalid component name" },
        { status: 400 },
      )
    }

    // ВНИМАНИЕ: Эта реализация для локальной разработки
    // В производственном режиме компоненты должны передаваться через registryDependencies
    // и не нужно искать их на диске

    // Возможные пути к UI компонентам в проекте
    const basePaths = [
      path.resolve(process.cwd(), "components/ui"),
      path.resolve(process.cwd(), "app/components/ui"),
      path.resolve(process.cwd(), "src/components/ui"),
    ]

    console.log("Checking base paths:", basePaths)

    // Проверяем разные варианты расширений
    const extensions = [".tsx", ".jsx", "/index.tsx", "/index.jsx"]

    let fileContent = null
    let foundPath = null

    // Пробуем найти компонент в разных базовых папках и с разными расширениями
    for (const basePath of basePaths) {
      for (const ext of extensions) {
        const fullPath = path.join(basePath, `${componentName}${ext}`)
        try {
          console.log(`Trying path: ${fullPath}`)
          fileContent = await fs.readFile(fullPath, "utf-8")
          foundPath = fullPath
          console.log(`Found component at: ${fullPath}`)
          break
        } catch (err) {
          // Файл не найден, продолжаем поиск
        }
      }
      if (fileContent) break
    }

    if (!fileContent) {
      console.log(`Component not found: ${componentName}, creating placeholder`)
      // Если компонент не найден, возвращаем заглушку
      const nameCapitalized =
        componentName.charAt(0).toUpperCase() + componentName.slice(1)

      return NextResponse.json({
        content: `
import React from "react";

// ВНИМАНИЕ: Это заглушка для UI компонента.
// В реальном приложении этот компонент должен быть передан через registryDependencies.
// API роут не может найти ui/${componentName} на сервере.

export const ${nameCapitalized} = ({ children, ...props }) => {
  console.warn("Rendering placeholder for ${nameCapitalized}. This component should be included in registryDependencies.");
  return <div {...props} style={{ padding: "1rem", border: "2px dashed #f00", borderRadius: "0.5rem" }}>
    <div style={{ color: "#f00", fontStyle: "italic" }}>
      Placeholder for ${nameCapitalized}. 
      <div style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
        This UI component should be provided via registryDependencies!
      </div>
    </div>
    {children}
  </div>;
};

export default ${nameCapitalized};
        `.trim(),
      })
    }

    return NextResponse.json({ content: fileContent })
  } catch (error) {
    console.error("Error fetching UI component:", error)
    return NextResponse.json(
      { error: "Failed to fetch component" },
      { status: 500 },
    )
  }
}
