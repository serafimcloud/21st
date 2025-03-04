/**
 * AI Configuration
 *
 * This file contains configurations for the AI models used in the application.
 * Centralizing these settings makes it easier to update them without modifying logic.
 */

// Anthropic Claude configuration
export const CLAUDE_CONFIG = {
  MODEL: "claude-3-7-sonnet-20250219", // The specific Claude model to use
  MAX_TOKENS: 1000, // Maximum tokens for responses
  SYSTEM_PROMPT:
    "You are a technical writer specializing in explaining React components. Always provide detailed, accurate descriptions. Focus on technical details, implementation patterns, and use cases.",
}

// OpenAI configuration (for embeddings)
export const OPENAI_CONFIG = {
  EMBEDDING_MODEL: "text-embedding-3-small", // Model for generating embeddings
  EMBEDDING_DIMENSIONS: 1536, // Dimensions of the generated embeddings
}
