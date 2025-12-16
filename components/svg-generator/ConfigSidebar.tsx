import React from 'react';
import { RefreshCw, Upload, Terminal } from 'lucide-react';
import { icons, iconNames, type SelectedIcon } from './iconHelpers';
import { useUIStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";

interface ConfigSidebarProps {
  // Icon state
  selectedIcon: SelectedIcon;
  setSelectedIcon: (icon: SelectedIcon) => void;
  customSvg: string;
  setCustomSvg: (svg: string) => void;
  renderSourceIcon: (size: number, className: string) => React.ReactNode;

  // Model state
  selectedModel: string | null;
  selectModel: (modelId: string) => void;
  availableModels: Array<{ id: string; name?: string }>;
  modelsLoading: boolean;
  modelsError: string | null;
  modelNameById: Record<string, string>;
}

export const ConfigSidebar: React.FC<ConfigSidebarProps> = ({
  selectedIcon,
  setSelectedIcon,
  customSvg,
  setCustomSvg,
  renderSourceIcon,
  selectedModel,
  selectModel,
  availableModels,
  modelsLoading,
  modelsError,
  modelNameById,
}) => {
  const { devMode, toggleDevMode } = useUIStore();

  const models = [
    { id: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash-8B', cost: '$0.0001/run' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', cost: '$0.0002/run' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', cost: '$0.0015/run' },
    { id: 'gemini-ultra', label: 'Gemini Ultra Preview', cost: '$0.0050/run' },
    { id: 'gemini-nano', label: 'Gemini Nano (Local)', cost: '$0.00/run' },
  ];

  return (
    <div className="w-80 flex-shrink-0 flex flex-col border-r border-border bg-card">
      <div className="h-12 flex items-center px-4 border-b border-border flex-shrink-0">
        <span className="text-xs font-medium text-muted-foreground">Configuration</span>
        <div className="ml-auto p-1.5 hover:bg-muted rounded-md cursor-pointer text-muted-foreground">
          <RefreshCw size={14} />
        </div>
      </div>

      {/* Flexible Scrollable Area for Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Static Top Section (Input & Model) */}
        <div className="p-4 space-y-6 flex-shrink-0">
          {/* Input Selection Card */}
          <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/5 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>

            <div className="flex items-start gap-4 mb-4 relative z-10">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/20 shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)] overflow-hidden">
                {renderSourceIcon(20, "text-yellow-400")}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-foreground mb-1">Source Icon</div>
                <div className="text-[10px] text-muted-foreground">Select or paste custom SVG</div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 mt-4 relative z-10">
              {iconNames.map((iconName) => {
                const isSelected = selectedIcon === iconName;
                return (
                  <button
                    key={iconName}
                    onClick={() => setSelectedIcon(iconName)}
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400 shadow-[0_0_10px_-2px_rgba(234,179,8,0.3)]'
                        : 'border-white/10 bg-white/5 text-slate-500 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {React.createElement(icons[iconName], { size: 16, strokeWidth: 1 })}
                  </button>
                );
              })}
              <button
                onClick={() => setSelectedIcon('Custom')}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                  selectedIcon === 'Custom'
                    ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400 shadow-[0_0_10px_-2px_rgba(234,179,8,0.3)]'
                    : 'border-white/10 bg-white/5 text-slate-500 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <Upload size={16} />
              </button>
            </div>

            {/* Paste Area for Custom SVG */}
            {selectedIcon === 'Custom' && (
              <div className="mt-4 animate-fade-in-up">
                <textarea
                  value={customSvg}
                  onChange={(e) => setCustomSvg(e.target.value)}
                  placeholder="Paste your SVG code here..."
                  className="w-full h-20 bg-background border border-input rounded-lg p-2 text-[10px] font-mono text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none resize-none"
                />
              </div>
            )}
          </div>

          {/* Model Selector */}
          <div className="border border-border rounded-lg bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Model</span>
              <span className="text-[10px] text-muted-foreground">{models.find(m => m.id === selectedModel)?.cost}</span>
            </div>
            <div className="relative">
              <Combobox
                items={availableModels.map((m) => m.id)}
                value={selectedModel || ''}
                onValueChange={(value) => {
                  if (value) selectModel(value);
                }}
              >
                <ComboboxInput
                  placeholder={
                    modelsLoading
                      ? "Loading models…"
                      : modelsError
                        ? "Model list unavailable"
                        : "Search OpenRouter models…"
                  }
                  disabled={modelsLoading || !!modelsError}
                  showClear
                  className="w-full"
                />
                <ComboboxContent>
                  <ComboboxEmpty>
                    {modelsLoading
                      ? "Loading…"
                      : modelsError
                        ? "Failed to load models."
                        : "No models found."}
                  </ComboboxEmpty>
                  <ComboboxList>
                    {(id) => (
                      <ComboboxItem key={id} value={id}>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm">
                            {modelNameById[id] ?? id}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {id}
                          </span>
                        </div>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>

              {modelsError && (
                <div className="mt-2 text-[10px] text-red-500">{modelsError}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-muted/10">
        <Button 
          variant={devMode ? "default" : "outline"} 
          size="sm" 
          className="w-full justify-start gap-2"
          onClick={toggleDevMode}
        >
          <Terminal size={14} />
          {devMode ? "Developer Mode: ON" : "Developer Mode: OFF"}
        </Button>
      </div>
    </div>
  );
};
