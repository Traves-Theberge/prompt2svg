# Process Flow Diagrams

## 🔄 Full End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                              │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────┐ │
│  │ LEFT SIDEBAR     │    │  CENTER CANVAS   │    │ RIGHT SIDEBAR│ │
│  │                  │    │                  │    │              │ │
│  │ • Icon Gallery   │    │ INPUT → AI →     │    │ • SVG Code   │ │
│  │   Ghost         │    │   OUTPUT Diagram │    │ • Color      │ │
│  │   ○ Select ───┐ │    │                  │    │   Picker     │ │
│  │              │ │    │ • Console Logs   │    │ • Sliders    │ │
│  │ • Model Picker │    │   (Real-time)    │    │   - Width    │ │
│  │   Claude ──────┼────│                  │    │   - Simplify │ │
│  │              │ │    │ • Chat Input     │    │   - Smooth   │ │
│  │ • Preset List  │ │    │   "Make it cool" │    │              │ │
│  │   Neon ──────┐ │    │                  │    └──────────────┘ │
│  │              │ │    │ [GENERATE BTN] ──────────────────────┐ │
│  │ • Parameters  │ │    │                  │                  │ │
│  │   Color       │ │    │ Console Output:  │                  │ │
│  │   #60A5FA ────┼─┼────│ ├─ Initializing  │                  │ │
│  │   Width: 2.5  │ │    │ ├─ Ingesting SVG │                  │ │
│  │   Simp: 30%   │ │    │ ├─ Applying     │                  │ │
│  │   Smooth: 70% │ │    │ │   preset      │                  │ │
│  │              │ │    │ └─ Complete ✓   │                  │ │
│  └──────────────────┘    │                  │                  │ │
│       Data Collection    └──────────────────┘                  │ │
└────────────┬──────────────────────────────────────────────────┼──┘
             │                                                  │
             └──────────────────────┬───────────────────────────┘
                                    │
                           handleGenerate()
                          Validate & Package
                                    │
                    ┌───────────────▼─────────────────┐
                    │  FRONTEND PROCESSING            │
                    │  index.tsx                      │
                    │                                 │
                    │ 1. Validate inputs              │
                    │ 2. Get icon SVG code            │
                    │ 3. Build system prompt          │
                    │    (with embedded SVG)          │
                    │ 4. Package JSON:                │
                    │    - iconSVGCode                │
                    │    - userPrompt                 │
                    │    - systemPrompt               │
                    │    - selectedModel              │
                    │    - parameters                 │
                    │ 5. POST to API                  │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼──────────────────┐
                    │ POST /api/openrouter/generate   │
                    │ generate/route.ts               │
                    │                                 │
                    │ 1. Validate with Zod            │
                    │ 2. Extract data                 │
                    │ 3. Build user prompt            │
                    │ 4. Prepare OpenRouter request   │
                    │ 5. Call OpenRouter API          │
                    └───────────────┬──────────────────┘
                                    │
                ┌───────────────────▼─────────────────┐
                │  OPENROUTER / CLAUDE               │
                │                                     │
                │ Receives:                           │
                │ - System: Full context + SVG        │
                │ - User: Style params & request      │
                │                                     │
                │ Processing:                         │
                │ 1. Parse SVG structure              │
                │ 2. Understand modifications         │
                │ 3. Apply style parameters           │
                │ 4. Generate modified SVG            │
                │ 5. Return JSON response             │
                └───────────────┬─────────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   Parse Response       │
                    │                        │
                    │ Try JSON parse         │
                    │   ↓                    │
                    │ Try regex extract      │
                    │   ↓                    │
                    │ Fallback SVG wrapper   │
                    └───────────┬────────────┘
                                │
                ┌───────────────▼──────────────────┐
                │  DISPLAY RESULTS                 │
                │  (Return to Frontend)            │
                │                                  │
                │ {                                │
                │   svg: "<svg>...</svg>",        │
                │   explanation: "Made it..."     │
                │ }                                │
                │                                  │
                │ Update state:                    │
                │ - setCurrentResult(svg)          │
                │ - setStatus('success')           │
                │ - addLog(explanation)            │
                └───────────────┬──────────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │ RENDER IN UI             │
                    │                          │
                    │ ├─ Canvas:               │
                    │ │  Show SVG rendering    │
                    │ │                        │
                    │ ├─ Inspector:            │
                    │ │  Display code          │
                    │ │                        │
                    │ └─ Console:              │
                    │    Show explanation     │
                    └──────────────────────────┘
```

---

## 📤 What Gets Sent (Data Packets)

### Packet 1: Frontend → API
```
POST /api/openrouter/generate

{
  "iconSVGCode": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\">\n  <path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"/>\n</svg>",
  
  "sourceIconName": "Ghost",
  
  "stylePreset": "Neon",
  
  "userPrompt": "Make it look futuristic with sharp edges",
  
  "systemPrompt": "You are an expert SVG designer and modifier.\nYou will receive:\n1. A source SVG icon\n2. User instructions for modifications\n3. Style parameters\n\nCurrent Source Icon:\n<svg>...</svg>\n\nUser Instructions: \"Make it look futuristic...\"\n\nStyle Parameters:\n- Primary Color: #60A5FA\n- Outline Width: 2.5px\n- Simplification Level: 30% (0=detailed, 100=simplified)\n- Smoothing: 70% (0=sharp, 100=very smooth)\n- Style Preset: Neon\n\nRequirements:\n1. Maintain core shape\n2. Apply user instructions\n3. Use primary color\n4. Return ONLY valid SVG\n5. Wrap in proper <svg> tags",
  
  "selectedModel": "openrouter/anthropic/claude-3.5-sonnet",
  
  "parameters": {
    "primaryColor": "#60A5FA",
    "outlineWidth": 2.5,
    "simplification": 30,
    "smoothing": 70
  }
}
```

### Packet 2: API → OpenRouter
```
POST https://openrouter.ai/api/v1/chat/completions

{
  "model": "openrouter/anthropic/claude-3.5-sonnet",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert SVG designer and modifier.\n..."
    },
    {
      "role": "user",
      "content": "Generate a NEW SVG variant...\nReturn STRICT JSON: {svg, explanation}\n\nStyle preset: Neon\nUser prompt: Make it look futuristic...\n\nCRITICAL STYLE PARAMETERS:\n1. Primary Color: #60A5FA\n2. Stroke Width: 2.5px\n3. Simplification: 30%\n4. Smoothing: 70%\n\nRules:\n- No <script> tags\n- Keep viewBox 0 0 24 24\n- Prefer paths/lines/circles"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

### Packet 3: OpenRouter → API
```
{
  "choices": [
    {
      "message": {
        "content": "{\n  \"svg\": \"<svg xmlns=\\\"http://www.w3.org/2000/svg\\\" viewBox=\\\"0 0 24 24\\\" fill=\\\"none\\\" stroke=\\\"#60A5FA\\\" stroke-width=\\\"2.5\\\" stroke-linecap=\\\"round\\\" stroke-linejoin=\\\"round\\\">\\n  <path d=\\\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\\\"/>\\n</svg>\",\n  \"explanation\": \"Applied bright blue color (#60A5FA) with 2.5px strokes for a neon effect. Maintained circular shape with simplified geometry (30%) and smooth curves (70%) to create futuristic look with sharp edges.\"\n}\n"
      }
    }
  ]
}
```

### Packet 4: API → Frontend
```json
{
  "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#60A5FA\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n  <path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"/>\n</svg>",
  "explanation": "Applied bright blue color (#60A5FA) with 2.5px strokes for a neon effect..."
}
```

---

## 🧠 Claude's Processing

```
┌─────────────────────────────────────────────────────────┐
│  SYSTEM MESSAGE RECEIVED                                │
├─────────────────────────────────────────────────────────┤
│ "You are an expert SVG designer and modifier"           │
│                                                         │
│ Context Absorbed:                                       │
│ ✓ Role understanding                                    │
│ ✓ Input structure (SVG + instructions + params)         │
│ ✓ Task: Modify & enhance                                │
│ ✓ Source icon SVG code:                                 │
│   <svg viewBox="0 0 24 24">                             │
│     <path d="M12 2C6.48 2..."/>                         │
│   </svg>                                                 │
│                                                         │
│ ✓ User wants: "futuristic with sharp edges"            │
│ ✓ Style params: Blue #60A5FA, 2.5px width, etc.         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  USER MESSAGE RECEIVED                                  │
├─────────────────────────────────────────────────────────┤
│ "Generate a NEW SVG variant..."                         │
│ "Return STRICT JSON: {svg, explanation}"                │
│                                                         │
│ Requirements Processing:                                │
│ ✓ Must return JSON                                      │
│ ✓ CRITICAL: Apply color #60A5FA                         │
│ ✓ CRITICAL: Set stroke-width="2.5"                      │
│ ✓ CRITICAL: Simplify to 30%                             │
│ ✓ CRITICAL: Smooth curves 70%                           │
│ ✓ CRITICAL: No <script> tags                            │
│ ✓ CRITICAL: Keep viewBox 0 0 24 24                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  PROCESSING & GENERATION                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. ANALYZE SOURCE                                      │
│     ├─ Parse SVG path: "M12 2C6.48..."                  │
│     ├─ Identify shape: circle/ring                      │
│     └─ Understand geometry                              │
│                                                         │
│  2. UNDERSTAND REQUEST                                  │
│     ├─ User wants: futuristic + sharp                   │
│     ├─ Preset: Neon                                     │
│     └─ Implication: bright, glowing, high-contrast      │
│                                                         │
│  3. PLAN MODIFICATIONS                                  │
│     ├─ Colors: Use #60A5FA                              │
│     ├─ Width: 2.5px strokes                             │
│     ├─ Simplify: Reduce path nodes by 70%               │
│     ├─ Smooth: Apply bezier curves                      │
│     └─ Effect: Sharp, futuristic look                   │
│                                                         │
│  4. GENERATE MODIFIED SVG                               │
│     ├─ Keep original viewBox                            │
│     ├─ Apply stroke="#60A5FA"                           │
│     ├─ Set stroke-width="2.5"                           │
│     ├─ Modify path for simplification                   │
│     ├─ Smooth curves per requirement                    │
│     └─ Validate syntax                                  │
│                                                         │
│  5. EXPLAIN CHANGES                                     │
│     └─ "Applied blue color for neon effect..."          │
│                                                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  RETURN JSON RESPONSE                                   │
├─────────────────────────────────────────────────────────┤
│ {                                                       │
│   "svg": "<svg xmlns=\"...\" viewBox=\"0 0 24 24\"     │
│           fill=\"none\"                                  │
│           stroke=\"#60A5FA\"                             │
│           stroke-width=\"2.5\"                           │
│           stroke-linecap=\"round\"                       │
│           stroke-linejoin=\"round\">                     │
│           <path d=\"M12 2...\"/>                         │
│           </svg>",                                      │
│                                                         │
│   "explanation": "Applied bright blue (#60A5FA)...      │
│                   futuristic look with sharp edges"     │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Preset Impact Diagram

```
GHOST ICON
    ↓
┌──────────────────────────────────────────────────────┐
│  PRESET SELECTOR                                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  None     →  Simple gray shape                       │
│  Neon     →  Bright color + glow effect              │
│  Sketch   →  Dashed strokes + hand-drawn feel        │
│  Solid    →  Filled solid color                      │
│  Pixel    →  Pixelated grid effect                   │
│  Glitch   →  RGB color shift + misalignment          │
│  Blueprint→  Grid + technical drawing style          │
│                                                      │
└──────────────────────────────────────────────────────┘
    ↓
EACH PRESET ADDS CONTEXT TO PROMPT:
    ↓
Neon:    "Add bright glow effects, high contrast"
         ↓ Applied at Claude generation
         ↓
Sketch:  "Add hand-drawn appearance, dashed strokes"  
         ↓ Applied at Claude generation
         ↓
Solid:   "Remove strokes, fill with solid color"
         ↓ Applied at Claude generation
         ↓
CLAUDE GENERATES ACCORDINGLY
    ↓
RESULT: Preset-specific output
```

---

## ❌ Error Handling Flow

```
USER TRIGGERS GENERATION
    ↓
VALIDATION CHECKS:
├─ Model selected? ──NO──→ Error: "Select a model"
│  YES
├─ Icon selected or SVG pasted? ──NO──→ Error: "Provide icon"
│  YES
├─ Parameters valid? ──NO──→ Error: "Invalid params"
│  YES
└─ All checks pass? → Continue
    ↓
API REQUEST SENT
    ↓
API RESPONSE VALIDATION:
├─ API returns 200? ──NO──→ Error: "OpenRouter error"
│  YES
├─ Has JSON content? ──NO──→ Try regex extraction
│                        NO──→ Try fallback
│  YES
├─ Contains <svg...>? ──NO──→ Try fallback
│  YES
└─ Valid syntax? ──NO──→ Warn but continue
    ↓
CLAUDE RESPONSE HANDLING:
├─ Parsed JSON? ──YES──→ Use svg field
│  NO
├─ Regex match? ──YES──→ Extract SVG
│  NO
├─ Has content? ──YES──→ Wrap in SVG tag
│  NO
└─ Empty ──→ Return error
    ↓
SUCCESS: Return { svg, explanation }
    ↓
DISPLAY IN UI
```

---

## 📊 Parameter Application

```
USER SELECTS PARAMETERS:
├─ Color: #60A5FA (blue)
├─ Width: 2.5px
├─ Simplification: 30% (keep details)
└─ Smoothing: 70% (smooth curves)
    ↓
FRONTEND EMBEDS IN SYSTEM PROMPT:
"Style Parameters:
 - Primary Color: #60A5FA
 - Outline Width: 2.5px
 - Simplification: 30%
 - Smoothing: 70%"
    ↓
BACKEND REPEATS IN USER PROMPT:
"CRITICAL PARAMETERS:
 1. Primary Color: #60A5FA → stroke/fill
 2. Stroke Width: 2.5px → stroke-width
 3. Simplification: 30% → keep details
 4. Smoothing: 70% → use bezier"
    ↓
CLAUDE APPLIES TO SVG:
✓ stroke="#60A5FA"
✓ stroke-width="2.5"
✓ path points reduced (30%)
✓ curves smoothed (70%)
    ↓
RESULT SVG WITH ALL PARAMS APPLIED
```

This should give you a complete visual understanding of how everything flows! Which part needs refinement?
