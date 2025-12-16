# Prompt2SVG - Quick Reference

## 🚀 Start in 30 Seconds

```bash
cd prompt2svgapp
pnpm install
# Create .env.local with OPENROUTER_API_KEY
pnpm dev
# Visit http://localhost:3000
```

---

## 🎨 User Workflow

```
Select Icon → Pick Model → Choose Style → Customize → Generate → Inspect
```

### Each Step Explained

| Step | Options | Action |
|------|---------|--------|
| **Icon** | 8 Built-in + Custom SVG | Click icon or paste custom SVG |
| **Model** | 100+ from OpenRouter | Search and select model |
| **Style** | 30+ in 6 categories | Browse or search presets |
| **Customize** | Color, Width, Params | Adjust sliders and color |
| **Prompt** | Free text | Add custom instructions |
| **Generate** | Click button or Enter | AI creates your SVG |
| **Inspect** | View code + Copy | Check result or refine |

---

## 📊 Layout at a Glance

```
┌──────────────────────────────────────────────────┐
│ HEADER: Theme Toggle | Beta Badge                │
├──────────┬──────────────────┬────────────────────┤
│ CONFIG   │ CANVAS           │ INSPECTOR          │
│ • Icons  │ • Input → AI →   │ • SVG Code         │
│ • Models │   Output         │ • Color Picker     │
│ • Styles │ • Log Feed       │ • Sliders          │
│ • Search │ • Input Bar      │                    │
└──────────┴──────────────────┴────────────────────┘
```

---

## 🔧 API Integration

### Generate SVG
```
POST /api/openrouter/generate
{
  sourceIcon: string
  stylePreset: string
  prompt: string
  primaryColor: string
  outlineWidth: 1-5
  simplification: 0-100
  smoothing: 0-100
  selectedModel: string
}
```

### Get Models
```
GET /api/openrouter/models
Returns: {models: [{id, name}, ...]}
```

---

## 🎯 Style Presets (30+)

### Minimal (5)
- None • Solid • Line • Sticker • Glass

### Tech (7)
- Neon • Glitch • Pixel • Blueprint • Wireframe • Circuit • Terminal

### Artistic (7)
- Sketch • Watercolor • Graffiti • Chalk • Ink • Oil • PopArt

### Geometric (5)
- Origami • LowPoly • Cubist • Mosaic • Hex

### Textured (4)
- Grunge • Noise • Wood • Metal

---

## 💾 State Management

```typescript
// Source
selectedIcon: string
customSvg: string

// Config
selectedModel: string
stylePreset: string
prompt: string

// Customize
primaryColor: string
outlineWidth: number
simplification: number
smoothing: number

// Data
availableModels: Array
generatedResult: {icon, style, code}
isGenerating: boolean
```

---

## 📝 Key Files

| File | Purpose |
|------|---------|
| `svg-generator.tsx` | Main UI component (900+ lines) |
| `/api/openrouter/models` | Fetch available models |
| `/api/openrouter/generate` | AI SVG generation |
| `globals.css` | Themes & colors |
| `APPLICATION_ARCHITECTURE.md` | Technical docs |
| `GETTING_STARTED.md` | Setup guide |

---

## 🔌 Environment Variables

```env
OPENROUTER_API_KEY=your_api_key
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=prompt2svg
```

Get API key: https://openrouter.ai

---

## 🚀 Core Features

✅ **SVG Generation**
- Real AI-powered transformation
- 100+ models available
- 30+ style presets

✅ **Customization**
- Color picker
- Stroke width control
- Path simplification
- Curve smoothing
- Custom prompts

✅ **UX Features**
- Real-time preview
- Live model list
- Search & filter
- Log feed
- Error handling

✅ **Design**
- Light/dark theme
- Responsive layout
- Smooth animations
- Professional UI

---

## 🎪 Example Generation

**Input:**
- Icon: Ghost
- Model: Claude Opus
- Style: Neon
- Color: #60A5FA
- Width: 2px
- Prompt: "Make it glow brighter"

**Process:**
```
AI receives: "Generate neon Ghost with cyan color, 2px stroke, glow brighter"
↓
Creates SVG with neon effect
↓
Returns to frontend
↓
Rendered in canvas
```

**Output:**
- SVG preview
- Source code
- Ready to download/share

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Models not showing | Check API key in .env.local, restart dev server |
| Generation fails | Verify model selected, check OpenRouter credits |
| SVG looks wrong | Try different model or adjust parameters |
| App won't start | Run `pnpm install`, clear `.next/`, restart |

---

## 📦 Dependencies

```json
{
  "ai": "5.0.113",
  "next": "16.0.10",
  "react": "19.2.3",
  "tailwindcss": "4",
  "zod": "4.1.13"
}
```

---

## 🎯 Commands

```bash
# Install
pnpm install

# Dev
pnpm dev

# Build
pnpm build

# Start
pnpm start

# Lint
pnpm lint
```

---

## 📚 Documentation

1. **IMPLEMENTATION_SUMMARY.md** - What's been done
2. **APPLICATION_ARCHITECTURE.md** - How it works
3. **GETTING_STARTED.md** - How to set up & use
4. **QUICK_REFERENCE.md** - This file

---

## 🌟 Pro Tips

1. **Model Selection**: Try different models for different styles
2. **Prompts**: Be specific in your instructions
3. **Parameters**: Simplification removes details, smoothing makes curves rounder
4. **Presets**: Search by category for faster browsing
5. **Colors**: Use the preset swatches or custom color picker

---

## 🔮 What's Next

Soon:
- Download SVG
- Save history
- Share links
- Batch processing
- Export formats

---

## 📞 Quick Links

- **OpenRouter API**: https://openrouter.ai
- **Next.js Docs**: https://nextjs.org/docs
- **AI SDK**: https://sdk.vercel.ai
- **Tailwind**: https://tailwindcss.com

---

**Ready to generate?** Start with `pnpm dev` and visit http://localhost:3000! 🎨✨
