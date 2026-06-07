import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Bot, 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Play, 
  Compass, 
  Activity, 
  ArrowRight,
  Monitor,
  Terminal
} from 'lucide-react';

interface LeadArchitectIntroProps {
  onEnterWorkspace: () => void;
  selectedTemplateName: string;
}

export const LeadArchitectIntro: React.FC<LeadArchitectIntroProps> = ({ 
  onEnterWorkspace,
  selectedTemplateName 
}) => {
  const [hasAgreed, setHasAgreed] = useState(true);
  const [badgeAnimated, setBadgeAnimated] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/98 overflow-y-auto p-4 md:p-6 font-mono select-none">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.07] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none opacity-40 animate-pulse" style={{ animationDuration: '8s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 15, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl flex flex-col justify-between overflow-hidden"
      >
        {/* Terminal Header Bar */}
        <div className="absolute top-0 inset-x-0 h-10 bg-slate-950/60 border-b border-slate-800/80 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="text-[10px] text-slate-500 font-bold ml-2 uppercase tracking-widest font-mono">Architect_Terminal_V2.9</span>
          </div>
          <div className="text-[10px] text-slate-600 font-mono">
            PORT: 3000 (SECURE INGRESS)
          </div>
        </div>

        <div className="pt-8 space-y-6 md:space-y-8">
          
          {/* Avatar / Architect Branding Area */}
          <div className="flex flex-col sm:flex-row items-center gap-5 md:gap-7 border-b border-slate-800/60 pb-6 md:pb-8 mt-2">
            
            {/* Spinning Neuro-Core Avatar */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl filter blur-md animate-pulse" />
              <div className="relative w-20 h-20 bg-slate-950 border-2 border-indigo-500/40 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg shadow-indigo-950/40">
                
                {/* Visual Rotating Accents */}
                <motion.div 
                  className="absolute inset-2 border border-dashed border-indigo-400/30 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                />
                <motion.div 
                  className="absolute inset-4 border border-indigo-500/50 rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                />
                
                <Cpu className="w-8 h-8 text-indigo-400 relative z-10" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-md animate-pulse" />
            </div>

            {/* Title Block */}
            <div className="text-center sm:text-left space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-[9.5px] font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-800/40 px-2 py-0.5 rounded uppercase tracking-wider">
                  Lead Systems Architect
                </span>
                <span className="text-[9.5px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-900/40 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-ping" />
                  Synchronized
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-bold font-sans text-slate-100 tracking-tight">
                ARES-9 Principal Cognitive Compiler
              </h1>
              <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                Supervising node flow integrity & stochastic stress tolerances
              </p>
            </div>
          </div>

          {/* Conversational Directive Dialogue */}
          <div className="bg-slate-950/45 p-4 md:p-5 rounded-2xl border border-slate-800/60 text-slate-300 space-y-3 relative">
            <span className="absolute -top-2.5 left-5 text-[9px] bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              MESSAGE DIRECTIVE
            </span>
            <p className="text-[11.5px] md:text-xs leading-relaxed text-slate-300 mt-1 font-mono">
              &quot;Greetings, Operator. I have completed the zero-trust compilation loop. All sub-agents and validation metrics are validated. This workbench lets you map out agent graphs, inspect produced models mid-flight, and execute extreme stress perturbations to test performance robustness.&quot;
            </p>
            <div className="pt-2 border-t border-slate-800/50 flex flex-wrap items-center gap-y-1 gap-x-3 text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <Terminal className="w-3 h-3 text-indigo-400" /> ACTIVE GRAPH: <strong className="text-slate-300">{selectedTemplateName}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> AGENT COOPERATIVE: <strong className="text-slate-300">4 ACTIVE NODES</strong>
              </span>
            </div>
          </div>

          {/* Technical Scope Breakdown Checklist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
            
            <div className="p-3.5 bg-slate-950/25 border border-slate-800/40 rounded-xl space-y-2 hover:border-indigo-900/40 transition-colors">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-950/50 border border-indigo-900/30 rounded-lg">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-[10.5px] font-bold text-slate-200">Interactive Blueprinting</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Click any node (e.g. Planner, Research, Codes Gate) to inspect parameters, output expectations, and specialized models.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/25 border border-slate-800/40 rounded-xl space-y-2 hover:border-indigo-900/40 transition-colors">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-950/50 border border-indigo-900/30 rounded-lg">
                  <Compass className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-[10.5px] font-bold text-slate-200">Continuous Simulation</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Observe asynchronous step execution logs complete with real-time token counts, processing cost variables, and trace telemetry.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/25 border border-slate-800/40 rounded-xl space-y-2 hover:border-indigo-900/40 transition-colors">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-950/50 border border-indigo-900/30 rounded-lg">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-[10.5px] font-bold text-slate-200">Perturbation Stress Tests</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Toggle &quot;Sensitivity Stress Test&quot; and select Jitter/Extreme modes to analyze multi-agent recovery and auto-remediation logs.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/25 border border-slate-800/40 rounded-xl space-y-2 hover:border-indigo-900/40 transition-colors">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-950/50 border border-indigo-900/30 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-[10.5px] font-bold text-slate-200">Smart Code Compilation</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Incorporate custom task inputs with instant flow charts, blueprint configurations and full Python/TypeScript compilations.
              </p>
            </div>

          </div>

        </div>

        {/* Action Button & Confirmation */}
        <div className="mt-6 pt-5 border-t border-slate-800/60 flex flex-col sm:flex-row items-center sm:justify-between gap-4">
          <label className="flex items-center gap-2 text-[10px] text-slate-500 select-all cursor-pointer">
            <input 
              type="checkbox" 
              checked={hasAgreed} 
              onChange={(e) => setHasAgreed(e.target.checked)} 
              className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Commit credentials & telemetry compliance</span>
          </label>

          <button
            type="button"
            disabled={!hasAgreed}
            onClick={onEnterWorkspace}
            className={`w-full sm:w-auto py-2.5 px-6 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border cursor-pointer transition-all duration-300 ${
              hasAgreed 
                ? 'bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]' 
                : 'bg-slate-950 text-slate-600 border-slate-850 opacity-40 cursor-not-allowed'
            }`}
          >
            LAUNCH COMPILER WORKSPACE
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </motion.div>
    </div>
  );
};
