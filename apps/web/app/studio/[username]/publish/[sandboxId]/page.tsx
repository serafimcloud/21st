import { Sandpack } from "@codesandbox/sandpack-react"

export default function PublishPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Publish Your Sandbox</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <Sandpack
          template="react"
          theme="light"
          options={{
            showNavigator: true,
            showLineNumbers: true,
            showInlineErrors: true,
            showConsole: true,
            showConsoleButton: true,
          }}
          files={{
            "/App.js": {
              code: `import React from 'react'

export default function App() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Hello World</h1>
      <p className="mt-2">Welcome to your sandbox!</p>
    </div>
  )
}`,
            },
          }}
        />
      </div>
    </div>
  )
}
