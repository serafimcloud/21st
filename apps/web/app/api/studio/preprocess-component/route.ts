import OpenAI from "openai"
import { NextResponse } from "next/server"
import { makeSlugFromName } from "@/components/features/publish-old/hooks/use-is-check-slug-available"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { defaultTailwindConfig, defaultGlobalCss } from "@/lib/sandpack"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Mock response for testing when OpenAI API is not available
const MOCK_RESPONSE = {
  componentName: "ExampleComponent",
  registryType: "ui",
  shadcnImports: ["Button", "Dialog", "Input"],
  nonStandardImports: ["SomeCustomComponent"],
  npmDependencies: ["react", "next", "lucide-react"],
  requiresAdditionalStyles: false,
}

export async function POST(request: Request) {
  try {
    const { code, userId } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: "Component code is required" },
        { status: 400 },
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      )
    }

    // Process the component code with OpenAI
    let result
    try {
      result = await preprocessComponent(code)
    } catch (error) {
      console.error("OpenAI API error:", error)
      // If OpenAI fails, use mock response for testing
      console.log("Using mock response due to OpenAI API unavailability")
      result = MOCK_RESPONSE
    }

    // Generate slug for the component
    const slug = makeSlugFromName(result.componentName)

    // Check if slug is unique
    const isUnique = await checkSlugUnique(slug, userId)

    // If not unique, generate a unique slug
    const finalSlug = isUnique ? slug : await generateUniqueSlug(slug, userId)

    return NextResponse.json({
      ...result,
      slug: finalSlug,
    })
  } catch (error) {
    console.error("Error preprocessing component:", error)
    return NextResponse.json(
      { error: "Failed to preprocess component" },
      { status: 500 },
    )
  }
}

async function preprocessComponent(code: string) {
  // Try to detect component name from code before using OpenAI
  // This is a basic regex approach to find component declarations
  let componentName = extractComponentName(code) || "Component"

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a code analyzer specializing in React components. Analyze the provided React component code and extract the following information:
1. Component name (the function or class name of the component)
2. Registry type: Determine if it belongs to: 
   - 'ui' (basic components like Button, Card, etc.)
   - 'hooks' (custom React hooks)
   - 'blocks' (larger components like hero sections, pricing sections, etc.)
3. Identify any shadcn/ui imports from 'components/ui/' and list their names (one of the following): 
	1.	Accordion
	2.	Alert
	3.	Alert Dialog
	4.	Aspect Ratio
	5.	Avatar
	6.	Badge
	7.	Breadcrumb
	8.	Button
	9.	Calendar
	10.	Card
	11.	Carousel
	12.	Chart
	13.	Checkbox
	14.	Collapsible
	15.	Combobox
	16.	Command
	17.	Context Menu
	18.	Data Table
	19.	Date Picker
	20.	Dialog
	21.	Drawer
	22.	Dropdown Menu
	23.	Form
	24.	Hover Card
	25.	Input
	26.	Input OTP
	27.	Label
	28.	Menubar
	29.	Navigation Menu
	30.	Pagination
	31.	Popover
	32.	Progress
	33.	Radio Group
	34.	Resizable
	35.	Scroll Area
	36.	Select
	37.	Separator
	38.	Sheet
	39.	Sidebar
	40.	Skeleton
	41.	Slider
	42.	Sonner
	43.	Switch
	44.	Table
	45.	Tabs
	46.	Textarea
	47.	Toast
	48.	Toggle
	49.	Toggle Group
	50.	Tooltip
)
4. Identify any non-shadcn/ui component imports (including @/hooks and @/components/[registry]/ components, excluding standart shadcn files like { cn } from "@/lib/utils)
5. List all npm package dependencies used in the component (excluding react, react-dom, tailwindcss, and any packages starting with 'next' or '@/')
6. Analyze if the component requires additional CSS styles beyond what's provided in the default shadcn/ui Tailwind configuration and globals CSS.

Here's the default Tailwind configuration:
\`\`\`js
${defaultTailwindConfig}
\`\`\`

And here's the default globals CSS:
\`\`\`css
${defaultGlobalCss}
\`\`\`

Respond in JSON format only with the following structure:
{
  "componentName": "string",
  "registryType": "ui|hooks|blocks",
  "shadcnImports": ["string"],
  "nonStandardImports": ["string"],
  "npmDependencies": ["string"],
  "requiresAdditionalStyles": boolean
}`,
      },
      {
        role: "user",
        content: code,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  })

  // Handle the case where the content might be undefined
  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error("No content returned from OpenAI")
  }

  return JSON.parse(content)
}

// Helper function to extract component name from code using regex
function extractComponentName(code: string): string | null {
  // Look for function/const component declarations
  const functionMatch = code.match(/function\s+([A-Z][a-zA-Z0-9_]*)/)
  const constMatch = code.match(
    /const\s+([A-Z][a-zA-Z0-9_]*)\s*=\s*(\(|\{|React\.forwardRef)/,
  )
  const exportMatch = code.match(
    /export\s+(?:default\s+)?(?:function|const)\s+([A-Z][a-zA-Z0-9_]*)/,
  )

  return exportMatch?.[1] || functionMatch?.[1] || constMatch?.[1] || null
}

async function checkSlugUnique(slug: string, userId: string): Promise<boolean> {
  const supabase = supabaseWithAdminAccess

  const { data, error } = await supabase
    .from("components")
    .select("id")
    .eq("component_slug", slug)
    .eq("user_id", userId)

  if (error) {
    console.error("Error checking slug uniqueness:", error)
    return false
  }

  return data?.length === 0
}

async function generateUniqueSlug(
  baseSlug: string,
  userId: string,
): Promise<string> {
  const supabase = supabaseWithAdminAccess
  let newSlug = baseSlug
  let isUnique = await checkSlugUnique(newSlug, userId)
  let suffix = 1

  while (!isUnique) {
    newSlug = `${baseSlug}-${suffix}`
    isUnique = await checkSlugUnique(newSlug, userId)
    suffix += 1
  }

  return newSlug
}
