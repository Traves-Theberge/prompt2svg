import React from 'react';
import { X, Clock, Code, Terminal } from 'lucide-react';
import { useGenerationStore, useUIStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

export const DebugPanel: React.FC = () => {
  const { debugData } = useGenerationStore();
  const { toggleDevMode } = useUIStore();
  const [selectedStepIndex, setSelectedStepIndex] = React.useState<number>(0);

  // Auto-select latest step when steps change
  React.useEffect(() => {
    if (debugData?.steps) {
      setSelectedStepIndex(debugData.steps.length - 1);
    }
  }, [debugData?.steps?.length]);

  if (!debugData) return null;

  const currentStep = debugData.steps?.[selectedStepIndex];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[800px] h-[600px] flex flex-col shadow-2xl rounded-xl border border-border bg-card overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-muted/50 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-yellow-500" />
          <span className="text-sm font-medium font-mono">Developer Debug Console</span>
        </div>
        <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleDevMode}>
                <X size={14} />
             </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
          {/* Steps Sidebar */}
          <div className="w-64 border-r border-border bg-muted/10 overflow-y-auto p-4 shrink-0">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Timeline</h3>
            <div className="space-y-2">
              {debugData.steps?.map((step, index) => (
                <button 
                  key={index} 
                  onClick={() => setSelectedStepIndex(index)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    selectedStepIndex === index 
                      ? 'bg-background border-primary/50 shadow-sm ring-1 ring-primary/20' 
                      : 'bg-card border-border hover:bg-accent/50 hover:border-accent-foreground/20'
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    step.status === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' :
                    step.status === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                    'bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.4)]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${selectedStepIndex === index ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {new Date(step.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                    </div>
                  </div>
                  {selectedStepIndex === index && <div className="w-1 h-4 bg-primary rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-background/50">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Always show the compiled prompt */}
              {debugData.systemPrompt && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-400">
                    <Code size={14} />
                    COMPILED PROMPT
                  </div>
                  <div className="bg-slate-950 rounded-lg border border-border p-4 overflow-x-auto shadow-inner max-h-[200px] overflow-y-auto">
                    <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap">
                      {debugData.systemPrompt}
                    </pre>
                  </div>
                </div>
              )}

              {currentStep && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Step Header */}
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      currentStep.status === 'success' ? 'bg-green-500' :
                      currentStep.status === 'error' ? 'bg-red-500' :
                      'bg-yellow-500 animate-pulse'
                    }`} />
                    <h3 className="text-sm font-medium">{currentStep.name}</h3>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(currentStep.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                    </span>
                  </div>

                  {/* Step Output */}
                  {currentStep.status === 'pending' ? (
                    <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-yellow-500 text-xs flex items-center gap-3">
                      <Clock className="animate-spin" size={16} />
                      <span>{currentStep.output || 'Processing...'}</span>
                    </div>
                  ) : currentStep.output ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-green-400">
                        <Code size={14} />
                        STEP OUTPUT
                      </div>
                      <div className="bg-slate-950 rounded-lg border border-border p-4 overflow-x-auto shadow-inner max-h-[250px] overflow-y-auto">
                        <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap">
                          {currentStep.output}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-xs border border-dashed border-border rounded-lg">
                      No output data available for this step.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
};
