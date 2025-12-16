import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Terminal, Wand2 } from 'lucide-react';

interface ConsoleLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface CanvasAreaProps {
  // Generation state
  isGenerating: boolean;
  currentResult: string | null;
  
  // Icon/preview rendering
  renderSourceIcon: (size: number, className: string) => React.ReactNode;
  renderIconPreview: () => React.ReactNode;
  
  // Console logs
  consoleLogs: ConsoleLog[];
  logsEndRef: React.RefObject<HTMLDivElement>;
  
  // Prompt input
  prompt: string;
  setPrompt: (prompt: string) => void;
  handleGenerate: () => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  isGenerating,
  currentResult,
  renderSourceIcon,
  renderIconPreview,
  consoleLogs,
  logsEndRef,
  prompt,
  setPrompt,
  handleGenerate,
}) => {
  return (
    <div className="flex-1 flex flex-col bg-background relative">
      {/* Main Visualizer Area */}
      <div className="flex-1 p-6 flex flex-col relative overflow-hidden">
        {/* Background Grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        ></div>

        {/* Canvas Content */}
        <div className="flex-1 z-10 flex flex-col items-center justify-center gap-12">
          {/* Generation Stage */}
          <div className="flex items-center gap-16">
            {/* Input Node */}
            <div className="flex flex-col items-center gap-4 group">
              <div className="w-24 h-24 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground group-hover:border-ring transition-all overflow-hidden p-4">
                {renderSourceIcon(32, "text-slate-400")}
              </div>
              <span className="text-lg font-mono text-muted-foreground">INPUT.svg</span>
            </div>

            {/* Process Flow Arrow */}
            <div className="flex flex-col items-center gap-2">
              <div className={`h-[1px] w-24 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 relative overflow-hidden ${isGenerating ? 'opacity-100' : 'opacity-30'}`}>
                {isGenerating && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>
              <div className="text-lg font-mono text-slate-600 dark:text-slate-600 text-gray-600">AI PROCESSING</div>
            </div>

            {/* Output Node */}
            <div className="flex flex-col items-center gap-4 relative">
              <div className={`w-32 h-32 rounded-2xl bg-card border flex items-center justify-center transition-all duration-500 overflow-hidden p-4 ${isGenerating ? 'border-ring' : currentResult ? 'border-ring' : 'border-border border-dashed'}`}>
                {currentResult ? (
                  <div className="w-full h-full flex items-center justify-center">
                    {renderIconPreview()}
                  </div>
                ) : isGenerating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full"
                  />
                ) : (
                  <Sparkles size={24} className="text-slate-600" />
                )}
              </div>
              <span className="text-lg font-mono text-muted-foreground">OUTPUT.svg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar (Chat Style) */}
      <div className="p-6 pt-2 z-20">
        {/* Log Feed */}
        <div className="mb-4 h-32 overflow-hidden relative">
          <div className="overflow-y-auto h-full flex flex-col justify-end custom-scrollbar px-2">
            <div className="space-y-1.5 pb-2">
              {consoleLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-[10px] font-mono">
                  <span className="text-slate-600 mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span className={`flex-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-slate-400'}`}>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="max-w-3xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative flex items-center bg-background border border-input rounded-xl overflow-hidden focus-within:border-ring transition-colors">
            <div className="pl-4 pr-2 text-muted-foreground">
              <Terminal size={16} />
            </div>
            <div className="flex-1 flex items-center px-2 py-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your desired style modifications..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[20px] max-h-32"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
            </div>
            <div className="flex items-center pr-2 gap-1">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-500/50 text-black font-medium text-sm rounded-lg transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                    />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
