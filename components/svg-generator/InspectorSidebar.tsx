import React from 'react';
import { Copy, Palette, RefreshCw } from 'lucide-react';

interface InspectorSidebarProps {
  // SVG Result
  currentResult: string | null;
  
  // Color picker state
  showColorPicker: boolean;
  setShowColorPicker: (show: boolean) => void;
  
  // Parameters
  primaryColor: string;
  outlineWidth: number;
  setParameters: (params: Partial<{
    primaryColor: string;
    outlineWidth: number;
  }>) => void;
}

export const InspectorSidebar: React.FC<InspectorSidebarProps> = ({
  currentResult,
  showColorPicker,
  setShowColorPicker,
  primaryColor,
  outlineWidth,
  setParameters,
}) => {
  const colorPresets = ['#374d68', '#60A5FA', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="w-80 flex-shrink-0 flex flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="h-12 flex items-center px-4 border-b border-border">
        <span className="text-xs font-medium text-foreground">Inspector</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* SVG Code Viewer */}
        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-64">
          <div className="p-3 border-b border-border flex justify-between items-center bg-muted">
            <span className="text-xs font-medium text-foreground">Generated Source</span>
            <div className="flex items-center gap-2">
              <button className="text-muted-foreground hover:text-foreground transition-colors" title="Copy Code">
                <Copy size={12} />
              </button>
            </div>
          </div>
          <div className="flex-1 relative bg-background p-3 overflow-auto">
            <pre className="text-[10px] font-mono leading-relaxed text-muted-foreground whitespace-pre-wrap break-all">
              {currentResult ? currentResult : (
                <span className="text-muted-foreground italic">No generation yet. Click &quot;Generate&quot; to create your first SVG.</span>
              )}
            </pre>
          </div>
        </div>

        {/* Customization Sliders */}
        <div className="border border-border bg-card rounded-lg overflow-hidden">
          {showColorPicker ? (
            <div className="p-4 bg-card animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Palette size={12} className="text-muted-foreground" />
                  Custom Color
                </div>
                <button
                  onClick={() => setShowColorPicker(false)}
                  className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="w-full h-40 rounded-xl overflow-hidden border border-border shadow-sm relative group">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setParameters({ primaryColor: e.target.value })}
                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 m-0 border-0 cursor-pointer"
                  />
                  <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 dark:ring-white/10 rounded-xl"></div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-border shadow-sm" style={{ backgroundColor: primaryColor }}></div>
                    <input
                      value={primaryColor}
                      onChange={(e) => setParameters({ primaryColor: e.target.value })}
                      className="w-full h-9 rounded-md border border-input bg-background pl-8 pr-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none uppercase"
                      placeholder="#000000"
                    />
                  </div>
                  <button
                    onClick={() => setParameters({ primaryColor: '#374d68' })}
                    className="h-9 px-3 rounded-md border border-border bg-muted/50 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Reset to default"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Primary Color */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Palette size={12} className="text-muted-foreground" />
                    Primary Color
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">{primaryColor}</span>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      onClick={() => setParameters({ primaryColor: color })}
                      className={`w-6 h-6 rounded-full transition-all ${primaryColor.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <button
                    onClick={() => setShowColorPicker(true)}
                    className="ml-auto h-6 px-2.5 rounded-md border border-border bg-background text-[10px] font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Meaningful SVG Options */}
              <div className="p-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-medium text-muted-foreground">Outline Width</span>
                    <span className="text-[10px] font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">{outlineWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={outlineWidth}
                    onChange={(e) => setParameters({ outlineWidth: Number(e.target.value) })}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
