/**
 * Validation Helpers
 * 
 * This file provides utility functions for validating data with Zod schemas.
 * These helpers wrap Zod's validation logic with consistent error handling.
 * 
 * @module validations
 */

import { ZodSchema, ZodError } from 'zod';
import type { ZodIssue } from 'zod';
import {
  GenerationRequestSchema,
  GenerationResponseSchema,
  ModelSchema,
  ModelsArraySchema,
  StylePresetSchema,
  SVGParametersSchema,
  ConsoleLogSchema,
  GeneratedResultSchema,
} from './schemas';

// ============================================================================
// Validation Result Types
// ============================================================================

/**
 * Successful validation result.
 * 
 * @template T The validated data type
 */
export type ValidationSuccess<T> = {
  success: true;
  data: T;
  error: null;
};

/**
 * Failed validation result.
 */
export type ValidationFailure = {
  success: false;
  data: null;
  error: {
    message: string;
    issues: Array<{
      path: string;
      message: string;
    }>;
  };
};

/**
 * Validation result that can be either success or failure.
 * 
 * @template T The validated data type
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// ============================================================================
// Core Validation Function
// ============================================================================

/**
 * Safely validates data against a Zod schema.
 * 
 * This wrapper provides consistent error handling and formatting
 * for all validation operations in the application.
 * 
 * @template T The expected output type after validation
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns A validation result with success flag and either data or error
 * 
 * @example
 * ```ts
 * const result = safeValidate(SVGParametersSchema, userInput);
 * 
 * if (result.success) {
 *   console.log("Valid parameters:", result.data);
 * } else {
 *   console.error("Validation failed:", result.error.message);
 *   result.error.issues.forEach(issue => {
 *     console.error(`  ${issue.path}: ${issue.message}`);
 *   });
 * }
 * ```
 */
export function safeValidate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return {
      success: true,
      data: validated,
      error: null,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const issues: ZodIssue[] = (error as unknown as { issues?: ZodIssue[] }).issues ?? [];
      return {
        success: false,
        data: null,
        error: {
          message: 'Validation failed',
          issues: issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      };
    }
    
    // Unexpected error
    return {
      success: false,
      data: null,
      error: {
        message: 'An unexpected validation error occurred',
        issues: [
          {
            path: 'unknown',
            message: error instanceof Error ? error.message : String(error),
          },
        ],
      },
    };
  }
}

// ============================================================================
// Specific Validation Functions
// ============================================================================

/**
 * Validates a generation request payload.
 * 
 * @param data - The request data to validate
 * @returns Validation result with typed data or error
 * 
 * @example
 * ```ts
 * const result = validateGenerationRequest(requestBody);
 * if (!result.success) {
 *   return Response.json({ error: result.error }, { status: 400 });
 * }
 * const { sourceIcon, prompt, parameters } = result.data;
 * ```
 */
export function validateGenerationRequest(data: unknown) {
  return safeValidate(GenerationRequestSchema, data);
}

/**
 * Validates a generation response payload.
 * 
 * @param data - The response data to validate
 * @returns Validation result with typed data or error
 * 
 * @example
 * ```ts
 * const result = validateGenerationResponse(apiResponse);
 * if (!result.success) {
 *   console.error("Invalid API response:", result.error);
 * }
 * ```
 */
export function validateGenerationResponse(data: unknown) {
  return safeValidate(GenerationResponseSchema, data);
}

/**
 * Validates a single AI model object.
 * 
 * @param data - The model data to validate
 * @returns Validation result with typed model or error
 * 
 * @example
 * ```ts
 * const result = validateModel(modelFromAPI);
 * if (result.success) {
 *   console.log(`Model: ${result.data.name} (${result.data.id})`);
 * }
 * ```
 */
export function validateModel(data: unknown) {
  return safeValidate(ModelSchema, data);
}

/**
 * Validates an array of AI models.
 * 
 * Filters out invalid models and returns only valid ones.
 * Logs warnings for any invalid models encountered.
 * 
 * @param data - The array of models to validate
 * @returns Validation result with valid models array
 * 
 * @example
 * ```ts
 * const result = validateModels(modelsFromAPI);
 * if (result.success) {
 *   setModels(result.data);
 * }
 * ```
 */
export function validateModels(data: unknown) {
  return safeValidate(ModelsArraySchema, data);
}

/**
 * Validates a style preset object.
 * 
 * @param data - The preset data to validate
 * @returns Validation result with typed preset or error
 * 
 * @example
 * ```ts
 * const result = validateStylePreset(presetData);
 * if (result.success) {
 *   applyPreset(result.data);
 * }
 * ```
 */
export function validateStylePreset(data: unknown) {
  return safeValidate(StylePresetSchema, data);
}

/**
 * Validates SVG generation parameters.
 * 
 * @param data - The parameters to validate
 * @returns Validation result with typed parameters or error
 * 
 * @example
 * ```ts
 * const result = validateSVGParameters({
 *   outlineWidth: 2,
 *   simplification: 50,
 *   smoothing: 30,
 *   primaryColor: "#FF5733"
 * });
 * 
 * if (!result.success) {
 *   showErrorToast(result.error.message);
 * }
 * ```
 */
export function validateSVGParameters(data: unknown) {
  return safeValidate(SVGParametersSchema, data);
}

/**
 * Validates a console log entry.
 * 
 * @param data - The log data to validate
 * @returns Validation result with typed log or error
 * 
 * @example
 * ```ts
 * const result = validateConsoleLog({
 *   id: crypto.randomUUID(),
 *   timestamp: new Date(),
 *   message: "Generation started",
 *   type: "info"
 * });
 * ```
 */
export function validateConsoleLog(data: unknown) {
  return safeValidate(ConsoleLogSchema, data);
}

/**
 * Validates a generated result object.
 * 
 * @param data - The result data to validate
 * @returns Validation result with typed result or error
 * 
 * @example
 * ```ts
 * const result = validateGeneratedResult(resultToSave);
 * if (result.success) {
 *   saveToHistory(result.data);
 * }
 * ```
 */
export function validateGeneratedResult(data: unknown) {
  return safeValidate(GeneratedResultSchema, data);
}

// ============================================================================
// Error Formatting Helpers
// ============================================================================

/**
 * Formats validation errors into a human-readable string.
 * 
 * @param validationResult - A failed validation result
 * @returns Formatted error message with all issues
 * 
 * @example
 * ```ts
 * const result = validateGenerationRequest(data);
 * if (!result.success) {
 *   const errorMessage = formatValidationErrors(result);
 *   console.error(errorMessage);
 * }
 * ```
 */
export function formatValidationErrors(validationResult: ValidationFailure): string {
  const { error } = validationResult;
  const issueStrings = error.issues.map(
    (issue) => `  - ${issue.path ? `${issue.path}: ` : ''}${issue.message}`
  );
  
  return `${error.message}\n${issueStrings.join('\n')}`;
}

/**
 * Extracts a simplified error message from validation failure.
 * 
 * Returns only the first error message for display to users.
 * 
 * @param validationResult - A failed validation result
 * @returns Single error message string
 * 
 * @example
 * ```ts
 * const result = validateSVGParameters(params);
 * if (!result.success) {
 *   toast.error(getFirstErrorMessage(result));
 * }
 * ```
 */
export function getFirstErrorMessage(validationResult: ValidationFailure): string {
  const firstIssue = validationResult.error.issues[0];
  return firstIssue?.message || validationResult.error.message;
}
