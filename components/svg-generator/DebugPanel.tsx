import React from 'react';
import { X, Check, AlertCircle, Clock, Code, Terminal } from 'lucide-react';
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
  const stepName = currentStep?.name;

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

      {!debugData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
          <Terminal size={48} className="mb-4 opacity-20" />
          <p className="text-sm">Waiting for generation...</p>
          <p className="text-xs mt-2 opacity-60">Click "Generate" to capture process data.</p>
        </div>
      ) : (
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
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Content for "Constructing Prompts" */}
              {(stepName === 'Constructing Prompts' || selectedStepIndex === 0) && (
                <>
                  {debugData.systemPrompt && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2 text-xs font-medium text-blue-400">
                        <Code size={14} />
                        SYSTEM PROMPT
                      </div>
                      <div className="bg-slate-950 rounded-lg border border-border p-4 overflow-x-auto shadow-inner">
                        <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap">
                          {debugData.systemPrompt}
                        </pre>
                      </div>
                    </div>
                  )}

                  {debugData.userPrompt && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
                      <div className="flex items-center gap-2 text-xs font-medium text-green-400">
                        <Code size={14} />
                        USER PROMPT
                      </div>
                      <div className="bg-slate-950 rounded-lg border border-border p-4 overflow-x-auto shadow-inner">
                        <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap">
                          {debugData.userPrompt}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Content for "Sending API Request" */}
              {(stepName === 'Sending API Request' || selectedStepIndex === 1) && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-yellow-500 text-xs flex items-center gap-3">
                      <Clock className="animate-spin" size={16} />
                      <span>Waiting for API response...</span>
                   </div>
                   
                   {debugData.userPrompt && (
                    <div className="space-y-2 opacity-75">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Code size={14} />
                        PAYLOAD PREVIEW
                      </div>
                      <div className="bg-slate-950 rounded-lg border border-border p-4 overflow-x-auto">
                        <pre className="text-[10px] font-mono text-slate-500 whitespace-pre-wrap">
                          {debugData.userPrompt}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Content for "Rendering SVG" */}
              {(stepName === 'Rendering SVG' || selectedStepIndex >= 2) && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 text-xs font-medium text-purple-400">
                    <Code size={14} />
                    RAW RESPONSE
                  </div>
                  {debugData.rawResponse ? (
                    <div className="bg-slate-950 rounded-lg border border-border p-4 overflow-x-auto shadow-inner">
                      <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap">
                        {debugData.rawResponse}
                      </pre>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-xs border border-dashed border-border rounded-lg">
                      No response data available yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
