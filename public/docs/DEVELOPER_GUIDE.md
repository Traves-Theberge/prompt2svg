# Developer Quick Guide: Zod & Zustand

**TL;DR**: Schema validation → Type generation → Store management → Component integration

---

## File Structure

```
/lib/
├── schemas.ts          # Zod v4 validation schemas (7 schemas + 4 array variants)
├── types.ts            # TypeScript types inferred from schemas
├── validations.ts      # Validation helper functions
└── store.ts            # Zustand v5 store (4 slices + middleware)

/app/api/openrouter/
├── generate/route.ts   # POST endpoint with request validation
└── models/route.ts     # GET endpoint with response transformation

/components/
└── svg-generator.tsx   # Main component using Zustand hooks
```

---

## The Pattern

### 1️⃣ Define Schema (in `/lib/schemas.ts`)

```typescript
import { z } from 'zod';

export const SVGParametersSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
  outlineWidth: z.number().min(0).max(10),
  simplification: z.number().min(0).max(100),
  smoothing: z.number().min(0).max(100),
});
```

### 2️⃣ Infer Type (in `/lib/types.ts`)

```typescript
export type SVGParameters = z.infer<typeof SVGParametersSchema>;
// TypeScript automatically generates:
// {
//   primaryColor: string;
//   outlineWidth: number;
//   simplification: number;
//   smoothing: number;
// }
```

### 3️⃣ Create Validator (in `/lib/validations.ts`)

```typescript
export const validateSVGParameters = (data: unknown) => {
  return safeValidate(SVGParametersSchema, data);
};

// Usage:
const validation = validateSVGParameters(userInput);
if (!validation.success) {
  console.error(validation.error.message);
  return;
}
// validation.data is now typed as SVGParameters
```

### 4️⃣ Use in Store (in `/lib/store.ts`)

```typescript
interface GenerationSlice {
  parameters: SVGParameters;
  setParameters: (params: Partial<SVGParameters>) => void;
}

const createGenerationSlice = (set: SetState<State & Actions>): GenerationSlice => ({
  parameters: { primaryColor: '#374d68', outlineWidth: 2, ... },
  setParameters: (params) => set((state) => ({
    parameters: { ...state.parameters, ...params }
  })),
});
```

### 5️⃣ Use in Component (in `/components/svg-generator.tsx`)

```typescript
import { useGenerationStore } from '@/lib/store';
import { validateSVGParameters } from '@/lib/validations';

export function SVGGenerator() {
  const { parameters, setParameters, status, setStatus } = useGenerationStore();
  
  const handleGenerate = async () => {
    // Validate before generating
    const validation = validateSVGParameters(parameters);
    if (!validation.success) {
      console.error('Invalid parameters:', validation.error);
      return;
    }
    
    setStatus('loading');
    // ... call API
    setStatus('success');
  };
  
  return (
    <input 
      value={parameters.primaryColor}
      onChange={(e) => setParameters({ primaryColor: e.target.value })}
    />
  );
}
```

---

## Common Tasks

### Add a New Store Field

```typescript
// 1. Update schema if it's validated data
// 2. Add to TypeScript type (auto if using z.infer)
// 3. Add to Zustand slice
// 4. Use store hook in component
```

**Example:**
```typescript
// schemas.ts
export const SVGParametersSchema = z.object({
  primaryColor: z.string(),
  backgroundColor: z.string(),  // NEW
});

// store.ts
const createGenerationSlice = (set: SetState<State & Actions>): GenerationSlice => ({
  parameters: { 
    primaryColor: '#374d68',
    backgroundColor: '#ffffff',  // NEW
  },
  setParameters: (params) => set((state) => ({
    parameters: { ...state.parameters, ...params }
  })),
});

// component.tsx
const { parameters, setParameters } = useGenerationStore();
// backgroundColor is now available
// parameters.backgroundColor
```

### Add New Validation Rule

```typescript
// schemas.ts
export const SVGParametersSchema = z.object({
  outlineWidth: z.number().min(0).max(10).step(0.5),  // NEW: step validation
});

// validations.ts - no change needed, safeValidate handles it

// component.tsx
const validation = validateSVGParameters({ outlineWidth: 0.5 });
// Zod automatically validates the step constraint
```

### Use Store Selector (Optimized)

```typescript
// ✅ Good: Only re-renders when primaryColor changes
const { primaryColor } = useGenerationStore((state) => ({ 
  primaryColor: state.parameters.primaryColor 
}));

// ❌ Inefficient: Re-renders on any store change
const state = useGenerationStore();
const primaryColor = state.parameters.primaryColor;
```

### Validate API Response

```typescript
// In API route
export async function POST(req: Request) {
  const body = await req.json();
  
  // Validate request
  const validation = validateGenerationRequest(body);
  if (!validation.success) {
    return Response.json({ error: validation.error }, { status: 400 });
  }
  
  // ... call OpenRouter API
  const response = await callOpenRouter(validation.data);
  
  // Validate response
  const responseValidation = validateGenerationResponse(response);
  if (!responseValidation.success) {
    return Response.json({ error: 'Invalid response' }, { status: 500 });
  }
  
  return Response.json(responseValidation.data);
}
```

---

## Store Slices Reference

### UI Slice
```typescript
// State
theme: 'light' | 'dark'
isModalOpen: boolean
selectedTab: 'code' | 'history'

// Actions
setTheme(theme: 'light' | 'dark')
setModalOpen(open: boolean)
setSelectedTab(tab: 'code' | 'history')
```

### Generation Slice
```typescript
// State
status: 'idle' | 'loading' | 'success' | 'error'
parameters: SVGParameters
consoleLogs: ConsoleLog[]
history: GeneratedResult[]
currentResult: string | null

// Actions
setStatus(status: GenerationStatus)
setParameters(params: Partial<SVGParameters>)
addLog(message: string, type: LogType)
clearLogs()
setCurrentResult(result: string)
selectIcon(name: BuiltInIconName)
```

### Models Slice
```typescript
// State
models: Model[]
selectedModel: string
isLoading: boolean
error: string | null

// Actions
fetchModels()
selectModel(id: string)
setError(error: string | null)
```

### Presets Slice
```typescript
// State
presets: StylePreset[]
selectedPreset: string | null
searchQuery: string
filteredPresets: StylePreset[]

// Actions
selectPreset(id: string)
setSearchQuery(query: string)
filterPresets(category: string)
```

---

## Validation Helpers

### `safeValidate<T>(schema, data)`
Core wrapper for all validations
```typescript
const result = safeValidate(SVGParametersSchema, data);
// Returns: { success: boolean; data?: T; error?: ZodError }
```

### `validateGenerationRequest(data)`
Validate POST body for `/api/openrouter/generate`
```typescript
const validation = validateGenerationRequest(body);
if (validation.success) {
  // body is now typed as GenerationRequest
}
```

### `validateGenerationResponse(data)`
Validate response from OpenRouter API
```typescript
const validation = validateGenerationResponse(apiResponse);
// Ensures: { success: true, svgCode: string }
```

### `validateModels(data)`
Validate model array
```typescript
const validation = validateModels(modelsArray);
// Ensures: Model[]
```

### `formatValidationErrors(error)`
Convert Zod error to user-friendly message
```typescript
const message = formatValidationErrors(validation.error);
// Returns: "field 'primaryColor' must be a valid hex color"
```

---

## Testing

### Test Zod Schema
```typescript
const validation = SVGParametersSchema.safeParse({
  primaryColor: '#ff0000',
  outlineWidth: 5,
  simplification: 50,
  smoothing: 50,
});

expect(validation.success).toBe(true);
```

### Test Store Action
```typescript
const store = useGenerationStore.getState();
store.setParameters({ primaryColor: '#00ff00' });
expect(store.parameters.primaryColor).toBe('#00ff00');
```

### Test Validation Helper
```typescript
const result = validateSVGParameters({
  primaryColor: 'invalid',  // Not a hex color
  outlineWidth: 20,          // Out of range (0-10)
});

expect(result.success).toBe(false);
expect(result.error?.issues).toHaveLength(2);
```

---

## Debugging

### Redux DevTools
```
1. Open DevTools (F12)
2. Find Redux tab
3. See all store actions and state changes
4. Time-travel debug by clicking actions
```

### Console Logging
```typescript
const { consoleLogs, addLog } = useGenerationStore();

// Log to store
addLog('SVG generated successfully', 'success');

// View logs
consoleLogs.forEach(log => {
  console.log(`[${log.type}] ${log.message}`);
});
```

### Validation Debugging
```typescript
const validation = validateSVGParameters(data);
if (!validation.success) {
  console.log('Validation errors:', validation.error.issues);
  // Issues format: { path: string[], message: string }[]
}
```

### localStorage Persistence
```javascript
// In browser console
localStorage.getItem('svg-generator-store')
// See all persisted state
```

---

## Performance Tips

### 1. Use Selectors for Specific State
```typescript
// ✅ Good
const { primaryColor } = useGenerationStore(state => ({
  primaryColor: state.parameters.primaryColor
}));

// ❌ Bad: Re-renders on any state change
const primaryColor = useGenerationStore().parameters.primaryColor;
```

### 2. Memoize Computed Values
```typescript
const categoryFilteredPresets = useMemo(
  () => presets.filter(p => p.category === selectedCategory),
  [presets, selectedCategory]
);
```

### 3. Debounce Search
```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => setSearchQuery(query), 300),
  []
);

// Use debounced function in onChange
<input onChange={(e) => debouncedSearch(e.target.value)} />
```

---

## Quick Reference: Before vs After

### State Management

**Before (useState)**
```typescript
const [primaryColor, setPrimaryColor] = useState('#374d68');
const [outlineWidth, setOutlineWidth] = useState(2);
const [status, setStatus] = useState('idle');
// ... 9 more useState calls
```

**After (Zustand)**
```typescript
const { parameters, setParameters, status, setStatus } = useGenerationStore();
// All state in one place, properly typed, validated
```

### Validation

**Before (None)**
```typescript
// Directly use user input without validation
const svg = await generateSVG(parameters);
```

**After (Zod)**
```typescript
const validation = validateSVGParameters(parameters);
if (!validation.success) {
  addLog(`Validation failed: ${validation.error.message}`, 'error');
  return;
}
const svg = await generateSVG(validation.data);
```

### Type Safety

**Before (Any)**
```typescript
const [result, setResult] = useState<any>(null);
result.code.length; // No type checking
```

**After (Inferred)**
```typescript
const { currentResult } = useGenerationStore();
// currentResult: string | null
// Fully typed, all operations checked
```

---

## Key Takeaways

1. **Schema is source of truth** → Types flow from schemas
2. **Validate at boundaries** → API endpoints and component input
3. **Store is state authority** → All UI state lives here
4. **Actions are type-safe** → Store actions properly typed
5. **Persistence is automatic** → UI theme/settings saved to localStorage
6. **Debugging is easy** → Redux DevTools integration included

---

## Resources

- [Zod v4 Docs](https://zod.dev)
- [Zustand v5 Docs](https://github.com/pmndrs/zustand)
- [PROCESS_AND_FLOW.md](./PROCESS_AND_FLOW.md) - Full implementation details
- [ZOD_ZUSTAND_IMPLEMENTATION_PLAN.md](./ZOD_ZUSTAND_IMPLEMENTATION_PLAN.md) - Architecture plan
