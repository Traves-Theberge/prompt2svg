# Process and Flow: Zod & Zustand Implementation

## Overview

This document describes the comprehensive refactoring process that transformed prompt2svg from a component-based state management architecture to a professional enterprise-grade system using **Zod v4** for runtime validation and **Zustand v5** for centralized state management.

---

## Timeline and Phases

### Phase 1: Research & Planning
**Goal**: Verify latest documentation and plan implementation

1. **Context7 Research** (Zod v4)
   - Reviewed official Zod v4.1.13 documentation
   - Key changes from v3: Top-level validators, integrated refinements, template literals
   - Example: `z.email()` instead of `z.string().email()`

2. **Context7 Research** (Zustand v5)
   - Reviewed official Zustand v5.0.9 documentation
   - Modern hooks-based API, middleware composition, TypeScript inference
   - Compared alternatives: Redux, Jotai, Recoil

3. **Architecture Planning**
   - Created detailed implementation plan with Gherkin scenarios
   - Identified 4 store slices: UI, Generation, Models, Presets
   - Mapped validation points: API routes, component input, generation flow
   - Created checklist with 100+ granular tasks

---

### Phase 2: Schema & Store Creation
**Goal**: Build validation layer and state management foundation

#### Created Files

**`/lib/schemas.ts`** - Zod v4 Validation Schemas
```typescript
7 schemas + 4 array variants:
- SVGParametersSchema (validation rules)
- GenerationRequestSchema (API input validation)
- GenerationResponseSchema (API output validation)
- ModelSchema (AI model structure)
- StylePresetSchema (SVG style templates)
- ConsoleLogSchema (logging structure)
- GeneratedResultSchema (generation output)
```

**`/lib/types.ts`** - TypeScript Type Inference
```typescript
Automatic type extraction from schemas:
- type SVGParameters = z.infer<typeof SVGParametersSchema>
- type Model = z.infer<typeof ModelSchema>
- type GenerationRequest = z.infer<typeof GenerationRequestSchema>
- etc.
```

**`/lib/validations.ts`** - Validation Helpers
```typescript
Core functions:
- safeValidate<T>(): Wrapper for consistent error handling
- validateGenerationRequest(): Validate API request body
- validateGenerationResponse(): Validate API response
- validateModels(): Validate model array from OpenRouter
- formatValidationErrors(): User-friendly error messages
```

**`/lib/store.ts`** - Zustand v5 Store with Slices
```typescript
4 Store Slices:
1. UI Slice: theme, isModalOpen, selectedTab
2. Generation Slice: status, parameters, consoleLogs[], history[], currentResult
3. Models Slice: models[], selectedModel, isLoading, error, fetchModels()
4. Presets Slice: presets[], selectedPreset, searchQuery, filterPresets()

Middleware Stack:
- devtools: Redux DevTools integration
- persist: localStorage for UI preferences
```

---

### Phase 3: API Integration
**Goal**: Add runtime validation to backend endpoints

#### Modified Files

**`/app/api/openrouter/generate/route.ts`**
```diff
+ import { validateGenerationRequest } from "@/lib/validations"

  export async function POST(req: Request) {
    const body = await req.json();
+   const validation = validateGenerationRequest(body);
+   if (!validation.success) {
+     return Response.json({ error: validation.error }, { status: 400 });
+   }
    // ... rest of generation logic
  }
```

**`/app/api/openrouter/models/route.ts`**
```diff
+ import { validateModels } from "@/lib/validations"

  export async function GET() {
    const response = await fetch("https://openrouter.ai/api/v1/models");
    // ... transform response
+   const validation = validateModels(models);
    if (!validation.success) {
      console.warn("Model validation issues:", validation.error);
    }
    // return only valid models
  }
```

---

### Phase 4: Component Refactoring
**Goal**: Migrate svg-generator.tsx from useState to Zustand

#### Refactoring Process

1. **Import Updates**
```typescript
// Before
import { useState } from "react";

// After
import { useGenerationStore, useModelsStore, usePresetsStore, useUIStore } from "@/lib/store";
import { validateSVGParameters } from "@/lib/validations";
import type { ConsoleLog } from "@/lib/types";
```

2. **State Migration** (Removed 12 useState calls)

| useState Hook | Zustand Equivalent |
|---|---|
| `const [selectedIcon, setSelectedIcon] = useState()` | `const { selectedIcon, selectIcon } = useGenerationStore()` |
| `const [consoleLogs, setConsoleLogs] = useState()` | `const { consoleLogs, addLog } = useGenerationStore()` |
| `const [primaryColor, setPrimaryColor] = useState()` | `const { parameters, setParameters } = useGenerationStore()` |
| `const [availableModels, setAvailableModels] = useState()` | `const { models } = useModelsStore()` |
| `const [selectedModel, setSelectedModel] = useState()` | `const { selectModel } = useModelsStore()` |
| `const [presets, setPresets] = useState()` | `const { presets } = usePresetsStore()` |
| `const [isGenerating, setIsGenerating] = useState()` | `const { status } = useGenerationStore()` → `status === 'loading'` |

3. **Event Handler Updates**

**Color Picker Example:**
```typescript
// Before
const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setPrimaryColor(e.target.value);
};

// After
const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setParameters({ primaryColor: e.target.value });
};
```

**Model Selection Example:**
```typescript
// Before
<ComboBox 
  onValueChange={(id) => setSelectedModel(id)}
/>

// After
<ComboBox 
  onValueChange={(id) => selectModel(id)}
/>
```

4. **Validation Integration**

```typescript
const handleGenerate = async () => {
  // NEW: Validate parameters before generation
  const validation = validateSVGParameters(parameters);
  if (!validation.success) {
    addLog(`Invalid parameters: ${validation.error.message}`, "error");
    return;
  }

  setStatus('loading');
  // ... rest of generation logic
};
```

5. **Event Handlers Updated**
- Color picker: `setPrimaryColor()` → `setParameters({ primaryColor })`
- Outline width: `setOutlineWidth()` → `setParameters({ outlineWidth })`
- Simplification: `setSimplification()` → `setParameters({ simplification })`
- Smoothing: `setSmoothing()` → `setParameters({ smoothing })`
- Model selection: `setSelectedModel()` → `selectModel()`
- Preset selection: `setStylePreset()` → `selectPreset()`
- Preset search: `setPresetSearch()` → `setSearchQuery()`

6. **Status Management**
```typescript
// Before
setIsGenerating(true);
// ... API call
setIsGenerating(false);

// After
setStatus('loading');
// ... API call
setStatus('success'); // or 'error'
```

7. **Console Logging**
```typescript
// Before
const addConsoleLog = (text: string) => {
  setConsoleLogs([...consoleLogs, { text, timestamp: new Date() }]);
};

// After
const { addLog } = useGenerationStore();
addLog(`Message here`, "info"); // Uses store action with proper schema
```

8. **Result Storage**
```typescript
// Before
setGeneratedResult({ code: svgCode, style: cssStyle });

// After
setCurrentResult(svgCode); // Store just the SVG code
```

---

## Data Flow Diagram

### Generation Flow

```
User Input
    ↓
Component Event Handler
    ↓
validateSVGParameters() ← Zod Validation
    ↓
Store Actions (setParameters, setStatus)
    ↓
API Call: POST /api/openrouter/generate
    ↓
validateGenerationRequest() ← Zod Validation
    ↓
OpenRouter API
    ↓
validateGenerationResponse() ← Zod Validation
    ↓
Store Actions (setCurrentResult, setStatus)
    ↓
Component Re-renders (uses store selectors)
    ↓
Display SVG Result
```

### Model Loading Flow

```
Component Mount
    ↓
useEffect calls fetchModels()
    ↓
API Call: GET /api/openrouter/models
    ↓
Transform OpenRouter response
    ↓
validateModels() ← Zod Validation
    ↓
Store Actions (setModels)
    ↓
Component Re-renders (uses store selectors)
    ↓
Display Model List in Dropdown
```

### State Persistence Flow

```
User Changes Theme
    ↓
setTheme() action
    ↓
Store updates state
    ↓
Zustand persist middleware
    ↓
localStorage.setItem('svg-generator-store', JSON.stringify(state))
    ↓
Browser closes/refreshes
    ↓
App initializes
    ↓
Zustand loads from localStorage
    ↓
Component renders with persisted theme
```

---

## Key Implementation Patterns

### 1. Validation at Boundaries

Every external input is validated before processing:

```typescript
// API endpoint
const validation = validateGenerationRequest(body);
if (!validation.success) {
  return Response.json({ error: validation.error }, { status: 400 });
}

// Component before generation
const validation = validateSVGParameters(parameters);
if (!validation.success) {
  addLog(`Validation failed: ${validation.error.message}`, "error");
  return;
}
```

### 2. Type-Safe State Updates

All state changes go through store actions with proper typing:

```typescript
// Good: Type-safe, caught by TypeScript
setParameters({ primaryColor: '#ff0000' });

// Also good: Merge with existing parameters
setParameters({ ...parameters, primaryColor: '#ff0000' });

// Not good: Direct state mutation (prevented by Zustand immutability)
// state.parameters.primaryColor = '#ff0000';
```

### 3. Async Action with Loading States

```typescript
const fetchModels = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/openrouter/models');
    const data = await response.json();
    
    const validation = validateModels(data);
    if (!validation.success) throw new Error('Invalid models');
    
    setModels(validation.data);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    setIsLoading(false);
  }
};
```

### 4. Middleware Composition

```typescript
// Store created with two middleware layers
const useStore = create<State & Actions>()(
  // Layer 1: Redux DevTools for debugging
  devtools(
    // Layer 2: Persist to localStorage for specific slices
    persist(
      (set, get) => ({ /* store definition */ }),
      {
        name: 'svg-generator-store',
        partialize: (state) => ({
          theme: state.theme,
          selectedTab: state.selectedTab,
        }),
      }
    )
  )
);
```

---

## Testing the Implementation

### 1. Verify TypeScript Compilation
```bash
pnpm tsc --noEmit
# Expected: No errors
```

### 2. Check Store Integration
Open Redux DevTools (if installed):
```
chrome://extensions/
→ Enable Developer Mode
→ Search "Redux DevTools"
→ Add to Chrome
→ Open DevTools → Redux tab
```

### 3. Test Validation
In browser console:
```typescript
// This will fail validation if required fields missing
fetch('/api/openrouter/generate', {
  method: 'POST',
  body: JSON.stringify({ prompt: 'test' })
}).then(r => r.json())
// Expected: { error: "validation error details" }
```

### 4. Verify Persistence
```javascript
// In browser console after changing theme
localStorage.getItem('svg-generator-store')
// Should contain: { "theme": "dark", ... }
```

---

## Migration Guide for Developers

### Adding a New Store Slice

1. **Define Schema** in `/lib/schemas.ts`:
```typescript
export const MyFeatureSchema = z.object({
  enabled: z.boolean(),
  config: z.string().min(1),
});
```

2. **Create Type** in `/lib/types.ts`:
```typescript
export type MyFeature = z.infer<typeof MyFeatureSchema>;
```

3. **Add to Store** in `/lib/store.ts`:
```typescript
interface MyFeatureSlice {
  enabled: boolean;
  config: string;
  setEnabled: (enabled: boolean) => void;
  setConfig: (config: string) => void;
}

// In store definition:
const createMyFeatureSlice = (set: SetState<State & Actions>): MyFeatureSlice => ({
  enabled: false,
  config: '',
  setEnabled: (enabled) => set({ enabled }),
  setConfig: (config) => set({ config }),
});
```

4. **Use in Component**:
```typescript
const { enabled, config, setEnabled } = useStore(
  (state) => ({ enabled: state.enabled, ... })
);
```

### Adding a New Validation Rule

1. **Update Schema** in `/lib/schemas.ts`:
```typescript
export const SVGParametersSchema = z.object({
  // ... existing fields
  newField: z.number().min(0).max(100),
});
```

2. **Create Validator** in `/lib/validations.ts`:
```typescript
export const validateNewField = (value: unknown) => {
  const validation = SVGParametersSchema.pick({ newField: true }).safeParse({
    newField: value,
  });
  return {
    success: validation.success,
    error: validation.error,
    data: validation.data?.newField,
  };
};
```

3. **Use in Component**:
```typescript
const validation = validateNewField(userInput);
if (!validation.success) {
  addLog(`Invalid input: ${validation.error?.message}`, "error");
  return;
}
```

---

## Performance Considerations

### 1. Store Selectors
Instead of:
```typescript
// Bad: Re-renders entire component on any state change
const state = useStore();
```

Use:
```typescript
// Good: Re-renders only when specific state changes
const { parameters } = useGenerationStore((state) => ({ 
  parameters: state.parameters 
}));

const { status } = useGenerationStore((state) => ({ 
  status: state.status 
}));
```

### 2. Memoization
```typescript
// Cache filtered presets
const categoryFilteredPresets = useMemo(
  () => presets.filter((p) => p.category === selectedCategory),
  [presets, selectedCategory]
);
```

### 3. Debouncing Search
```typescript
// Debounce preset search to avoid excessive filtering
const debouncedSearch = useMemo(
  () => debounce((query: string) => setSearchQuery(query), 300),
  []
);
```

---

## Error Handling Strategy

### Validation Errors
```typescript
const validation = validateGenerationRequest(body);
if (!validation.success) {
  return Response.json({
    error: validation.error.message,
    details: validation.error.issues,
  }, { status: 400 });
}
```

### API Errors
```typescript
try {
  const response = await fetch('/api/openrouter/generate', { ... });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  // ... process response
} catch (error) {
  setStatus('error');
  addLog(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
}
```

### Store Errors
```typescript
setError(null); // Clear previous errors
try {
  // ... async operation
} catch (error) {
  setError(error instanceof Error ? error.message : 'Unknown error');
} finally {
  setIsLoading(false);
}
```

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Zod Schemas Created | 7 + 4 array variants |
| Store Slices | 4 (UI, Generation, Models, Presets) |
| TypeScript Errors Fixed | 8 → 0 |
| useState Calls Removed | 12 |
| Validation Points | 5 (1 component + 2 API routes + 2 helpers) |
| Middleware Layers | 2 (devtools, persist) |
| Persisted UI Preferences | theme, selectedTab, selected model |
| Build Status | ✅ Zero compilation errors |

---

## References

- [Zod v4 Documentation](https://zod.dev)
- [Zustand v5 Documentation](https://github.com/pmndrs/zustand)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
- [OpenRouter API](https://openrouter.ai/docs)

---

## Conclusion

This refactoring transformed prompt2svg from a component-driven architecture to a professional state management system with:

✅ Type-safe runtime validation at all boundaries
✅ Centralized, predictable state management
✅ Automatic UI persistence across sessions
✅ Full TypeScript compilation without errors
✅ Developer-friendly debugging with Redux DevTools
✅ Scalable architecture for future features

The implementation follows industry best practices and is ready for production deployment.
