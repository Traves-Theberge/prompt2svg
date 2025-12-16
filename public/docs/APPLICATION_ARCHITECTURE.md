# Prompt2SVG - Application Architecture & Workflow

## Overview
Prompt2SVG is an AI-powered SVG generation and transformation tool that allows users to create custom SVG icons by providing a source icon, selecting a style preset, and adding custom prompts. It leverages OpenRouter API to access various AI models for intelligent SVG generation.

---

## Architecture

### Technology Stack
- **Frontend**: Next.js 16 with React 19, TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion for animations
- **UI Components**: shadcn/ui with Base UI, Lucide React icons
- **Backend**: Next.js API Routes
- **AI Integration**: AI SDK v5 (with direct OpenRouter API integration)
- **Validation**: Zod for schema validation

### Project Structure
```
prompt2svgapp/
├── app/
│   ├── page.tsx                    # Main page entry
│   ├── api/
│   │   └── openrouter/
│   │       ├── models/
│   │       │   └── route.ts        # Fetch available models from OpenRouter
│   │       └── generate/
│   │           └── route.ts        # AI generation endpoint
│   ├── globals.css                 # Global styles & theme variables
│   └── layout.tsx                  # Root layout
├── components/
│   ├── svg-generator.tsx           # Main application component
│   └── ui/                         # UI component library
└── lib/
    └── utils.ts                    # Utility functions
```

---

## User Workflow

### 1. **Input Selection Phase**
Users can choose their source SVG in three ways:
- **Predefined Icons**: Select from 8 built-in Lucide icons (Ghost, Zap, Heart, Skull, etc.)
- **Custom SVG**: Paste raw SVG code into the textarea
- **Upload SVG**: Future feature for file uploads

### 2. **Configuration Phase**
Users customize the generation parameters:

#### **Model Selection**
- Dropdown list populated from OpenRouter API
- Supports 100+ models (Claude, GPT, Gemini, Llama, etc.)
- Real-time model fetching on component mount

#### **Style Presets**
- **30+ style categories** organized in 6 groups:
  - **Minimal**: None, Solid, Line, Sticker, Glass
  - **Tech**: Neon, Glitch, Pixel, Blueprint, Wireframe, Circuit, Terminal
  - **Artistic**: Sketch, Watercolor, Graffiti, Chalk, Ink, Oil, PopArt
  - **Geometric**: Origami, LowPoly, Cubist, Mosaic, Hex
  - **Textured**: Grunge, Noise, Wood, Metal

#### **Advanced Parameters**
- **Primary Color**: Color picker with preset swatches
- **Outline Width**: 1-5px stroke width control
- **Simplification**: 0-100% path complexity reduction
- **Smoothing**: 0-100% curve smoothing level
- **Custom Prompt**: Free-text user instructions for the AI

### 3. **Generation Phase**

The system performs the following steps:

```
User Input
    ↓
[SVG Generator Component]
    ├─ Validates inputs
    ├─ Prepares request payload
    └─→ POST /api/openrouter/generate
         ↓
[Backend Generation Endpoint]
    ├─ Validates required parameters
    ├─ Constructs AI prompt with system instructions
    ├─ Calls OpenRouter API with selected model
    ├─ Parses AI response (handles JSON/SVG/markdown)
    └─→ Returns { svg, explanation }
         ↓
[Front-end Processing]
    ├─ Updates generated result state
    ├─ Renders SVG in output canvas
    ├─ Logs generation metrics
    └─ Displays generated SVG code
```

### 4. **Output & Inspection Phase**

Users can:
- **Preview**: See real-time preview of generated SVG with style effects
- **Inspect**: View full SVG source code in the Inspector panel
- **Copy**: Copy generated SVG to clipboard (feature ready)
- **Download**: Download as SVG file (feature ready)
- **Share**: Share SVG via URL (feature ready)
- **Refine**: Modify colors/parameters and regenerate

---

## AI Generation Process

### Request Structure
```typescript
{
  sourceIcon: string;      // Icon name or custom SVG
  stylePreset: string;     // Style category (Neon, Sketch, etc)
  prompt: string;          // User's custom instructions
  primaryColor: string;    // Hex color code
  outlineWidth: number;    // Stroke width in pixels
  simplification: number;  // 0-100%
  smoothing: number;       // 0-100%
  selectedModel: string;   // OpenRouter model ID
}
```

### AI Prompt Engineering

The backend uses a **two-part prompt system**:

1. **System Prompt** (Context & Rules)
   - Describes the role: "Expert SVG designer AI"
   - Lists style preset definitions
   - Specifies output format requirements
   - Emphasizes validity and format compliance

2. **User Prompt** (Specific Task)
   - Icon name to transform
   - Requested style preset
   - Color, stroke, and processing parameters
   - User's custom instructions
   - Critical requirements (valid SVG, no markdown, etc)

### Response Handling
The endpoint intelligently parses AI responses:
1. Attempts direct JSON parsing
2. Extracts JSON from markdown code blocks
3. Falls back to raw SVG if JSON parsing fails
4. Gracefully handles errors with meaningful messages

---

## UI/UX Layout

### Three-Column Architecture

```
┌─────────────────────────────────────────────────────┐
│                    HEADER (12px)                     │
│              Theme Toggle | Beta Badge              │
├──────────────┬──────────────────────┬────────────────┤
│   LEFT       │      CENTER          │     RIGHT      │
│  SIDEBAR     │      CANVAS          │    INSPECTOR   │
│  (320px)     │                      │    (320px)     │
│              │    ┌──────────────┐   │                │
│ Config       │    │   INPUT      │   │  SVG Code      │
│ + Models     │    │     SVG      │   │  Viewer        │
│ + Presets    │    │              │   │                │
│              │    │              │   │  Color         │
│ (Scrollable) │    │   ↓ ARROW ↓  │   │  Picker        │
│              │    │              │   │                │
│              │    │  AI PROCESS  │   │  Sliders:      │
│              │    │              │   │  - Width       │
│              │    │   ↓ ARROW ↓  │   │  - Simplify    │
│              │    │              │   │  - Smooth      │
│              │    │   OUTPUT     │   │                │
│              │    │     SVG      │   │                │
│              │    │              │   │                │
│              │    │              │   │                │
│              │    │              │   │                │
│              │    │              │   │                │
│              │    └──────────────┘   │                │
│              │                        │                │
│              │    ┌──────────────┐   │                │
│              │    │  Log Feed    │   │                │
│              │    │  (Console)   │   │                │
│              │    └──────────────┘   │                │
│              │                        │                │
│              │    ┌──────────────┐   │                │
│              │    │ INPUT BAR    │   │                │
│              │    │ (Prompt +    │   │                │
│              │    │  Generate)   │   │                │
│              │    └──────────────┘   │                │
└──────────────┴──────────────────────┴────────────────┘
```

### Left Sidebar Features
- **Source Icon Selector**: Grid of 8 icons + custom upload
- **Model Selector**: Searchable combobox with OpenRouter models
- **Style Presets**: Filterable list with search & category tabs
  - Search by name
  - Filter by category (All, Minimal, Tech, Artistic, Geometric, Textured)
  - Visual color indicators for each style

### Center Canvas
- **Generation Pipeline Visualization**: Shows flow from input → AI processing → output
- **Real-time Preview**: Displays generated SVG or loading animation
- **Log Feed**: Real-time generation metrics and status messages
- **Input Bar**: Text area for custom prompts + Generate button

### Right Inspector
- **SVG Code Viewer**: Full source code display with copy button
- **Color Picker**: Interactive color selection or custom hex input
- **Parameter Sliders**:
  - Stroke width (1-5px)
  - Path simplification (0-100%)
  - Curve smoothing (0-100%)

---

## State Management

```typescript
// Source Configuration
selectedIcon: string;          // Active icon (Lucide name or 'Custom')
customSvg: string;            // Custom SVG code

// Generation Parameters
selectedModel: string;        // OpenRouter model ID
stylePreset: string;          // Style category ID
prompt: string;               // User instructions

// Customization
primaryColor: string;         // Hex color
outlineWidth: number;         // 1-5
simplification: number;       // 0-100
smoothing: number;            // 0-100

// Dynamic Data
availableModels: Array<{id, name}>  // From OpenRouter API
consoleLogs: Array<{id, text, type, timestamp}>  // Generation logs
generatedResult: {icon, style, timestamp, code}  // Output SVG

// UI State
isGenerating: boolean;        // Loading state
modelsLoading: boolean;       // Model fetch state
modelsError: string | null;   // Error message
showColorPicker: boolean;     // Color picker visibility
```

---

## Generation Pipeline Details

### Step-by-Step Execution

1. **User Clicks Generate**
   - Validation: Model selected, icon provided
   - Clear console logs
   - Log initialization message

2. **API Request Sent**
   - Payload sent to `/api/openrouter/generate`
   - Loading state activated
   - UI shows spinning animation

3. **Server Processing**
   - Environment validation (API key check)
   - Prompt construction
   - OpenRouter HTTP request with:
     - Authorization header
     - Selected model ID
     - Formatted system + user prompts
     - Temperature: 0.7 (balanced creativity)
     - Max tokens: 2000

4. **Response Parsing**
   - Try JSON parsing
   - Try markdown code block extraction
   - Try raw SVG extraction
   - Fallback error handling

5. **Front-end Update**
   - Store SVG in `generatedResult`
   - Render in output canvas
   - Log completion with metrics
   - Enable interaction buttons

---

## Data Flow Diagram

```
User Interface
    │
    ├─ Configuration Input
    │   ├─ Icon Selection
    │   ├─ Model Selection (fetched from OpenRouter)
    │   ├─ Style Preset Selection
    │   ├─ Parameter Adjustment
    │   └─ Custom Prompt Input
    │
    └─ Generate Trigger
        │
        ↓
    Validation Layer
    (Icon, Model, Custom SVG)
        │
        ↓
    OpenRouter API
    (/api/openrouter/generate)
        │
        ├─ Construct Prompts
        ├─ Call OpenRouter HTTP API
        ├─ Parse Response
        └─ Error Handling
        │
        ↓
    Response Object
    {svg, explanation}
        │
        ↓
    Front-end Rendering
    ├─ Update generatedResult State
    ├─ Re-render Canvas
    ├─ Display SVG Preview
    ├─ Show Source Code
    └─ Log Completion
        │
        ↓
    User Can:
    - Copy SVG Code
    - Download File
    - Share Link
    - Refine Parameters
    - Generate Again
```

---

## Key Features Implemented

✅ **Model Selection**
- Real-time fetching from OpenRouter API
- 100+ models available
- Searchable dropdown interface

✅ **Style Presets**
- 30+ visual styles across 6 categories
- Search and filter functionality
- Visual preview indicators

✅ **Advanced Parameters**
- Color customization with picker
- Stroke width adjustment
- Path simplification and smoothing

✅ **Real-time Logging**
- Generation status updates
- Error messages
- Completion metrics

✅ **Visual Feedback**
- Loading animations
- Process flow visualization
- Live canvas preview

✅ **Responsive Design**
- Light/dark theme support
- Three-column layout
- Custom scrollbar styling

---

## Future Enhancements

🚀 **Planned Features**
1. SVG Download functionality
2. Share generation via URL
3. History/saved generations
4. Batch processing
5. Custom style templates
6. Export to multiple formats (PNG, PDF)
7. Model comparison view
8. Cost estimation display
9. Generation time benchmarking
10. User accounts & generation history

---

## Environment Setup

### Required Environment Variables
```bash
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=prompt2svg
```

### Installation & Running
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Access the application at `http://localhost:3000`

---

## API Endpoints

### GET `/api/openrouter/models`
Fetches available models from OpenRouter

**Response:**
```json
{
  "models": [
    {"id": "model-id", "name": "Model Display Name"}
  ]
}
```

### POST `/api/openrouter/generate`
Generates SVG based on parameters

**Request:**
```json
{
  "sourceIcon": "Ghost",
  "stylePreset": "Neon",
  "prompt": "Make it more futuristic",
  "primaryColor": "#374d68",
  "outlineWidth": 2,
  "simplification": 52,
  "smoothing": 61,
  "selectedModel": "gpt-4"
}
```

**Response:**
```json
{
  "svg": "<svg>...</svg>",
  "explanation": "Generated a neon-styled Ghost icon..."
}
```

---

## Performance Considerations

- **Models List**: Cached on client (fetched once on mount)
- **SVG Rendering**: Direct DOM rendering of validated SVG strings
- **State Updates**: Minimal re-renders with React 19 optimization
- **Image Loading**: Custom SVG rendering avoids image asset overhead
- **API Calls**: Single request per generation, no polling

---

This architecture provides a robust, scalable foundation for SVG generation with AI assistance, combining real-time user feedback with powerful AI capabilities through OpenRouter.
