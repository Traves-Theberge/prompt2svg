# System Architecture Overview

## Complete Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                          │
│                                                                       │
│  ┌──────────────┐         ┌──────────────┐      ┌──────────────┐   │
│  │   LEFT PANE  │         │  CENTER PANE │      │  RIGHT PANE  │   │
│  │              │         │              │      │              │   │
│  │ • Icons      │         │ • Canvas     │      │ • SVG Code   │   │
│  │ • Models ✓   │◄────────│ • Preview    │─────►│ • Color      │   │
│  │ • Styles     │         │ • Logs       │      │ • Sliders    │   │
│  │ • Search     │         │ • Input Bar  │      │              │   │
│  └──────┬───────┘         └────┬─────────┘      └──────────────┘   │
│         │                      │                                     │
│         └──────────┬───────────┘                                     │
│                    │                                                 │
│              [User Interactions]                                     │
│              • Select Icon                                           │
│              • Pick Model                                            │
│              • Choose Style                                          │
│              • Adjust Color/Params                                   │
│              • Enter Prompt                                          │
│              • Click Generate                                        │
│                    │                                                 │
└────────────────────┼─────────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  VALIDATION LAYER      │
        │                        │
        │  ✓ Model selected?     │
        │  ✓ Icon provided?      │
        │  ✓ SVG valid?          │
        │  ✓ Color format?       │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │   STATE UPDATE         │
        │                        │
        │ • Set isGenerating     │
        │ • Clear logs           │
        │ • Add initial logs     │
        └────────┬───────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API LAYER (Client → Server)                       │
│                                                                       │
│   POST /api/openrouter/generate                                     │
│                                                                       │
│   Request Payload:                                                  │
│   {                                                                  │
│     sourceIcon: "Ghost",          // Selected icon                  │
│     stylePreset: "Neon",          // Chosen style                   │
│     prompt: "Make it glow",       // User instructions              │
│     primaryColor: "#60A5FA",      // Selected color                 │
│     outlineWidth: 2,              // Stroke width                   │
│     simplification: 52,           // Path reduction %               │
│     smoothing: 61,                // Curve smoothing %              │
│     selectedModel: "claude-3-op"  // AI model from OpenRouter       │
│   }                                                                  │
└────────┬──────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND PROCESSING LAYER                          │
│                                                                       │
│  File: /api/openrouter/generate/route.ts                            │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Step 1: INPUT VALIDATION                                    │   │
│  │ • Verify API key present                                    │   │
│  │ • Check required parameters                                 │   │
│  │ • Validate model ID                                         │   │
│  └─────────────┬───────────────────────────────────────────────┘   │
│                │                                                     │
│  ┌─────────────▼───────────────────────────────────────────────┐   │
│  │ Step 2: PROMPT ENGINEERING                                  │   │
│  │                                                               │   │
│  │ System Prompt:                                               │   │
│  │ "You are an expert SVG designer AI..."                       │   │
│  │ + Style preset definitions                                   │   │
│  │ + Output format requirements                                 │   │
│  │                                                               │   │
│  │ User Prompt:                                                 │   │
│  │ "Generate SVG for Ghost icon"                                │   │
│  │ + All parameters (color, width, etc)                         │   │
│  │ + Style preset explanation                                   │   │
│  │ + User custom instructions                                   │   │
│  │ + Format requirements (valid SVG, no markdown)               │   │
│  └─────────────┬───────────────────────────────────────────────┘   │
│                │                                                     │
│  ┌─────────────▼───────────────────────────────────────────────┐   │
│  │ Step 3: OPENROUTER API CALL                                 │   │
│  │                                                               │   │
│  │ HTTP Request:                                                │   │
│  │ POST https://openrouter.ai/api/v1/chat/completions         │   │
│  │                                                               │   │
│  │ Headers:                                                      │   │
│  │ • Authorization: Bearer {API_KEY}                            │   │
│  │ • HTTP-Referer: {SITE_URL}                                   │   │
│  │ • X-Title: {APP_NAME}                                        │   │
│  │                                                               │   │
│  │ Body:                                                         │   │
│  │ • model: {selectedModel}                                     │   │
│  │ • messages: [{system}, {user}]                               │   │
│  │ • temperature: 0.7                                           │   │
│  │ • max_tokens: 2000                                           │   │
│  └─────────────┬───────────────────────────────────────────────┘   │
│                │                                                     │
│  ┌─────────────▼───────────────────────────────────────────────┐   │
│  │ Step 4: RESPONSE PARSING                                    │   │
│  │                                                               │   │
│  │ Try #1: Direct JSON parsing                                  │   │
│  │ {                                                             │   │
│  │   "svg": "<svg>...</svg>",                                   │   │
│  │   "explanation": "Generated neon..."                         │   │
│  │ }                                                             │   │
│  │                                                               │   │
│  │ Try #2: Extract from markdown code blocks                    │   │
│  │ ```json                                                       │   │
│  │ {...}                                                         │   │
│  │ ```                                                           │   │
│  │                                                               │   │
│  │ Try #3: Raw SVG extraction                                   │   │
│  │ If response contains <svg>, use as-is                        │   │
│  │                                                               │   │
│  │ Fallback: Return error message                               │   │
│  └─────────────┬───────────────────────────────────────────────┘   │
│                │                                                     │
│  ┌─────────────▼───────────────────────────────────────────────┐   │
│  │ Step 5: RESPONSE RETURN                                     │   │
│  │                                                               │   │
│  │ Success Response:                                             │   │
│  │ {                                                             │   │
│  │   "svg": "<svg xmlns='...' viewBox='0 0 24 24'>...",        │   │
│  │   "explanation": "Created neon Ghost icon..."                │   │
│  │ }                                                             │   │
│  │                                                               │   │
│  │ Error Response:                                               │   │
│  │ {                                                             │   │
│  │   "error": "Error message"                                   │   │
│  │ }                                                             │   │
│  └─────────────┬───────────────────────────────────────────────┘   │
│                │                                                     │
└────────────────┼──────────────────────────────────────────────────────┘
                 │
                 ▼ (HTTP Response)
┌─────────────────────────────────────────────────────────────────────┐
│                  CLIENT-SIDE RESPONSE HANDLING                       │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STATE UPDATE                                                 │   │
│  │ • Parse response JSON                                        │   │
│  │ • Update generatedResult state:                              │   │
│  │   {                                                           │   │
│  │     icon: selectedIcon,                                      │   │
│  │     style: stylePreset,                                      │   │
│  │     timestamp: Date.now(),                                   │   │
│  │     code: data.svg                                           │   │
│  │   }                                                           │   │
│  │ • Set isGenerating to false                                  │   │
│  │ • Add success log                                            │   │
│  └─────────────┬───────────────────────────────────────────────┘   │
│                │                                                     │
│  ┌─────────────▼───────────────────────────────────────────────┐   │
│  │ RENDERING                                                    │   │
│  │                                                               │   │
│  │ 1. Center Canvas:                                             │   │
│  │    • Display generated SVG in output node                    │   │
│  │    • Apply style preset effects (if applicable)              │   │
│  │    • Show real-time preview                                  │   │
│  │                                                               │   │
│  │ 2. Right Inspector:                                           │   │
│  │    • Populate SVG code viewer with generated code            │   │
│  │    • Enable copy button                                      │   │
│  │                                                               │   │
│  │ 3. Log Feed:                                                  │   │
│  │    • Add "Generation complete" message                       │   │
│  │    • Display explanation from AI                             │   │
│  │    • Scroll to latest log                                    │   │
│  └─────────────┬───────────────────────────────────────────────┘   │
│                │                                                     │
│  ┌─────────────▼───────────────────────────────────────────────┐   │
│  │ ERROR HANDLING                                               │   │
│  │                                                               │   │
│  │ If error:                                                     │   │
│  │ • Catch error in try/catch                                   │   │
│  │ • Extract error message                                      │   │
│  │ • Add error log (red)                                        │   │
│  │ • Stop loading animation                                     │   │
│  │ • Keep UI responsive for retry                               │   │
│  └─────────────┬───────────────────────────────────────────────┘   │
│                │                                                     │
└────────────────┼──────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    USER SEES FINAL RESULT                            │
│                                                                       │
│  ┌──────────────┐         ┌──────────────┐      ┌──────────────┐   │
│  │   LEFT PANE  │         │  CENTER PANE │      │  RIGHT PANE  │   │
│  │              │         │              │      │              │   │
│  │ Can modify & │         │ ✓ SVG shown  │      │ ✓ Code shown │   │
│  │ regenerate   │◄────────│ ✓ Preview    │─────►│ ✓ Copy ready │   │
│  │              │         │ ✓ Logs clear │      │ ✓ Download   │   │
│  │              │         │              │      │ ✓ Share      │   │
│  └──────────────┘         └──────────────┘      └──────────────┘   │
│                                                                       │
│  User can now:                                                       │
│  • Copy SVG code to clipboard                                        │
│  • Download as file                                                  │
│  • Share link (coming soon)                                          │
│  • Modify parameters and regenerate                                  │
│  • Try different models/styles                                       │
│  • Save to history (coming soon)                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component State Hierarchy

```
SvgGenerator (Main Component)
│
├── Source Configuration
│   ├── selectedIcon: string
│   ├── customSvg: string
│   └── renderSourceIcon(): JSX
│
├── Generation Parameters
│   ├── selectedModel: string (from OpenRouter)
│   ├── stylePreset: string (from presets array)
│   ├── prompt: string (user input)
│   └── handleGenerate(): Promise
│
├── Customization Settings
│   ├── primaryColor: string
│   ├── outlineWidth: number
│   ├── simplification: number
│   └── smoothing: number
│
├── Dynamic Data
│   ├── availableModels: Array
│   │   └── fetched from GET /api/openrouter/models
│   ├── generatedResult: Object
│   │   ├── icon: string
│   │   ├── style: string
│   │   ├── timestamp: number
│   │   └── code: string (SVG)
│   └── consoleLogs: Array
│       └── {id, text, type, timestamp}
│
├── UI State
│   ├── isGenerating: boolean
│   ├── modelsLoading: boolean
│   ├── modelsError: string | null
│   ├── showColorPicker: boolean
│   ├── presetSearch: string
│   ├── presetCategory: string
│   └── activeTab: string
│
├── Derived State
│   ├── filteredPresets: computed
│   ├── modelNameById: computed
│   └── renderIconPreview(): JSX
│
└── Event Handlers
    ├── handleGenerate()
    ├── addLog()
    └── useEffect hooks for:
        ├── Model loading
        ├── Log auto-scroll
        └── Theme management
```

---

## Request/Response Flow

```
CLIENT                          NETWORK                         SERVER
  │                               │                               │
  ├─ User clicks Generate ──────▶ │                               │
  │                               │                               │
  └─ POST to /api/openrouter/  ──▶│ ──────────────────────────┐   │
     generate                     │                           │   │
     {                            │                           │   │
       sourceIcon: "Ghost",       │                     ┌─────▼────┐
       selectedModel: "claude",   │                     │ Validation
       ...params...               │                     └─────┬────┘
     }                            │                           │
                                  │                     ┌─────▼────┐
  ◀─ Response (Promise) ─────────◀│─────────────────────┤ Parse    │
  │                               │                     │ Request  │
  │ {                             │                     └─────┬────┘
  │   svg: "<svg>...",            │                           │
  │   explanation: "..."          │                     ┌─────▼────┐
  │ }                             │                     │ Engineer │
  │                               │                     │ Prompts  │
  └─ Update State ──────────────▶ │                     └─────┬────┘
                                  │                           │
  ┌─ Re-render UI ───────────────▶│                   ┌─────▼──────┐
  │                               │                   │ Call OpenRouter API
  │                               │ ◀─────────────────│ /v1/chat/completions
  │                               │     OpenRouter    │ Request
  │                               │     Response      └─────┬────┘
  │                               │                           │
  │                               │                   ┌─────▼──────┐
  │                               │                   │ Parse      │
  │                               │                   │ OpenRouter │
  │                               │                   │ Response   │
  │                               │                   └─────┬────┘
  │                               │                           │
  │                               │ ◀─────────────────────────┤
  │                               │     HTTP 200 + JSON       │
  │                               │
  └─ Display Result              │
     • Show SVG preview
     • Show code
     • Log completion
     • Enable interactions
```

---

## Data Structures

### Generated Result Object
```typescript
interface GeneratedResult {
  icon: string;          // Source icon name
  style: string;         // Applied style preset
  timestamp: number;     // When it was generated
  code: string;          // Full SVG code
}
```

### Console Log Entry
```typescript
interface ConsoleLog {
  id: number;            // Unique timestamp
  text: string;          // Log message
  type: string;          // 'info' | 'error' | 'success'
  timestamp: string;     // HH:MM:SS format
}
```

### Model Entry
```typescript
interface Model {
  id: string;            // Model identifier (e.g., "gpt-4")
  name: string;          // Display name
}
```

### Style Preset
```typescript
interface StylePreset {
  id: string;            // Preset identifier
  label: string;         // Display name
  category: string;      // Category name
  color: string;         // Tailwind color class for indicator
}
```

---

This comprehensive architecture supports:
- ✅ Real-time model selection
- ✅ AI-powered SVG generation
- ✅ Customizable parameters
- ✅ Live preview and inspection
- ✅ Error handling and logging
- ✅ Responsive user interface
- ✅ Theme support (light/dark)
- ✅ Extensibility for future features
