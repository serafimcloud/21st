"use client"

import { Code } from "@/components/ui/code"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ApiDocs() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-sm font-medium">Authentication</h2>
        <Code
          code="x-api-key: your_api_key_here"
          language="bash"
          display="block"
          fontSize="sm"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium">Integration Examples</h2>
        <Tabs defaultValue="next" className="w-full">
          <TabsList className="relative h-auto w-full gap-0.5 bg-transparent p-0 pl-2 justify-start overflow-x-auto flex-nowrap before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border">
            <TabsTrigger
              value="next"
              className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none whitespace-nowrap"
            >
              Next.js
            </TabsTrigger>
            <TabsTrigger
              value="react"
              className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none whitespace-nowrap"
            >
              React
            </TabsTrigger>
            <TabsTrigger
              value="node"
              className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none whitespace-nowrap"
            >
              Node.js
            </TabsTrigger>
          </TabsList>
          <TabsContent value="next" className="mt-6">
            <div className="space-y-4">
              <Code
                code={`// .env
API_KEY=your_api_key_here`}
                language="bash"
                display="block"
                fontSize="sm"
              />
              <Code
                code={`// app/api/components/route.ts
import { NextResponse } from 'next/server'

if (!process.env.API_KEY) {
  throw new Error('API_KEY is not defined')
}

export async function POST(req: Request) {
  const body = await req.json()
  const response = await fetch('https://21st.dev/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.API_KEY
    },
    body: JSON.stringify(body)
  })

  const data = await response.json()
  return NextResponse.json(data)
}`}
                language="typescript"
                display="block"
                fontSize="sm"
              />
              <Code
                code={`// app/components/search.tsx
'use client'

export async function searchComponents(query: string) {
  const res = await fetch('/api/components', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search: query })
  })
  
  if (!res.ok) {
    throw new Error('Failed to search components')
  }
  
  return res.json()
}`}
                language="typescript"
                display="block"
                fontSize="sm"
              />
            </div>
          </TabsContent>
          <TabsContent value="react" className="mt-6">
            <div className="space-y-4">
              <Code
                code={`// .env
VITE_API_KEY=your_api_key_here`}
                language="bash"
                display="block"
                fontSize="sm"
              />
              <Code
                code={`// src/lib/api.ts
const API_KEY = import.meta.env.VITE_API_KEY

export async function searchComponents(query: string) {
  const res = await fetch('https://21st.dev/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({ search: query })
  })

  if (!res.ok) {
    throw new Error('Failed to search components')
  }

  return res.json()
}`}
                language="typescript"
                display="block"
                fontSize="sm"
              />
            </div>
          </TabsContent>
          <TabsContent value="node" className="mt-6">
            <div className="space-y-4">
              <Code
                code={`// .env
API_KEY=your_api_key_here`}
                language="bash"
                display="block"
                fontSize="sm"
              />
              <Code
                code={`// index.js
const express = require('express')
const app = express()

if (!process.env.API_KEY) {
  throw new Error('API_KEY is not defined')
}

app.post('/api/components', async (req, res) => {
  try {
    const response = await fetch('https://21st.dev/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY
      },
      body: JSON.stringify(req.body)
    })

    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to search components' })
  }
})`}
                language="javascript"
                display="block"
                fontSize="sm"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium">Request Format</h2>
        <Code
          code={`{
  "search": "hero section",  // Required: search query
  "page": 1,                // Optional: page number (default: 1)
  "per_page": 20           // Optional: results per page (default: 20)
}`}
          language="json"
          display="block"
          fontSize="sm"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium">Response Format</h2>
        <Code
          code={`{
  "results": [{
    "name": "Default",
    "preview_url": "https://cdn.21st.dev/...",
    "video_url": "https://cdn.21st.dev/...",
    "component_data": {
      "name": "Animated hero",
      "description": "Animated hero with text and two shadcn/ui buttons",
      "code": "https://cdn.21st.dev/...",
      "install_command": "pnpm dlx shadcn@latest add \"https://21st.dev/r/...\""
    },
    "component_user_data": {
      "name": "serafim",
      "username": "serafimcloud", 
      "image_url": "https://img.clerk.com/..."
    },
    "usage_count": 1621
  }],
  "metadata": {
    "plan": "free",
    "requests_remaining": 80,
    "pagination": {
      "total": 45,          // Total number of results
      "page": 1,            // Current page
      "per_page": 20,       // Results per page
      "total_pages": 3      // Total number of pages
    }
  }
}`}
          language="json"
          display="block"
          fontSize="sm"
        />
      </div>
    </div>
  )
}
