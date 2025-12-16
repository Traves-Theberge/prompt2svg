# Zod & Zustand Implementation Plan

## Overview
This document outlines the comprehensive implementation plan for integrating Zod v4 (schema validation) and Zustand v5 (state management) into the prompt2svg application. All implementations will follow official documentation and best practices.

---

## Key Entities & Zod Schemas

### 1. SVGParameters
**Description**: Configuration parameters for SVG generation
**Fields**:
- `outlineWidth`: number (min: 0, max: 10)
- `simplification`: number (min: 0, max: 100)
- `smoothing`: number (min: 0, max: 100)
- `primaryColor`: string (hex color format)

**Gherkin Scenario**:
```gherkin
Feature: SVG Parameters Validation
  As a developer
  I want to validate SVG generation parameters
  So that only valid configurations are processed

  Scenario: Valid parameters pass validation
    Given I have outline width of 2
    And I have simplification of 50
    And I have smoothing of 30
    And I have primary color of "#FF5733"
    When I validate the parameters
    Then the validation should succeed
    And the parameters should be type-safe

  Scenario: Invalid parameters are rejected
    Given I have outline width of -1
    When I validate the parameters
    Then the validation should fail
    And an error message should indicate "outline width must be non-negative"
```

---

### 2. Model
**Description**: AI model configuration from OpenRouter
**Fields**:
- `id`: string (non-empty)
- `name`: string (non-empty)
- `context_length`: number (positive integer)
- `pricing`: object with `prompt` and `completion` numbers

**Gherkin Scenario**:
```gherkin
Feature: AI Model Validation
  As a developer
  I want to validate AI model data from OpenRouter
  So that only properly formatted models are used

  Scenario: Valid model from API
    Given I receive a model from OpenRouter API
    And it has id "openai/gpt-4"
    And it has name "GPT-4"
    And it has context_length of 8192
    And it has pricing information
    When I validate the model
    Then the validation should succeed
    And the model should be properly typed

  Scenario: Incomplete model data is rejected
    Given I receive a model without an id
    When I validate the model
    Then the validation should fail
    And an error should indicate "id is required"
```

---

### 3. StylePreset
**Description**: Predefined styling configurations for SVG generation
**Fields**:
- `id`: string (unique identifier)
- `name`: string (display name)
- `description`: string (preset description)
- `tags`: array of strings
- `systemPrompt`: string (AI instruction)

**Gherkin Scenario**:
```gherkin
Feature: Style Preset Validation
  As a developer
  I want to validate style preset configurations
  So that presets are properly formatted and usable

  Scenario: Complete preset validates successfully
    Given I have a preset with id "minimalist"
    And it has name "Minimalist"
    And it has a description
    And it has tags like ["clean", "simple"]
    And it has a system prompt
    When I validate the preset
    Then the validation should succeed

  Scenario: Preset with missing system prompt fails
    Given I have a preset without a system prompt
    When I validate the preset
    Then the validation should fail
```

---

### 4. ConsoleLog
**Description**: Log entry for generation process tracking
**Fields**:
- `id`: string (unique)
- `timestamp`: Date
- `message`: string
- `type`: enum ("info" | "success" | "error" | "warning")

**Gherkin Scenario**:
```gherkin
Feature: Console Log Entry Validation
  As a developer
  I want to validate log entries
  So that logs are properly structured and queryable

  Scenario: Valid log entry creation
    Given I create a log with type "success"
    And message "SVG generated successfully"
    And a valid timestamp
    When I validate the log entry
    Then the validation should succeed
    And the timestamp should be a Date object

  Scenario: Invalid log type is rejected
    Given I create a log with type "invalid"
    When I validate the log entry
    Then the validation should fail
    And an error should indicate valid log types
```

---

### 5. GenerationRequest
**Description**: API request payload for SVG generation
**Fields**:
- `sourceIcon`: string (non-empty)
- `stylePreset`: string (preset id)
- `prompt`: string (user instructions)
- `selectedModel`: string (model id)
- `parameters`: SVGParameters object

**Gherkin Scenario**:
```gherkin
Feature: Generation Request Validation
  As an API endpoint
  I want to validate incoming generation requests
  So that only valid requests are processed

  Scenario: Complete request with all fields
    Given I receive a request with sourceIcon "star"
    And stylePreset "minimalist"
    And prompt "make it blue"
    And selectedModel "openai/gpt-4"
    And valid parameters
    When I validate the request
    Then the validation should succeed
    And all nested objects should be validated

  Scenario: Request with missing required field
    Given I receive a request without sourceIcon
    When I validate the request
    Then the validation should fail
    And a clear error message should be returned
```

---

### 6. GenerationResponse
**Description**: API response from SVG generation
**Fields**:
- `success`: boolean
- `svgCode`: string (optional - present on success)
- `error`: string (optional - present on failure)
- `metadata`: object with generation details

**Gherkin Scenario**:
```gherkin
Feature: Generation Response Validation
  As an API consumer
  I want to validate API responses
  So that I can safely handle the returned data

  Scenario: Successful generation response
    Given the API returns success true
    And includes SVG code
    And includes metadata
    When I validate the response
    Then the validation should succeed
    And svgCode should be accessible

  Scenario: Error response validation
    Given the API returns success false
    And includes an error message
    When I validate the response
    Then the validation should succeed
    And error message should be accessible
```

---

### 7. GeneratedResult
**Description**: Stored result of a successful generation
**Fields**:
- `id`: string (unique)
- `timestamp`: Date
- `sourceIcon`: string
- `stylePreset`: string
- `prompt`: string
- `svgCode`: string
- `modelUsed`: string

**Gherkin Scenario**:
```gherkin
Feature: Generated Result Storage
  As a user
  I want my generated SVGs to be stored properly
  So that I can access my generation history

  Scenario: Save successful generation
    Given a generation completed successfully
    And SVG code was returned
    When I save the result
    Then it should have a unique id
    And it should include timestamp
    And all generation parameters should be saved

  Scenario: Validate saved result structure
    Given I retrieve a saved result
    When I validate its structure
    Then all required fields should be present
    And the timestamp should be a Date
```

---

## Zustand Store Architecture

### Store Design: Single Store with Slices Pattern

We'll use a **single store** with **slices pattern** for better organization and modularity.

**Store Slices**:

1. **UI State Slice**
   - Theme management
   - Modal visibility
   - Loading states
   - Selected tabs

2. **Generation State Slice**
   - Current generation in progress
   - Generation parameters (SVGParameters)
   - Console logs (ConsoleLog[])
   - Generation history (GeneratedResult[])

3. **Models State Slice**
   - Available models (Model[])
   - Selected model
   - Models loading state
   - Models error state

4. **Presets State Slice**
   - Available presets (StylePreset[])
   - Selected preset
   - Preset search query
   - Filtered presets

---

### Gherkin Scenarios for Zustand Store

#### UI State Management
```gherkin
Feature: UI State Management
  As a user
  I want the UI state to be managed consistently
  So that the interface behaves predictably

  Scenario: Toggle between light and dark theme
    Given the application is in light mode
    When I toggle the theme
    Then the theme should change to dark mode
    And the change should persist across sessions

  Scenario: Open and close modal
    Given a modal is closed
    When I trigger modal open action
    Then the modal should be visible
    And when I trigger modal close action
    Then the modal should be hidden
```

#### Generation State Management
```gherkin
Feature: Generation State Management
  As a developer
  I want generation state to be managed centrally
  So that all components have access to current generation status

  Scenario: Start new generation
    Given I have valid generation parameters
    When I start a generation
    Then the generation state should be "in-progress"
    And a log entry should be created
    And the UI should reflect loading state

  Scenario: Complete successful generation
    Given a generation is in progress
    When the generation completes successfully
    Then the result should be added to history
    And a success log should be created
    And the generation state should be "idle"

  Scenario: Handle generation error
    Given a generation is in progress
    When the generation fails
    Then an error log should be created
    And the generation state should be "error"
    And the error message should be displayed
```

#### Models State Management
```gherkin
Feature: Models State Management
  As a user
  I want available AI models to be fetched and managed
  So that I can select the best model for my needs

  Scenario: Fetch models on app initialization
    Given the application just started
    When the component mounts
    Then models should be fetched from API
    And models should be validated with Zod
    And valid models should be stored in state

  Scenario: Select a model
    Given I have a list of available models
    When I select "openai/gpt-4"
    Then the selected model should be updated
    And the model id should be stored
```

#### Presets State Management
```gherkin
Feature: Presets State Management
  As a user
  I want to search and filter style presets
  So that I can quickly find the style I want

  Scenario: Filter presets by search query
    Given I have 30 style presets loaded
    When I type "minimal" in the search
    Then only presets with "minimal" in name or tags should show
    And the filtered list should be updated reactively

  Scenario: Select a preset
    Given I have filtered presets
    When I click on a preset
    Then that preset should be marked as selected
    And its system prompt should be used for generation
```

---

## Implementation Components Matrix

### Components Requiring Updates

| Component | Zod Schemas | Zustand Store | Actions Required |
|-----------|-------------|---------------|------------------|
| `svg-generator.tsx` | ✅ Validate all inputs | ✅ Replace useState | Refactor state management |
| `api/openrouter/generate/route.ts` | ✅ Validate request/response | N/A | Add request validation |
| `api/openrouter/models/route.ts` | ✅ Validate API response | N/A | Add response validation |
| `components/ui/input.tsx` | ✅ Optional prop validation | N/A | Add prop types |
| `components/ui/combobox.tsx` | ✅ Validate options | N/A | Type safety improvements |
| `components/ui/field.tsx` | ✅ Validate field props | N/A | Add validation |

### New Files to Create

| File | Purpose | Dependencies |
|------|---------|--------------|
| `lib/schemas.ts` | All Zod schemas | zod |
| `lib/store.ts` | Zustand store with slices | zustand, zustand/middleware |
| `lib/types.ts` | TypeScript types from Zod | schemas.ts |
| `lib/validations.ts` | Validation helper functions | schemas.ts |

---

## Middleware Configuration

### Zustand Middlewares to Use

1. **`devtools`** - Redux DevTools integration for debugging
   ```typescript
   import { devtools } from 'zustand/middleware'
   ```

2. **`persist`** - LocalStorage persistence for user preferences
   ```typescript
   import { persist, createJSONStorage } from 'zustand/middleware'
   ```

3. **`immer`** - Mutable state updates (if needed for complex nested state)
   ```typescript
   import { immer } from 'zustand/middleware/immer'
   ```

4. **`combine`** - Simplified state + actions separation
   ```typescript
   import { combine } from 'zustand/middleware'
   ```

---

## TypeScript Integration

### Type Inference from Zod Schemas

Zod v4 allows us to infer TypeScript types directly from schemas:

```typescript
import { z } from 'zod'

// Define schema
const SVGParametersSchema = z.object({
  outlineWidth: z.number().min(0).max(10),
  simplification: z.number().min(0).max(100),
  smoothing: z.number().min(0).max(100),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
})

// Infer TypeScript type
type SVGParameters = z.infer<typeof SVGParametersSchema>
```

### Zustand Type Safety

```typescript
import { create } from 'zustand'

interface GenerationState {
  parameters: SVGParameters
  setParameters: (params: SVGParameters) => void
}

const useGenerationStore = create<GenerationState>()((set) => ({
  parameters: {...},
  setParameters: (params) => set({ parameters: params })
}))
```

---

## Implementation Phases

### Phase 1: Setup & Schema Definition
1. Install packages (if needed)
2. Create `lib/schemas.ts` with all Zod schemas
3. Create `lib/types.ts` exporting inferred types
4. Add JSDoc comments to all schemas

### Phase 2: Zustand Store Creation
1. Create `lib/store.ts`
2. Implement store slices
3. Configure middlewares (devtools, persist, combine)
4. Add JSDoc comments
5. Export typed hooks

### Phase 3: API Route Validation
1. Update `api/openrouter/generate/route.ts`
2. Update `api/openrouter/models/route.ts`
3. Add request/response validation
4. Add error handling

### Phase 4: Component Refactoring
1. Update `svg-generator.tsx` to use store
2. Remove useState calls
3. Replace with store selectors
4. Add input validation

### Phase 5: Testing & Documentation
1. Test all validation schemas
2. Test store actions
3. Verify type safety
4. Update documentation

---

## Best Practices & Guidelines

### Zod v4 Best Practices

1. **Use top-level validators** (not chained)
   ```typescript
   // ✅ Correct (v4)
   z.email()
   z.uuid()
   z.url()
   
   // ❌ Incorrect (v3 style)
   z.string().email()
   z.string().uuid()
   ```

2. **Integrate refinements directly**
   ```typescript
   // ✅ Correct
   const schema = z.object({
     email: z.email(),
     age: z.number().min(18, "Must be 18+")
   })
   ```

3. **Use template literals for string patterns**
   ```typescript
   const hexColor = z.templateLiteral`#${/[0-9A-Fa-f]{6}/}`
   ```

### Zustand v5 Best Practices

1. **Use TypeScript with explicit types**
   ```typescript
   create<MyState>()((set) => ({...}))
   ```

2. **Use combine for state + actions separation**
   ```typescript
   create(combine(
     { count: 0 }, // state
     (set) => ({ increment: () => set(s => ({ count: s.count + 1 })) }) // actions
   ))
   ```

3. **Use shallow equality for selectors**
   ```typescript
   import { shallow } from 'zustand/shallow'
   const { x, y } = useStore((s) => ({ x: s.x, y: s.y }), shallow)
   ```

4. **Use persist for user preferences only**
   ```typescript
   persist(
     (set) => ({...}),
     { name: 'user-preferences', partialize: (state) => ({ theme: state.theme }) }
   )
   ```

---

## Success Criteria

### Zod Implementation Success
- [ ] All API requests are validated before processing
- [ ] All API responses are validated before returning
- [ ] Type errors are caught at compile time
- [ ] Runtime validation provides clear error messages
- [ ] All schemas have JSDoc comments

### Zustand Implementation Success
- [ ] All component state is managed by Zustand
- [ ] No useState calls in main components
- [ ] State changes trigger proper re-renders
- [ ] DevTools integration works
- [ ] Persistence works for user preferences
- [ ] All store actions have JSDoc comments

### Overall Success
- [ ] Application compiles without errors
- [ ] All TypeScript types are properly inferred
- [ ] No runtime type errors
- [ ] State management is centralized and predictable
- [ ] Code is maintainable and well-documented

---

**Next Steps**: See [ZOD_ZUSTAND_CHECKLIST.md](./ZOD_ZUSTAND_CHECKLIST.md) for detailed implementation checklist.
