/**
 * AI Configuration
 *
 * This file contains configurations for the AI models used in the application.
 * Centralizing these settings makes it easier to update them without modifying logic.
 */

// API Configuration
export const claudeConfig = {
  apiKey: Deno.env.get("ANTHROPIC_API_KEY") || "",
  model: "claude-3-7-sonnet-20250219", // Use a fast, economical model for descriptions
}

export const openaiConfig = {
  apiKey: Deno.env.get("OPENAI_API_KEY") || "",
  embeddingModel: "text-embedding-3-small",
}

// Usage-oriented prompt template for components
export const USAGE_PROMPT = `You are a UI component expert. Given the code of a component:

Your task: Generate a list of short search queries that developers might use to find this component.
Focus on the FULL RANGE OF POSSIBILITIES that this component offers, not just what is shown in the demos.

Generate a diverse list of 16-20 search queries that include both:
- Technical queries describing the component's characteristics (like "dropdown with multi-select", "accessible select with keyboard navigation")
- Task-based queries describing problems the component solves (like "create country selector with flags", "file upload with preview")

FORMAT REQUIREMENTS:
- Use bullet points with dashes. Do not number the items.
- Do not use section headings or any labeling of query types.
- Just provide a clean list of queries with no categorization.
- Queries should be concise (no more than 6-7 words).
- Use natural language, as if a person is typing a search query.
- Include some variations with common typos or inaccuracies.
- DO NOT use the word "React" in any queries - it's redundant and wastes space.

IMPORTANT: The component must be truly relevant for EACH query. Do not make up functionality that doesn't exist in the component.

DO NOT write extra text, only the query list.`

// Prompt for demo descriptions - now includes both component and demo code
export const DEMO_PROMPT = `You are a UI component expert. Given the code of a specific component DEMO and its parent COMPONENT:

Your task: Generate a list of short search queries that developers might use to find THIS SPECIFIC IMPLEMENTATION of the component.

Focus EXCLUSIVELY on the SPECIFIC USAGE PATTERN or MODIFICATION shown in this demo. This is not about the component's general capabilities, but about this particular implementation shown in the demo code.

Queries should describe:
- The specific modifications or customizations shown in the demo
- The particular use case or problem being solved
- The specific styling or behavior demonstrated
- Any specialized integration or usage pattern

For example:
- "add icons to accordion items"
- "dropdown with custom item rendering"
- "toast notification with progress bar"
- "form validation with error messages"
- "search input with highlighted results"

FORMAT REQUIREMENTS:
- Create 6-8 different search queries using natural language.
- Use bullet points with dashes.
- Queries should be very specific and describe the unique aspects of this implementation.
- DO NOT use the word "React" in any queries - it's redundant and wastes space.
- Analyze both the component code AND the demo code to understand what makes this implementation special.

IMPORTANT: Queries must precisely match what is implemented in this specific demo. Do not make up functionality.
DO NOT use general component descriptions that don't reflect the uniqueness of this implementation.
DO NOT add any comments or additional information - only the list of queries.`

// Hypothetical Document Embeddings (HyDE) prompt
export const HYDE_PROMPT = `You are an expert React developer. Based on the search query provided, generate a hypothetical code example that would be exactly what the user is looking for.

The user search query: "{query}"

Generate a JSON object with the following structure:
{
  "componentName": "A suitable name for this component",
  "componentDescription": "A brief description of what the component does (2-3 sentences)",
  "componentCode": "// A realistic React component code (TypeScript/JSX) that implements what the user is asking for",
  "demoCode": "// A realistic usage example of this component"
}

Make sure the component code:
1. Uses modern React patterns (functional components, hooks)
2. Has proper TypeScript typing
3. Is properly structured with clear props interface
4. Has helpful comments explaining key parts
5. Transitions: Uses Tailwind utility classes for smooth visual effects
6. Shadows: Incorporates subtle shadow classes for appropriate depth
7. Spacing: Enforces consistent sizing and spacing for balanced layout

The demo code should show practical usage of the component in a realistic scenario.
Both code snippets should be valid, executable code that would actually work if implemented.

ONLY respond with the JSON object. No introduction or explanation text.`
