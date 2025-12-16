# Prompt & Process Flow - Complete Breakdown

## 🎯 High-Level Flow

```
USER INPUT
    ↓
[Icon] + [Prompt] + [Parameters] + [Preset]
    ↓
FRONTEND (index.tsx)
  - Extracts SVG code from selected icon
  - Builds system prompt with icon + params
  - Sends everything to API
    ↓
API (generate/route.ts)
  - Validates all inputs (Zod)
  - Constructs comprehensive user prompt
  - Sends system + user prompt to Claude
    ↓
CLAUDE (OpenRouter)
  - Receives complete context
  - Modifies/enhances SVG
  - Returns JSON: {svg, explanation}
    ↓
FRONTEND
  - Parses response
  - Displays SVG in canvas
  - Shows explanation in logs
```

---

## 📝 Step-by-Step Process Breakdown

### STEP 1: User Collects Inputs

**Where**: `ConfigSidebar.tsx` & `CanvasArea.tsx`

**What User Selects**:
```
1. Source Icon          → selectedIcon (Ghost, Zap, etc. or "Custom")
2. Custom SVG (opt.)    → customSvg (if "Custom" selected)
3. Model               → selectedModel (Claude via OpenRouter)
4. Style Preset        → selectedPreset (Neon, Sketch, Glitch, etc.)
5. User Instructions   → prompt (text input in bottom bar)
6. Style Parameters    → primaryColor, outlineWidth, simplification, smoothing
```

**Example State**:
```javascript
selectedIcon: "Ghost"
prompt: "Make it look futuristic with sharp edges"
primaryColor: "#60A5FA"
outlineWidth: 2.5
simplification: 30  // Keep details
smoothing: 70       // Use curves
selectedPreset: "Neon"
selectedModel: "openrouter/anthropic/claude-3.5-sonnet"
```

---

### STEP 2: Frontend Prepares Request (index.tsx)

**Location**: `handleGenerate()` function, lines 107-180

#### 2a. Validate Inputs
```typescript
// Check model is selected
if (!selectedModel) {
  addConsoleLog("Please select a model first.", "error");
  return;
}

// Check custom SVG if needed
if (selectedIcon === 'Custom' && !customSvg.trim()) {
  addConsoleLog("Please paste SVG code for the custom icon.", "error");
  return;
}

// Validate parameters (Zod schema)
const validation = validateSVGParameters(parameters);
if (!validation.success) {
  addConsoleLog(`Invalid parameters: ${validation.error.message}`, "error");
  return;
}
```

#### 2b. Get Icon SVG Code
```typescript
const iconSVGCode = selectedIcon === "Custom" 
  ? customSvg 
  : (selectedIcon ? getIconSVGCode(selectedIcon as SelectedIcon, customSvg) : '');

// Result: actual SVG string like:
// <svg xmlns="..." viewBox="0 0 24 24" fill="none" stroke="currentColor"...>
//   <path d="M..."/>
// </svg>
```

#### 2c. Build System Prompt (Most Important!)
```typescript
const systemPrompt = `You are an expert SVG designer and modifier. 
You will receive:
1. A source SVG icon
2. User instructions for modifications
3. Style parameters (color, outline width, simplification, smoothing)

Your task: Modify and enhance the SVG based on all three inputs.

Current Source Icon:
${iconSVGCode}  // ← ACTUAL SVG CODE HERE

User Instructions: "${prompt || 'Enhance and modify this icon'}"

Style Parameters:
- Primary Color: ${primaryColor}
- Outline Width: ${outlineWidth}px
- Simplification Level: ${simplification}% (0=detailed, 100=simplified)
- Smoothing: ${smoothing}% (0=sharp, 100=very smooth)
- Style Preset: ${selectedPreset || 'None'}

Requirements:
1. Maintain the core shape/concept of the source icon
2. Apply the user's instructions to enhance/modify it
3. Use the primary color for strokes/fills
4. Return ONLY valid SVG code, no explanations
5. Make sure the SVG is wrapped in proper <svg> tags`;
```

#### 2d. Send to API
```typescript
const response = await fetch('/api/openrouter/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    iconSVGCode,           // Actual SVG source
    sourceIconName: selectedIcon,
    stylePreset: selectedPreset || 'None',
    userPrompt: prompt,    // "Make it futuristic..."
    systemPrompt,          // Complete instructions with SVG
    selectedModel,         // Claude 3.5 Sonnet
    parameters: {
      primaryColor,        // "#60A5FA"
      outlineWidth,        // 2.5
      simplification,      // 30
      smoothing,          // 70
    },
  }),
});
```

---

### STEP 3: Backend Processes Request (generate/route.ts)

**Location**: `/app/api/openrouter/generate/route.ts`, lines 1-179

#### 3a. Validate Input (Zod)
```typescript
const validationResult = validateGenerationRequest(body);

if (!validationResult.success) {
  return NextResponse.json({ 
    error: "Invalid request body", 
    details: formatValidationErrors(validationResult) 
  }, { status: 400 });
}
```

#### 3b. Extract Validated Data
```typescript
const {
  iconSVGCode,
  sourceIconName,
  stylePreset,
  userPrompt: prompt,
  systemPrompt: clientSystemPrompt,  // Comes from frontend
  selectedModel,
  parameters: { primaryColor, outlineWidth, simplification, smoothing },
} = validationResult.data;
```

#### 3c. Build Final Prompts

**System Prompt** (uses client's or fallback):
```typescript
const systemPrompt = clientSystemPrompt || 
  "You are an expert SVG designer. Produce clean, valid SVG markup...";
```

**User Prompt** (constructed on backend):
```typescript
const userPromptParts = [
  "Generate a NEW SVG variant based on the provided inputs.",
  "Return STRICT JSON only (no markdown) with keys: svg (string), explanation (string).",
  "The svg must be a complete <svg>...</svg> element.",
  "",
  // If using client system prompt (which has all context)
  `Style preset: ${stylePreset ?? "None"}`,
  `User prompt: ${prompt && prompt.trim() ? prompt : "none"}`,
  "",
  "CRITICAL STYLE PARAMETERS (Must be applied):",
  `1. Primary Color: ${primaryColor} -> Use this for 'stroke' or 'fill'`,
  `2. Stroke Width: ${outlineWidth}px -> Set stroke-width attribute`,
  `3. Simplification: ${simplification}% -> ${simplification > 50 ? "Reduce path nodes" : "Keep details"}`,
  `4. Smoothing: ${smoothing}% -> ${smoothing > 50 ? "Use bezier curves" : "Use sharp lines"}`,
  "",
  "Rules:",
  "- No <script> tags",
  "- Keep viewBox consistent (0 0 24 24)",
  "- Prefer paths/lines/circles over text",
];

const userPrompt = userPromptParts.join("\n");
```

**Result**: Complete prompt pair
```
SYSTEM: "You are an expert SVG designer... [SVG code here]..."
USER:   "Generate a NEW SVG variant... [Repeat critical params]..."
```

#### 3d. Call OpenRouter API
```typescript
const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": referer,
    "X-Title": title,
  },
  body: JSON.stringify({
    model: selectedModel,  // "openrouter/anthropic/claude-3.5-sonnet"
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,      // Creativity level
    max_tokens: 2000,      // Response length limit
  }),
});
```

#### 3e. Parse Claude's Response
```typescript
// Claude returns something like:
// {
//   "svg": "<svg>...</svg>",
//   "explanation": "I made it futuristic..."
// }

const parsed = tryParseJson(content);
let svg = (parsed?.svg ?? "").trim();
let explanation = (parsed?.explanation ?? "").trim();

// Fallback: extract SVG from raw response if not JSON
if (!svg) {
  const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) {
    svg = svgMatch[0].trim();
  }
}
```

#### 3f. Return to Frontend
```typescript
return NextResponse.json({ svg, explanation });
// {
//   "svg": "<svg xmlns=\"...\" viewBox=\"0 0 24 24\">...</svg>",
//   "explanation": "Applied blue color with 2.5px strokes..."
// }
```

---

### STEP 4: Frontend Displays Result (index.tsx)

```typescript
const data = await response.json();

addConsoleLog(`Rendering SVG paths (Stroke: ${outlineWidth}px, Color: ${primaryColor})...`);

setCurrentResult(data.svg);      // Store in state
setStatus('success');            // Mark as complete
addConsoleLog(`Generation complete. ${data.explanation}`, 'success');
```

**Result**:
- SVG rendered in center canvas
- Code displayed in right sidebar
- Explanation shown in console logs

---

## 🔄 Information Flow Chart

```
┌─────────────────────────────────────────────────────────┐
│ USER INTERFACE                                          │
│ ┌─────────────────┐ ┌──────────┐ ┌──────────────────┐  │
│ │ConfigSidebar    │ │CanvasArea│ │InspectorSidebar  │  │
│ │ - Icon selector │ │ - Input  │ │ - SVG viewer     │  │
│ │ - Model picker  │ │ - Canvas │ │ - Color picker   │  │
│ │ - Preset list   │ │ - Logs   │ │ - Sliders        │  │
│ └────────┬────────┘ └────┬─────┘ └──────────────────┘  │
│          └────────┬───────┘                             │
│                   ↓                                     │
│          index.tsx (Orchestrator)                       │
│          - Collects all inputs                          │
│          - Builds system prompt                         │
│          - Calls API                                    │
└─────────────────┬──────────────────────────────────────┘
                  │
                  ↓ POST /api/openrouter/generate
┌─────────────────────────────────────────────────────────┐
│ API ENDPOINT (generate/route.ts)                        │
│ 1. Validates all inputs (Zod)                           │
│ 2. Builds comprehensive user prompt                     │
│ 3. Constructs system prompt (from frontend)             │
│ 4. Sends to OpenRouter                                  │
└─────────────────┬──────────────────────────────────────┘
                  │
                  ↓ POST https://openrouter.ai/api/v1/chat/completions
┌─────────────────────────────────────────────────────────┐
│ CLAUDE AI (OpenRouter)                                  │
│ - Receives full context (SVG + instructions + params)   │
│ - Modifies SVG based on all inputs                      │
│ - Returns JSON with svg + explanation                   │
└─────────────────┬──────────────────────────────────────┘
                  │
                  ↓ { svg, explanation }
┌─────────────────────────────────────────────────────────┐
│ FRONTEND (Display)                                      │
│ - Parse SVG response                                    │
│ - Render in canvas                                      │
│ - Display in code viewer                                │
│ - Show explanation in logs                              │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 What Gets Passed At Each Stage

### Frontend → API
```javascript
{
  iconSVGCode: "<svg>...</svg>",     // Actual SVG source
  sourceIconName: "Ghost",            // Icon name
  stylePreset: "Neon",                // Style preset
  userPrompt: "Make it futuristic",   // User's instructions
  systemPrompt: "You are an...",      // System instructions with SVG
  selectedModel: "claude-3.5-sonnet",
  parameters: {
    primaryColor: "#60A5FA",
    outlineWidth: 2.5,
    simplification: 30,
    smoothing: 70,
  }
}
```

### API → Claude
```
SYSTEM MESSAGE:
"You are an expert SVG designer...
Current Source Icon:
<svg>...</svg>
[All parameters]"

USER MESSAGE:
"Generate a NEW SVG variant...
Return STRICT JSON...
CRITICAL STYLE PARAMETERS:
[Repeat all params]"
```

### Claude → API
```json
{
  "svg": "<svg xmlns=\"...\" viewBox=\"0 0 24 24\">...</svg>",
  "explanation": "Applied blue color with 2.5px strokes and smooth bezier curves..."
}
```

### API → Frontend
```json
{
  "svg": "<svg>...</svg>",
  "explanation": "..."
}
```

---

## 🔍 Areas for Potential Refinement

1. **System Prompt Construction**
   - Currently static with template variables
   - Could be more dynamic based on context
   - Could include examples of good SVGs

2. **User Prompt Quality**
   - Currently simple text input
   - Could add preset instruction templates
   - Could suggest improvements as user types

3. **Parameter Application**
   - Repeats parameters in both system + user prompts
   - Could optimize token usage
   - Could validate compatibility (e.g., simplification + smoothing)

4. **Error Handling**
   - Limited recovery if Claude returns invalid SVG
   - Could retry with different prompt
   - Could show Claude's reasoning

5. **Preset Integration**
   - Presets are just metadata
   - Could include preset-specific instructions in prompt
   - Could auto-adjust parameters based on preset

6. **Response Parsing**
   - Falls back to text wrapping if SVG missing
   - Could be more intelligent about partial responses
   - Could validate SVG before returning

What specific areas would you like to refine first?
