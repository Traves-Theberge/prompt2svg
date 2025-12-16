/**
 * Zod Validation Schemas
 * 
 * This file contains all Zod v4 validation schemas for the prompt2svg application.
 * These schemas provide runtime validation and TypeScript type inference.
 * 
 * @module schemas
 */

import { z } from 'zod';

// ============================================================================
// SVG Parameters Schema
// ============================================================================

/**
 * Schema for SVG generation parameters.
 * 
 * Validates the configuration options used when generating SVG icons:
 * - Outline width controls the stroke thickness (0-10)
 * - Simplification reduces path complexity (0-100)
 * - Smoothing applies curve smoothing (0-100)
 * - Primary color must be a valid hex color (#RRGGBB)
 * 
 * @example
 * ```ts
 * const params = SVGParametersSchema.parse({
 *   outlineWidth: 2,
 *   simplification: 50,
 *   smoothing: 30,
 *   primaryColor: "#FF5733"
 * });
 * ```
 */
export const SVGParametersSchema = z.object({
  outlineWidth: z.number().min(0, "Outline width must be at least 0").max(10, "Outline width cannot exceed 10"),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Primary color must be a valid hex color (e.g., #FF5733)"),
});

// ============================================================================
// Model Schema
// ============================================================================

/**
 * Schema for AI model configuration from OpenRouter.
 * 
 * Represents an AI model available through the OpenRouter API:
 * - ID is the unique model identifier (e.g., "openai/gpt-4")
 * - Name is the display name
 * - Context length indicates maximum token capacity
 * - Pricing contains cost per token for prompts and completions
 * 
 * @example
 * ```ts
 * const model = ModelSchema.parse({
 *   id: "openai/gpt-4",
 *   name: "GPT-4",
 *   context_length: 8192,
 *   pricing: { prompt: 0.00003, completion: 0.00006 }
 * });
 * ```
 */
export const ModelSchema = z.object({
  id: z.string().min(1, "Model ID is required"),
  name: z.string().min(1, "Model name is required"),
  context_length: z.number().int().positive("Context length must be a positive integer"),
  pricing: z.object({
    prompt: z.number(),
    completion: z.number(),
  }),
});

// ============================================================================
// Style Preset Schema
// ============================================================================

/**
 * Schema for style preset configurations.
 * 
 * Presets define predefined styling approaches for SVG generation:
 * - ID is the unique preset identifier
 * - Name is the display name
 * - Description explains the style
 * - Tags help with filtering and search
 * - System prompt is the AI instruction for this style
 * 
 * @example
 * ```ts
 * const preset = StylePresetSchema.parse({
 *   id: "minimalist",
 *   name: "Minimalist",
 *   description: "Clean and simple design",
 *   tags: ["clean", "simple", "modern"],
 *   systemPrompt: "Create a minimalist SVG design..."
 * });
 * ```
 */
export const StylePresetSchema = z.object({
  id: z.string().min(1, "Preset ID is required"),
  name: z.string().min(1, "Preset name is required"),
  description: z.string(),
  tags: z.array(z.string()),
  systemPrompt: z.string().min(1, "System prompt is required"),
});

// ============================================================================
// Console Log Schema
// ============================================================================

/**
 * Schema for console log entries.
 * 
 * Tracks generation process events with structured logging:
 * - ID is unique identifier for the log entry
 * - Timestamp records when the event occurred
 * - Message contains the log text
 * - Type categorizes the log (info, success, error, warning)
 * 
 * @example
 * ```ts
 * const log = ConsoleLogSchema.parse({
 *   id: "log-123",
 *   timestamp: new Date(),
 *   message: "SVG generation started",
 *   type: "info"
 * });
 * ```
 */
export const ConsoleLogSchema = z.object({
  id: z.string().min(1, "Log ID is required"),
  timestamp: z.date(),
  message: z.string(),
  type: z.enum(["info", "success", "error", "warning"], {
    message: "Log type must be one of: info, success, error, warning",
  }),
});

// ============================================================================
// Generation Request Schema
// ============================================================================

/**
 * Schema for SVG generation API requests.
 * 
 * Validates the complete payload sent to the generation endpoint:
 * - Source icon is the base icon to transform
 * - Style preset determines the artistic approach
 * - Prompt provides user-specific instructions
 * - Selected model specifies which AI model to use
 * - Parameters contain fine-tuning options
 * 
 * @example
 * ```ts
 * const request = GenerationRequestSchema.parse({
 *   sourceIcon: "star",
 *   stylePreset: "minimalist",
 *   prompt: "Make it blue with rounded edges",
 *   selectedModel: "openai/gpt-4",
 *   parameters: { outlineWidth: 2, simplification: 50, smoothing: 30, primaryColor: "#0066FF" }
 * });
 * ```
 */
export const GenerationRequestSchema = z.object({
  iconSVGCode: z.string().min(1, "Icon SVG code is required"),
  sourceIconName: z.string().min(1, "Source icon name is required"),
  stylePreset: z.string().optional(),
  userPrompt: z.string(),
  systemPrompt: z.string().optional(),
  selectedModel: z.string().min(1, "Model selection is required"),
  parameters: SVGParametersSchema,
});

// ============================================================================
// Generation Response Schema
// ============================================================================

/**
 * Schema for SVG generation API responses.
 * 
 * Validates responses from the generation endpoint:
 * - Success indicates whether generation completed
 * - SVG code contains the generated SVG (present on success)
 * - Error contains the error message (present on failure)
 * - Metadata provides additional generation details
 * 
 * Uses refinement to ensure success responses include SVG code.
 * 
 * @example
 * ```ts
 * // Success response
 * const response = GenerationResponseSchema.parse({
 *   success: true,
 *   svgCode: "<svg>...</svg>",
 *   metadata: { model: "gpt-4", tokens: 150 }
 * });
 * 
 * // Error response
 * const errorResponse = GenerationResponseSchema.parse({
 *   success: false,
 *   error: "API key invalid"
 * });
 * ```
 */
export const GenerationResponseSchema = z.object({
  success: z.boolean(),
  svgCode: z.string().optional(),
  error: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).refine(
  (data) => {
    // If success is true, svgCode must be present
    if (data.success) {
      return typeof data.svgCode === 'string' && data.svgCode.length > 0;
    }
    return true;
  },
  {
    message: "Successful responses must include SVG code",
    path: ["svgCode"],
  }
);

// ============================================================================
// Generated Result Schema
// ============================================================================

/**
 * Schema for stored generation results.
 * 
 * Represents a completed generation saved to history:
 * - ID is a unique identifier (UUID recommended)
 * - Timestamp records when it was generated
 * - Source icon, preset, and prompt store the input parameters
 * - SVG code contains the generated output
 * - Model used tracks which AI model was used
 * 
 * @example
 * ```ts
 * const result = GeneratedResultSchema.parse({
 *   id: "550e8400-e29b-41d4-a716-446655440000",
 *   timestamp: new Date(),
 *   sourceIcon: "star",
 *   stylePreset: "minimalist",
 *   prompt: "Make it blue",
 *   svgCode: "<svg>...</svg>",
 *   modelUsed: "openai/gpt-4"
 * });
 * ```
 */
export const GeneratedResultSchema = z.object({
  id: z.string().uuid("Result ID must be a valid UUID"),
  timestamp: z.date(),
  sourceIcon: z.string(),
  stylePreset: z.string(),
  prompt: z.string(),
  svgCode: z.string().min(1, "SVG code is required"),
  modelUsed: z.string(),
});

// ============================================================================
// Array Schemas
// ============================================================================

/**
 * Schema for validating an array of AI models.
 */
export const ModelsArraySchema = z.array(ModelSchema);

/**
 * Schema for validating an array of style presets.
 */
export const PresetsArraySchema = z.array(StylePresetSchema);

/**
 * Schema for validating an array of console logs.
 */
export const LogsArraySchema = z.array(ConsoleLogSchema);

/**
 * Schema for validating an array of generated results.
 */
export const ResultsArraySchema = z.array(GeneratedResultSchema);
