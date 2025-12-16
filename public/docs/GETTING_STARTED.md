# Getting Started with Prompt2SVG

## Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- OpenRouter API key (get one at https://openrouter.ai)

## Installation

### 1. Clone the repository
```bash
cd prompt2svg/prompt2svgapp
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Set up environment variables
Create a `.env.local` file in the `prompt2svgapp` directory:

```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=prompt2svg
```

You can get your OpenRouter API key by:
1. Going to https://openrouter.ai
2. Creating an account
3. Navigating to API keys section
4. Creating a new API key

### 4. Start the development server
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

---

## Quick Start Guide

### Basic Workflow

1. **Select Source**
   - Choose from 8 predefined icons, OR
   - Select "Custom" and paste SVG code

2. **Pick a Model**
   - Open the Model dropdown
   - Search for your preferred model (Claude, GPT, Gemini, etc)
   - Models are fetched live from OpenRouter

3. **Choose a Style**
   - Browse 30+ style presets
   - Use search bar to find specific styles
   - Filter by category (Minimal, Tech, Artistic, Geometric, Textured)

4. **Customize**
   - **Color**: Pick a color or use the color picker
   - **Outline Width**: Adjust stroke thickness (1-5px)
   - **Simplification**: Reduce path complexity (0-100%)
   - **Smoothing**: Smooth curves (0-100%)
   - **Prompt**: Add custom instructions for the AI

5. **Generate**
   - Click the "Generate" button
   - Watch the process in the log feed
   - See your result in the canvas preview

6. **Inspect & Export**
   - View full SVG code in the right panel
   - Copy to clipboard
   - Download or share (coming soon)

---

## Understanding the UI

### Left Sidebar
- **Configuration**: All input settings
- **Model Selector**: Choose your AI model
- **Style Presets**: Browse visual styles

### Center Canvas
- **Input/Output Flow**: Visual representation of transformation
- **Live Preview**: Real-time generation preview
- **Log Feed**: Status messages and metrics
- **Prompt Input**: Your natural language instructions

### Right Inspector
- **SVG Viewer**: Full source code
- **Color Picker**: Change primary color
- **Parameters**: Fine-tune rendering options

---

## API Models Available

Popular models on OpenRouter (examples):

**Large Models** (best quality)
- Claude 3 Opus
- GPT-4 Turbo
- Gemini Pro

**Fast Models** (quick responses)
- Claude 3 Haiku
- GPT-3.5 Turbo
- Llama 2 70B

**Specialized Models**
- Code Llama
- Mistral
- And 100+ more

All models are available through the dropdown. The model list is automatically fetched from OpenRouter.

---

## Example Prompts

### Get Creative
- "Make it look like a retro 80s arcade game"
- "Add a cyberpunk neon glow effect"
- "Transform it into abstract geometric shapes"
- "Make it look hand-drawn and sketchy"
- "Add a watercolor painting effect"
- "Create a circuit board pattern inside"

### Get Specific
- "Double the stroke width and add sharp angles"
- "Simplify it to the absolute minimum lines"
- "Make the paths smoother and more rounded"
- "Add a shadow or depth effect"
- "Create a pixelated 8-bit version"

---

## Troubleshooting

### Models dropdown shows nothing
- Check your `OPENROUTER_API_KEY` is valid in `.env.local`
- Restart the dev server after adding the env var
- Check browser console for API errors

### Generation fails
- Check that a model is selected
- Ensure your OpenRouter API key has sufficient credits
- Check the error message in the log feed
- Try a smaller model if API quota issues occur

### SVG doesn't look right
- Ensure valid SVG is pasted (for custom icons)
- Try adjusting the simplification and smoothing parameters
- Different models may produce different results
- Add more specific instructions in the prompt

### Application won't start
- Ensure all dependencies are installed: `pnpm install`
- Clear `.next` folder: `rm -rf .next`
- Restart the dev server: `pnpm dev`

---

## Building for Production

```bash
# Build
pnpm build

# Start production server
pnpm start
```

---

## Development Commands

```bash
# Start dev server
pnpm dev

# Run linter
pnpm lint

# Build
pnpm build

# Start production server
pnpm start
```

---

## Project Structure

```
prompt2svgapp/
├── app/
│   ├── page.tsx                 # Main page
│   ├── layout.tsx              # Root layout
│   ├── globals.css             # Global styles
│   └── api/
│       └── openrouter/
│           ├── models/route.ts # Fetch models
│           └── generate/route.ts # Generate SVGs
├── components/
│   ├── svg-generator.tsx       # Main component
│   └── ui/                     # UI components
├── lib/
│   └── utils.ts               # Utilities
├── public/                     # Static assets
└── package.json
```

---

## Key Technologies

- **Next.js 16**: React framework with API routes
- **React 19**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Styling
- **AI SDK v5**: AI integration utilities
- **Base UI**: Accessible components
- **Lucide React**: Icon library
- **Framer Motion**: Animations
- **Zod**: Schema validation

---

## Next Steps

1. ✅ Set up environment variables
2. ✅ Install dependencies
3. ✅ Start the dev server
4. 📝 Read [APPLICATION_ARCHITECTURE.md](./APPLICATION_ARCHITECTURE.md) for detailed workflow
5. 🎨 Start generating beautiful SVGs!

---

## Need Help?

- Check [APPLICATION_ARCHITECTURE.md](./APPLICATION_ARCHITECTURE.md) for detailed documentation
- Review the component code in `components/svg-generator.tsx`
- Check OpenRouter docs at https://openrouter.ai/docs

---

Happy SVG generating! 🎨✨
