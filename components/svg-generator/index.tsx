"use client";

import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Upload, Moon, Sun } from 'lucide-react';
import Handlebars from 'handlebars';

// Store imports
import { useGenerationStore, useModelsStore, useUIStore } from '@/lib/store';
import { validateSVGParameters } from '@/lib/validations';

// Component imports
import { ConfigSidebar } from './ConfigSidebar';
import { CanvasArea } from './CanvasArea';
import { InspectorSidebar } from './InspectorSidebar';
import { DebugPanel } from './DebugPanel';

// Helper imports
import { icons, getIconSVGCode, type BuiltInIconName, type SelectedIcon } from './iconHelpers';

const SvgGenerator = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  
  // Zustand store hooks
  const {
    status,
    parameters,
    consoleLogs,
    currentResult,
    selectedIcon,
    setParameters,
    addLog,
    clearLogs,
    setStatus,
    setCurrentResult,
    setSelectedIcon,
    setDebugData,
  } = useGenerationStore();
  
  const { devMode } = useUIStore();
  
  const {
    models: availableModels,
    selectedModel,
    isLoading: modelsLoading,
    error: modelsError,
    selectModel,
    fetchModels,
  } = useModelsStore();
  
  // Local UI state (not persisted)
  const [customSvg, setCustomSvg] = React.useState('');
  const [prompt, setPrompt] = React.useState('');
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Derived state
  const isGenerating = status === 'loading';
  const { primaryColor, outlineWidth } = parameters;

  // Helper to add logs with proper formatting
  const addConsoleLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    addLog({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      message,
      type,
    });
  };

  // Fix hydration: mark as mounted
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Fetch models on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  const modelNameById = React.useMemo(() => {
    return Object.fromEntries(
      availableModels.map((m) => [m.id, m.name ?? m.id] as const)
    ) as Record<string, string>;
  }, [availableModels]);

  const handleGenerate = async () => {
    if (!selectedModel) {
       addConsoleLog("Please select a model first.", "error");
       return;
    }

    if (selectedIcon === 'Custom' && !customSvg.trim()) {
        addConsoleLog("Please paste SVG code for the custom icon.", "error");
        return;
    }
    
    // Validate parameters before generation
    const validation = validateSVGParameters(parameters);
    if (!validation.success) {
      addConsoleLog(`Invalid parameters: ${validation.error.message}`, "error");
      return;
    }

    setStatus('loading');
    clearLogs();
    addConsoleLog(`Initializing ${selectedModel}...`);
    addConsoleLog(`Ingesting vector source: <${selectedIcon} />`);
    addConsoleLog(`Applying style with prompt "${prompt || 'none'}"...`);

    try {
      // Get the SVG code for the selected icon
      const iconSVGCode = selectedIcon === "Custom"
        ? customSvg
        : (selectedIcon ? getIconSVGCode(selectedIcon as SelectedIcon, customSvg) : '');

      // Prompt template using Handlebars-style placeholders
      const promptTemplate = `You are an expert SVG designer with a deep understanding of the SVG specification.
Your goal is to produce clean, semantic, and highly portable SVG code.

### Core Principles:
1. **Declarative Graphics**: You describe shapes using XML tags. The browser handles rendering.
2. **Infinite Canvas**: The SVG is an infinite plane. The \`viewBox\` defines the visible window.
3. **Portability**: Use SVG attributes (e.g., \`fill="red"\`) rather than CSS styles for maximum compatibility.

### Technical Standards:
- **ViewBox**: ALWAYS include a \`viewBox\` attribute (e.g., \`viewBox="0 0 24 24"\`) to ensure the icon scales consistently.
- **Elements**: Use the appropriate primitives:
  - \`<rect>\` for rectangles (use \`rx\`/\`ry\` for rounded corners).
  - \`<circle>\` and \`<ellipse>\` for round shapes.
  - \`<path>\` for complex shapes (the "do anything" element).
- **Styling**:
  - **Color**: Use \`currentColor\` for strokes and fills to allow client-side styling.
  - **Stroke Width**: Use a default \`stroke-width="2"\` but ensure it's adjustable via attributes.
  - **Style**:
    - For outline/line icons: Use \`fill="none"\` and \`stroke="currentColor"\`.
    - For solid/filled icons: Use \`fill="currentColor"\` and \`stroke="none"\`.
  - Use \`stroke-linecap="round"\` and \`stroke-linejoin="round"\`.
- **Accessibility**: Include a self-closing \`<title>\` tag inside the SVG.

### Task:
Modify the provided source icon based on the user's instructions.

Current Source Icon:
{{sourceSvg}}

User Instructions: "{{userPrompt}}"

Requirements:
1. Maintain the core shape/concept of the source icon
2. Apply the user's instructions to enhance/modify it
3. Use 'currentColor' for colors to enable dynamic styling
4. Return ONLY valid SVG code, no explanations
5. Make sure the SVG is wrapped in proper <svg> tags`;

      // Compile the template with Handlebars
      const userPromptValue = prompt || 'Enhance and modify this icon';
      const compiledTemplate = Handlebars.compile(promptTemplate);
      const systemPrompt = compiledTemplate({
        sourceSvg: iconSVGCode,
        userPrompt: userPromptValue,
      });

      // Initialize debug data
      setDebugData({
        systemPrompt,
        userPrompt: userPromptValue,
        steps: [
          { name: 'Constructing Prompts', status: 'success', timestamp: Date.now(), output: `Template compiled successfully.\n\nVariables injected:\n- sourceSvg: ${iconSVGCode.length} characters\n- userPrompt: "${userPromptValue}"` },
          { name: 'Sending API Request', status: 'pending', timestamp: Date.now(), output: 'Waiting for API response...' }
        ]
      });

      const response = await fetch('/api/openrouter/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          iconSVGCode,      // Pass actual SVG code
          sourceIconName: selectedIcon,
          userPrompt: prompt,  // User's instructions
          systemPrompt,        // Comprehensive instructions for Claude
          selectedModel,
          parameters: {
            primaryColor,
            outlineWidth,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorOutput = JSON.stringify(error, null, 2);
        setDebugData({
          systemPrompt,
          userPrompt: userPromptValue,
          rawResponse: errorOutput,
          steps: [
            { name: 'Constructing Prompts', status: 'success', timestamp: Date.now(), output: `Template compiled successfully.\n\nVariables injected:\n- sourceSvg: ${iconSVGCode.length} characters\n- userPrompt: "${userPromptValue}"` },
            { name: 'Sending API Request', status: 'error', timestamp: Date.now(), output: errorOutput }
          ]
        });
        throw new Error(error.error || 'Generation failed');
      }

      const data = await response.json();
      const rawResponse = JSON.stringify(data, null, 2);

      setDebugData({
        systemPrompt,
        userPrompt: userPromptValue,
        rawResponse,
        steps: [
          { name: 'Constructing Prompts', status: 'success', timestamp: Date.now(), output: `Template compiled successfully.\n\nVariables injected:\n- sourceSvg: ${iconSVGCode.length} characters\n- userPrompt: "${userPromptValue}"` },
          { name: 'Sending API Request', status: 'success', timestamp: Date.now(), output: rawResponse },
          { name: 'Rendering SVG', status: 'success', timestamp: Date.now(), output: data.svg || 'No SVG generated' }
        ]
      });

      addConsoleLog(`Rendering SVG paths (Stroke: ${outlineWidth}px, Color: ${primaryColor})...`);

      setCurrentResult(data.svg);
      setStatus('success');
      addConsoleLog(`Generation complete. ${data.explanation || 'SVG generated successfully'}`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      addConsoleLog(`Error: ${message}`, 'error');
      setStatus('error');
    }
  };

  // Render functions for icon previews
  const renderSourceIcon = (size: number, className = "") => {
    if (selectedIcon === 'Custom') {
        if (!customSvg.trim()) return <Upload size={size} className={className} />;
        return (
            <div
              className={`${className} [&>svg]:w-full [&>svg]:h-full`}
              style={{ width: size, height: size }}
              dangerouslySetInnerHTML={{ __html: customSvg }}
            />
        );
    }
    if (!selectedIcon) return null;
    const Icon = icons[selectedIcon as BuiltInIconName];
    return <Icon size={size} className={className} strokeWidth={1} />;
  };

  const renderIconPreview = () => {
    const baseClass = "w-full h-full transition-all duration-500";
    
    // If we have generated SVG code, render it directly with dynamic styles
    if (currentResult && currentResult.includes('<svg')) {
      // Inject dynamic styles into the SVG string
      // We replace stroke="currentColor" or stroke="none" with actual color
      // And stroke-width with actual width
      
      // This is a simple client-side injection for preview
      // It assumes the SVG uses currentColor or standard attributes
      
      // Create a container that applies color via CSS color property (for currentColor)
      // and we can also try to inject stroke-width if possible, but CSS stroke-width works too
      
      return (
        <div
          className={`${baseClass} [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full`}
          style={{ 
            color: primaryColor,
            // We use CSS variables or direct styles to influence the SVG
            // strokeWidth might need direct attribute manipulation if CSS doesn't catch it
          }}
        >
          <div 
            dangerouslySetInnerHTML={{ __html: currentResult }} 
            style={{
               // Force stroke width via CSS if possible, though specific attributes might override
               // We can also use a ref to manipulate the DOM after render if needed
            }}
            className="w-full h-full [&_path]:transition-all [&_circle]:transition-all [&_rect]:transition-all"
            ref={(node) => {
                if (node) {
                    const svg = node.querySelector('svg');
                    if (svg) {
                        // Apply stroke width dynamically to all stroked elements
                        svg.querySelectorAll('[stroke]').forEach(el => {
                            if (el.getAttribute('stroke') !== 'none') {
                                el.setAttribute('stroke-width', String(outlineWidth));
                                el.setAttribute('stroke', primaryColor);
                            }
                        });
                        // Apply fill dynamically to filled elements (if they use currentColor)
                        svg.querySelectorAll('[fill="currentColor"]').forEach(el => {
                             el.setAttribute('fill', primaryColor);
                        });
                        
                        // Also handle root level
                        if (svg.getAttribute('stroke') !== 'none') {
                             svg.setAttribute('stroke', primaryColor);
                             svg.setAttribute('stroke-width', String(outlineWidth));
                        }
                    }
                }
            }}
          />
        </div>
      );
    }
    
    // Fallback rendering for icons without generated code
    const customContent = selectedIcon === "Custom" ? (customSvg.trim() ? customSvg : null) : null;
    const IconComp = customContent
      ? null
      : selectedIcon === "Custom"
        ? Upload
        : selectedIcon ? icons[selectedIcon as BuiltInIconName] : null;

    type InnerContentProps = {
      className?: string;
      style?: React.CSSProperties;
      strokeColor?: string;
    };

    const InnerContent = ({
      className = "",
      style = {},
      strokeColor = primaryColor,
    }: InnerContentProps) => {
      const commonProps = {
         style: { ...style, color: strokeColor },
         className: `${baseClass} ${className}`
      };

      if (customContent) {
        return (
          <div
             {...commonProps}
             className={`${commonProps.className} [&>svg]:w-full [&>svg]:h-full`}
             style={{ ...commonProps.style, stroke: strokeColor }}
             dangerouslySetInnerHTML={{ __html: customContent }}
          />
        );
      }
      if (!IconComp) return null;
      return React.createElement(IconComp, { ...commonProps, strokeWidth: outlineWidth });
    };

    return <InnerContent />;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground font-sans overflow-hidden selection:bg-primary/15">
      {/* GLOBAL HEADER */}
      <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border uppercase tracking-wider">Beta</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 hover:bg-muted rounded-md cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            title="Toggle theme"
          >
            {mounted ? (
              theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />
            ) : (
              <div className="w-[14px] h-[14px]" />
            )}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        <ConfigSidebar
          selectedIcon={(selectedIcon || 'Ghost') as SelectedIcon}
          setSelectedIcon={setSelectedIcon}
          customSvg={customSvg}
          setCustomSvg={setCustomSvg}
          renderSourceIcon={renderSourceIcon}
          selectedModel={selectedModel}
          selectModel={selectModel}
          availableModels={availableModels}
          modelsLoading={modelsLoading}
          modelsError={modelsError}
          modelNameById={modelNameById}
        />

        <CanvasArea
          isGenerating={isGenerating}
          currentResult={currentResult}
          renderSourceIcon={renderSourceIcon}
          renderIconPreview={renderIconPreview}
          consoleLogs={consoleLogs}
          logsEndRef={logsEndRef as React.RefObject<HTMLDivElement>}
          prompt={prompt}
          setPrompt={setPrompt}
          handleGenerate={handleGenerate}
        />

        <InspectorSidebar
          currentResult={currentResult}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
          primaryColor={primaryColor}
          outlineWidth={outlineWidth}
          setParameters={setParameters}
        />
      </div>

      {devMode && <DebugPanel />}

      {/* GLOBAL STYLES FOR ANIMATIONS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SvgGenerator;
