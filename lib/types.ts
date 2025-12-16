/**
 * TypeScript Types
 * 
 * This file exports TypeScript types inferred from Zod schemas.
 * Import these types throughout the application for type safety.
 * 
 * @module types
 */

import { z } from 'zod';
import {
  SVGParametersSchema,
  ModelSchema,
  StylePresetSchema,
  ConsoleLogSchema,
  GenerationRequestSchema,
  GenerationResponseSchema,
  GeneratedResultSchema,
  ModelsArraySchema,
  PresetsArraySchema,
  LogsArraySchema,
  ResultsArraySchema,
} from './schemas';

// ============================================================================
// Inferred Types from Schemas
// ============================================================================

/**
 * SVG generation parameters configuration.
 * 
 * @typedef {Object} SVGParameters
 * @property {number} outlineWidth - Stroke thickness (0-10)
 * @property {number} simplification - Path complexity reduction (0-100)
 * @property {number} smoothing - Curve smoothing amount (0-100)
 * @property {string} primaryColor - Hex color (#RRGGBB)
 */
export type SVGParameters = z.infer<typeof SVGParametersSchema>;

/**
 * AI model configuration from OpenRouter.
 * 
 * @typedef {Object} Model
 * @property {string} id - Unique model identifier
 * @property {string} name - Display name
 * @property {number} context_length - Maximum token capacity
 * @property {Object} pricing - Cost information
 * @property {number} pricing.prompt - Cost per prompt token
 * @property {number} pricing.completion - Cost per completion token
 */
export type Model = z.infer<typeof ModelSchema>;

/**
 * Style preset configuration.
 * 
 * @typedef {Object} StylePreset
 * @property {string} id - Unique preset identifier
 * @property {string} name - Display name
 * @property {string} description - Preset description
 * @property {string[]} tags - Search/filter tags
 * @property {string} systemPrompt - AI instruction for this style
 */
export type StylePreset = z.infer<typeof StylePresetSchema>;

/**
 * Console log entry for generation tracking.
 * 
 * @typedef {Object} ConsoleLog
 * @property {string} id - Unique log identifier
 * @property {Date} timestamp - When the event occurred
 * @property {string} message - Log message text
 * @property {'info' | 'success' | 'error' | 'warning'} type - Log category
 */
export type ConsoleLog = z.infer<typeof ConsoleLogSchema>;

/**
 * SVG generation API request payload.
 * 
 * @typedef {Object} GenerationRequest
 * @property {string} sourceIcon - Base icon to transform
 * @property {string} stylePreset - Preset identifier
 * @property {string} prompt - User instructions
 * @property {string} selectedModel - AI model identifier
 * @property {SVGParameters} parameters - Generation parameters
 */
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;

/**
 * SVG generation API response.
 * 
 * @typedef {Object} GenerationResponse
 * @property {boolean} success - Whether generation succeeded
 * @property {string} [svgCode] - Generated SVG (on success)
 * @property {string} [error] - Error message (on failure)
 * @property {Record<string, unknown>} [metadata] - Additional details
 */
export type GenerationResponse = z.infer<typeof GenerationResponseSchema>;

/**
 * Stored generation result.
 * 
 * @typedef {Object} GeneratedResult
 * @property {string} id - UUID identifier
 * @property {Date} timestamp - When generated
 * @property {string} sourceIcon - Base icon used
 * @property {string} stylePreset - Preset used
 * @property {string} prompt - User prompt
 * @property {string} svgCode - Generated SVG code
 * @property {string} modelUsed - AI model used
 */
export type GeneratedResult = z.infer<typeof GeneratedResultSchema>;

// ============================================================================
// Array Types
// ============================================================================

/**
 * Array of AI models.
 */
export type ModelsArray = z.infer<typeof ModelsArraySchema>;

/**
 * Array of style presets.
 */
export type PresetsArray = z.infer<typeof PresetsArraySchema>;

/**
 * Array of console logs.
 */
export type LogsArray = z.infer<typeof LogsArraySchema>;

/**
 * Array of generated results.
 */
export type ResultsArray = z.infer<typeof ResultsArraySchema>;

// ============================================================================
// Additional Helper Types
// ============================================================================

/**
 * Console log type discriminator.
 */
export type LogType = ConsoleLog['type'];

/**
 * Generation status states.
 */
export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Theme options.
 */
export type Theme = 'light' | 'dark';
