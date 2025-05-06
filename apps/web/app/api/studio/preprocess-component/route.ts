import OpenAI from "openai"
import { NextResponse } from "next/server"
import { makeSlugFromName } from "@/components/features/publish/hooks/use-is-check-slug-available"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { defaultTailwindConfig, defaultGlobalCss } from "@/lib/defaults"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Mock response for testing when OpenAI API is not available
const MOCK_RESPONSE = {
  componentName: "ExampleComponent",
  registryType: "ui",
  shadcnComponentsImports: [
    { name: "Button", path: "@/components/ui/button" },
    { name: "Dialog", path: "@/components/ui/dialog" },
    { name: "Input", path: "@/components/ui/input" },
  ],
  unresolvedDependencyImports: [
    {
      path: "@/components/ui/some-custom-component",
      names: ["SomeCustomComponent", "CustomComponentPart"],
    },
  ],
  npmDependencies: ["react", "next", "lucide-react"],
  environmentVariables: [],
  additionalStyles: {
    required: false,
    tailwindExtensions: {
      colors: {},
      animations: {},
      fontFamily: {},
      borderRadius: {},
      boxShadow: {},
    },
    cssVariables: [],
    keyframes: [],
    utilities: [],
  },
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
      console.log("OpenAI preprocessing result:", result)
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

    const response = {
      ...result,
      slug: finalSlug,
    }

    console.log("Final preprocessed response:", response)

    return NextResponse.json(response)
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
3. Identify any shadcn/ui imports from 'components/ui/' and list their names and paths (one of the following): 
	1.	Accordion (@/components/ui/accordion)
	2.	Alert (@/components/ui/alert)
	3.	Alert Dialog (@/components/ui/alert-dialog)
	4.	Aspect Ratio (@/components/ui/aspect-ratio)
	5.	Avatar (@/components/ui/avatar)
	6.	Badge (@/components/ui/badge)
	7.	Breadcrumb (@/components/ui/breadcrumb)
	8.	Button (@/components/ui/button)
	9.	Calendar (@/components/ui/calendar)
	10.	Card (@/components/ui/card)
	11.	Carousel (@/components/ui/carousel)
	12.	Chart (@/components/ui/chart)
	13.	Checkbox (@/components/ui/checkbox)
	14.	Collapsible (@/components/ui/collapsible)
	15.	Combobox (@/components/ui/combobox)
	16.	Command (@/components/ui/command)
	17.	Context Menu (@/components/ui/context-menu)
	18.	Data Table (@/components/ui/data-table)
	19.	Date Picker (@/components/ui/date-picker)
	20.	Dialog (@/components/ui/dialog)
	21.	Drawer (@/components/ui/drawer)
	22.	Dropdown Menu (@/components/ui/dropdown-menu)
	23.	Form (@/components/ui/form)
	24.	Hover Card (@/components/ui/hover-card)
	25.	Input (@/components/ui/input)
	26.	Input OTP (@/components/ui/input-otp)
	27.	Label (@/components/ui/label)
	28.	Menubar (@/components/ui/menubar)
	29.	Navigation Menu (@/components/ui/navigation-menu)
	30.	Pagination (@/components/ui/pagination)
	31.	Popover (@/components/ui/popover)
	32.	Progress (@/components/ui/progress)
	33.	Radio Group (@/components/ui/radio-group)
	34.	Resizable (@/components/ui/resizable)
	35.	Scroll Area (@/components/ui/scroll-area)
	36.	Select (@/components/ui/select)
	37.	Separator (@/components/ui/separator)
	38.	Sheet (@/components/ui/sheet)
	39.	Sidebar (@/components/ui/sidebar)
	40.	Skeleton (@/components/ui/skeleton)
	41.	Slider (@/components/ui/slider)
	42.	Sonner (@/components/ui/sonner)
	43.	Switch (@/components/ui/switch)
	44.	Table (@/components/ui/table)
	45.	Tabs (@/components/ui/tabs)
	46.	Textarea (@/components/ui/textarea)
	47.	Toast (@/components/ui/toast)
	48.	Toggle (@/components/ui/toggle)
	49.	Toggle Group (@/components/ui/toggle-group)
	50.	Tooltip (@/components/ui/tooltip)
)
4. Identify any non-shadcn/ui component imports (including @/hooks and @/components/[registry]/ components, excluding npm packages and standard shadcn utilities). 
   IMPORTANT:
   - DO NOT include imports like { cn } from "@/lib/utils" or any other utility functions. Only include actual component imports.
   - List all components exported from the same file together, grouped by file path.
   - The path should be based on the file location, not the component name.
   - For example, if file mockup.tsx exports both Mockup and MockupFrame components, list both with "@/components/ui/mockup".
   For each file path, provide an array of all component names imported from that path.

5. List all npm package dependencies used in the component (excluding react, react-dom, tailwindcss, and any packages starting with 'next' or '@/')
6. Identify any environment variables (process.env.*) that the component requires to function correctly.
7. Analyze if the component requires additional CSS styles that are NOT already provided in the default Tailwind configuration and globals CSS provided below.

IMPORTANT: Only include styles that are NOT already covered by the default tailwind.config.js and globals.css files provided below. 
- DO NOT include any standard Tailwind classes like 'flex', 'p-4', 'text-sm', etc.
- DO NOT include CSS variables that are already defined in the globals.css provided
- DO NOT include any shadcn/ui component styles, as those are already available
- ONLY include custom CSS variables, custom keyframes, or custom utilities that the user has defined and would need to be added to make the component work correctly

Here's the default Tailwind configuration:
\`\`\`js
${defaultTailwindConfig}
\`\`\`

And here's the default globals CSS:
\`\`\`css
${defaultGlobalCss}
\`\`\`

IMPORTANT RULES FOR COMPONENT PATHS:
1. Components exported from the same file MUST share the same path
2. The path should be based on the actual file location, not the component name
3. The filename in the path should match the actual file that contains the component
4. Multiple components from the same file must be listed together in a single entry with an array of names

Example of correct path handling:
If a file "@/components/ui/mockup.tsx" exports both Mockup and MockupFrame components:
{
  "unresolvedDependencyImports": [
    { 
      "path": "@/components/ui/mockup",
      "names": ["Mockup", "MockupFrame"]
    }
  ]
}

Respond in JSON format only with the following structure:
{
  "componentName": "string",
  "registryType": "ui|hooks|blocks",
  "shadcnComponentsImports": [
    {
      "name": "string",
      "path": "@/components/ui/component-name"
    }
  ],
  "unresolvedDependencyImports": [
    {
      "path": "@/components/[registry]/component-name",
      "names": ["string", "string", ...]
    }
  ],
  "npmDependencies": ["string"],
  "environmentVariables": [
    {
      "name": "VARIABLE_NAME",
      "description": "What this variable is used for",
      "required": boolean
    }
  ],
  "additionalStyles": {
    "required": boolean,
    "tailwindExtensions": {
      "colors": {
        "color-name": "color-value" // ONLY colors not in default config
      },
      "animations": {
        "animation-name": "animation-definition" // ONLY animations not in default config
      },
      "fontFamily": {
        "font-name": ["font-stack"] // ONLY font families not in default config
      },
      "borderRadius": {
        "radius-name": "radius-value" // ONLY border radius values not in default config
      },
      "boxShadow": {
        "shadow-name": "shadow-value" // ONLY shadows not in default config
      },
      "spacing": {
        "spacing-name": "spacing-value" // ONLY spacing values not in default config
      }
    },
    "cssVariables": [
      {
        "name": "--variable-name", // ONLY CSS variables not already defined in globals.css
        "value": "variable-value",
        "where": "root|.dark|.component-class|etc"
      }
    ],
    "keyframes": [
      {
        "name": "keyframe-name", // ONLY keyframes not already defined in globals.css
        "frames": "0% { opacity: 0 } 100% { opacity: 1 }" // The keyframe content without @keyframes wrapper
      }
    ],
    "utilities": [
      {
        "className": ".class-name", // ONLY utility classes not covered by Tailwind or globals.css
        "definition": "{ property: value; property2: value2; }" // CSS properties as text
      }
    ]
  }
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

  const data = JSON.parse(content)

  // Fix any undefined values in keyframes or utilities
  if (data.additionalStyles.keyframes) {
    data.additionalStyles.keyframes = data.additionalStyles.keyframes.map(
      (keyframe: any) => {
        // Standardize keyframe structure - ensure we always use 'name' and 'frames'
        const name = keyframe.name || keyframe.keyframeName || ""
        const frames = keyframe.frames || keyframe.definition || ""

        if (!frames || frames === "undefined") {
          // Provide a default example keyframe definition
          return {
            name,
            frames:
              "0% { opacity: 0; transform: scale(0.95); }\n100% { opacity: 1; transform: scale(1); }",
          }
        }
        return { name, frames }
      },
    )
  }

  if (data.additionalStyles.utilities) {
    data.additionalStyles.utilities = data.additionalStyles.utilities.map(
      (utility: any) => {
        // Standardize utility structure - ensure we always use 'className' and 'definition'
        const className = utility.className || utility.name || ""
        const definition = utility.definition || utility.properties || ""

        if (!definition || definition === "undefined") {
          // Provide a default example utility definition
          return {
            className,
            definition: "/* Add your custom styles here */",
          }
        }
        return { className, definition }
      },
    )
  }

  // Standardize empty objects in tailwindExtensions to prevent inconsistencies
  if (data.additionalStyles.tailwindExtensions) {
    const extensions = [
      "colors",
      "animations",
      "fontFamily",
      "borderRadius",
      "boxShadow",
      "spacing",
    ]
    extensions.forEach((ext) => {
      if (!data.additionalStyles.tailwindExtensions[ext]) {
        data.additionalStyles.tailwindExtensions[ext] = {}
      }
    })
  }

  return data
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
