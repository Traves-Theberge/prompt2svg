# Quick Reference - Prompt & Process

## 📊 3-Part Prompt System

The app uses a **3-part strategy** to tell Claude how to modify icons:

### Part 1: SOURCE SVG CODE
```
What it contains:
- Actual SVG markup from selected icon
- Example: <svg viewBox="0 0 24 24"><path d="M..."/></svg>

Why it matters:
- Claude sees the exact structure to modify
- Not guessing from icon name like "Ghost"
- Can preserve geometry, adjust strokes/colors
```

### Part 2: SYSTEM PROMPT (from Frontend)
```
What it contains:
- Role: "You are an expert SVG designer and modifier"
- Context: "You will receive source SVG, user instructions, parameters"
- The actual SVG code (embedded)
- User's instructions: "Make it futuristic with sharp edges"
- All style parameters with explanations

Why it matters:
- Sets Claude's context and expectations
- Gives all info in ONE message
- More efficient than separate calls
```

### Part 3: USER PROMPT (from Backend)
```
What it contains:
- Request: "Generate a NEW SVG variant"
- Format requirement: "Return STRICT JSON"
- CRITICAL STYLE PARAMETERS (repeated)
  - Primary Color: #60A5FA (use for stroke/fill)
  - Stroke Width: 2.5px (set stroke-width)
  - Simplification: 30% (keep details)
  - Smoothing: 70% (use bezier curves)
- Rules: No scripts, viewBox 0 0 24 24, prefer paths

Why it matters:
- Reinforces critical styling requirements
- Ensures output matches user selections
- Provides safety constraints
```

---

## 🔄 Data Flow Map

```
INPUT LAYER (What user controls)
├─ Icon Selection (Ghost, Zap, etc.)
├─ User Prompt (Custom text instructions)
├─ Model Selection (Claude via OpenRouter)
├─ Style Preset (Neon, Sketch, etc.)
└─ Parameters (Color, Width, Simplification, Smoothing)
       ↓
FRONTEND PROCESSING (index.tsx)
├─ Extract SVG code from selected icon
├─ Validate all parameters (Zod)
├─ Build system prompt (with embedded SVG)
└─ Send JSON to API
       ↓
API PROCESSING (generate/route.ts)
├─ Validate request (Zod schema)
├─ Build comprehensive user prompt
├─ Combine system + user prompts
└─ Send to OpenRouter/Claude
       ↓
CLAUDE PROCESSING
├─ Read source SVG structure
├─ Understand user instructions
├─ Apply style parameters
└─ Generate modified SVG + explanation
       ↓
RESPONSE PARSING
├─ Extract JSON from Claude
├─ Fallback to regex if malformed
└─ Wrap in safe SVG if needed
       ↓
OUTPUT LAYER (What user sees)
├─ SVG rendered in canvas
├─ Code displayed in inspector
└─ Explanation shown in logs
```

---

## 📋 Current Prompt Template

### System Prompt (Built Frontend)
```
You are an expert SVG designer and modifier. 
You will receive:
1. A source SVG icon
2. User instructions for modifications
3. Style parameters (color, outline width, simplification, smoothing)

Your task: Modify and enhance the SVG based on all three inputs.

Current Source Icon:
[ACTUAL SVG CODE INSERTED HERE]

User Instructions: "[USER'S PROMPT HERE]"

Style Parameters:
- Primary Color: #60A5FA
- Outline Width: 2.5px
- Simplification Level: 30% (0=detailed, 100=simplified)
- Smoothing: 70% (0=sharp, 100=very smooth)
- Style Preset: Neon

Requirements:
1. Maintain the core shape/concept of the source icon
2. Apply the user's instructions to enhance/modify it
3. Use the primary color for strokes/fills
4. Return ONLY valid SVG code, no explanations
5. Make sure the SVG is wrapped in proper <svg> tags
```

### User Prompt (Built Backend)
```
Generate a NEW SVG variant based on the provided inputs.
Return STRICT JSON only (no markdown) with keys: svg (string), explanation (string).
The svg must be a complete <svg>...</svg> element.

Style preset: Neon
User prompt: "Make it futuristic with sharp edges"

CRITICAL STYLE PARAMETERS (Must be applied):
1. Primary Color: #60A5FA -> Use this for 'stroke' or 'fill' attributes.
2. Stroke Width: 2.5px -> Set stroke-width="2.5" on paths.
3. Simplification: 30% -> Keep details.
4. Smoothing: 70% -> Use smooth bezier curves.

Rules:
- No <script> tags.
- Keep viewBox consistent (use 0 0 24 24 unless the source implies otherwise).
- Prefer paths/lines/circles over text.
```

---

## 🎯 Key Implementation Points

| Component | File | Lines | Responsibility |
|-----------|------|-------|-----------------|
| Icon Collection | ConfigSidebar.tsx | 1-220 | Gather icon choice + preset |
| Prompt Building | index.tsx | 130-155 | Build system prompt with SVG |
| API Call | index.tsx | 156-180 | Send to backend |
| Validation | generate/route.ts | 26-36 | Validate Zod schema |
| Prompt Construction | generate/route.ts | 44-89 | Build user prompt |
| OpenRouter Call | generate/route.ts | 95-115 | Send to Claude |
| Response Parsing | generate/route.ts | 125-160 | Extract & fallback |
| Display | CanvasArea.tsx | 1-180 | Show SVG + logs |

---

## 💡 Optimization Opportunities

### ❌ Current Issues
1. **Token Duplication**: Style params repeated in system + user prompts
2. **Static Templates**: Same structure regardless of context
3. **No Examples**: Claude gets no reference examples of good output
4. **Weak Validation**: Doesn't check if returned SVG actually follows params
5. **Limited Recovery**: If SVG missing, just wraps text in SVG tags

### ✅ Potential Improvements
1. **Smarter Prompting**
   - Include example SVG transformations
   - Use preset-specific instructions
   - Reference visual style guides

2. **Better Validation**
   - Check if colors were actually applied
   - Verify stroke-width in output
   - Validate SVG syntax before returning

3. **Token Optimization**
   - Only repeat critical parameters
   - Use shorthand for standard requirements
   - Cache system prompts when possible

4. **Enhanced Presets**
   - Preset-specific Claude instructions
   - Parameter recommendations per preset
   - Visual preview of preset effect

5. **User Experience**
   - Prompt suggestions based on preset
   - Parameter presets per style
   - Preview before generating

---

## 🧪 Testing the Flow

### Test Case 1: Basic Modification
```
Input:
- Icon: Ghost
- Prompt: "Make it more angular"
- Color: #EF4444 (red)
- Stroke Width: 3px
- Simplification: 50%
- Smoothing: 20%

Expected:
- Output SVG uses red color
- Paths have stroke-width="3"
- Fewer details (50% simplified)
- Sharp angles (20% smooth)
```

### Test Case 2: Custom SVG
```
Input:
- Icon: Custom
- SVG: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
- Prompt: "Make it a square"
- Color: #60A5FA (blue)

Expected:
- Imports custom circle
- Modifies to square shape
- Applies blue color
```

### Test Case 3: Preset Style
```
Input:
- Icon: Heart
- Preset: Neon
- Prompt: "Enhance the glow"

Expected:
- Output has neon characteristics
- Glow effect enhanced per prompt
- Applies preset styling
```

---

## 🔗 Related Files

- **Frontend Orchestration**: `/components/svg-generator/index.tsx`
- **API Endpoint**: `/app/api/openrouter/generate/route.ts`
- **Icons & SVG**: `/components/svg-generator/iconHelpers.ts`
- **Presets**: `/components/svg-generator/presets.ts`
- **Validations**: `/lib/validations.ts`
- **Store**: `/lib/store.ts`

Want to drill into any specific section?
