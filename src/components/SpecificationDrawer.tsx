import React from 'react';
import { AgentNode, ValidationGate, MultiAgentSystem } from '../types';
import { Bot, ShieldCheck, X, Code, ClipboardList, Database, Zap, Sparkles, RefreshCw, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

interface SpecificationDrawerProps {
  system: MultiAgentSystem;
  selectedNodeId: string | null;
  selectedNodeType: 'agent' | 'gate' | null;
  onClose: () => void;
}

export const SpecificationDrawer: React.FC<SpecificationDrawerProps> = ({
  system,
  selectedNodeId,
  selectedNodeType,
  onClose
}) => {
  const activeAgent = React.useMemo(() => {
    if (selectedNodeType === 'agent') {
      return system.agents.find(a => a.id === selectedNodeId);
    }
    return null;
  }, [system, selectedNodeId, selectedNodeType]);

  const activeGate = React.useMemo(() => {
    if (selectedNodeType === 'gate') {
      return system.gates.find(g => g.id === selectedNodeId);
    }
    return null;
  }, [system, selectedNodeId, selectedNodeType]);

  if (!activeAgent && !activeGate) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%', opacity: 0.95 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0.95 }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col focus:outline-none"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              activeAgent 
                ? 'bg-gradient-to-tr from-emerald-500/20 to-emerald-400/5 text-emerald-400 border border-emerald-500/30' 
                : 'bg-gradient-to-tr from-amber-500/20 to-amber-400/5 text-amber-400 border border-amber-500/30'
            }`}>
              {activeAgent ? <Bot className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-sans font-extrabold text-base text-slate-100 tracking-tight">
                {activeAgent ? activeAgent.name : activeGate?.name}
              </h3>
              <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                ID: {activeAgent ? activeAgent.id : activeGate?.id} • {activeAgent ? 'Agent Spec' : 'Decision Gate Spec'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {activeAgent && (
            <>
              {/* Role & Objective */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  Role & Focused Specialty
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  {activeAgent.description}
                </p>
              </div>

              {/* Inputs & Outputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
                  <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1">
                    <Database className="w-3 h-3" /> Input Contexts
                  </h5>
                  <ul className="space-y-1.5">
                    {activeAgent.inputs.map((inp, i) => (
                      <li key={i} className="text-[10px] font-mono text-slate-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        {inp}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
                  <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Produced Outputs
                  </h5>
                  <ul className="space-y-1.5">
                    {activeAgent.outputs.map((out, i) => (
                      <li key={i} className="text-[10px] font-mono text-slate-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        {out}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tools Panel */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <ClipboardList className="w-3.5 h-3.5 text-sky-400" />
                  Tool-Calling Integrations
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeAgent.tools.map((tool, i) => (
                    <span key={i} className="px-2.5 py-1 text-[10px] font-mono bg-slate-950 border border-slate-800 text-sky-300 rounded-md">
                      🔧 {tool}
                    </span>
                  ))}
                  {activeAgent.tools.length === 0 && (
                    <span className="text-[11px] text-slate-500 font-mono">None (Raw synthesis)</span>
                  )}
                </div>
              </div>

              {/* Intelligence Allocation */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-950 to-indigo-950/20">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  LLM Model Allocation Strategy
                </h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-semibold text-slate-200 font-mono">
                    {activeAgent.intelligenceTier}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 font-mono">
                    {activeAgent.intelligenceTier === 'gemini-3.1-pro-preview' ? 'Heavy Inference Tier' : 'High Throughput Tier'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  {activeAgent.intelligenceTier === 'gemini-3.1-pro-preview' 
                    ? 'Allocated for deep reasoning, structural adherence, regulatory validation, or long-form semantic integration.'
                    : 'Flash modeling deployed for fast latency sub-tasks, mathematical checks, and template compilations.'}
                </p>
              </div>

              {/* System Instruction (Persona Context Injection) */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Code className="w-3.5 h-3.5 text-emerald-400" />
                  System SystemInstruction Prompts
                </h4>
                <div className="relative">
                  <pre className="text-[10px] text-slate-300 bg-slate-950/90 p-4 rounded-xl border border-slate-800 font-mono overflow-x-auto max-h-[160px] whitespace-pre-wrap leading-relaxed select-all">
                    {activeAgent.systemInstruction}
                  </pre>
                  <div className="absolute bottom-1 right-2 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[8px] font-mono text-slate-500 pointer-events-none">
                    SYSTEM CONTEXT
                  </div>
                </div>
              </div>

              {/* Decision Heuristics / Local Guardrails */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                  Decision Checklists & Logic Rules
                </h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-xs text-slate-300 font-sans leading-relaxed">
                  {activeAgent.decisionLogic}
                </div>
              </div>

              {/* Token Optimization profiles */}
              <div className="pt-3.5 border-t border-slate-800/80">
                <h5 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  Optimizations Applied
                </h5>
                <p className="text-[10px] font-mono text-slate-500 mt-1">
                  {activeAgent.costOptimization}
                </p>
              </div>
            </>
          )}

          {activeGate && (
            <>
              {/* Criteria Checklist */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                  <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                  Audit Criteria Gate Checklist
                </h4>
                <ul className="space-y-2.5">
                  {activeGate.criteria.map((crit, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-slate-300">
                      <span className="w-4 h-4 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono flex items-center justify-center text-slate-400 shrink-0 select-none">
                        {idx + 1}
                      </span>
                      <span>{crit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Programmatic Test Assertions */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Code className="w-3.5 h-3.5 text-amber-400" />
                  Deterministic Test Assertion Guards
                </h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[10.5px] text-amber-300/90 leading-relaxed">
                  {activeGate.testAsserts.map((assert, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-slate-600">❯</span>
                      <span>{assert}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fail Re-routing Mechanics */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5 mb-2">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Failure Loopback Protocol
                </h4>
                <p className="text-xs text-slate-300 leading-normal mb-3">
                  If assertions are breached, the system halts execution, logs context schemas, and formats custom remediation directives.
                </p>
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
                  <div className="bg-rose-950/20 border border-rose-800/30 p-2.5 rounded-lg">
                    <span className="block text-rose-400 uppercase tracking-widest font-bold mb-1">Route Loops Back To</span>
                    <span className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 block truncate">{activeGate.ifFailedTargetNodeId}</span>
                  </div>
                  <div className="bg-emerald-950/20 border border-emerald-800/30 p-2.5 rounded-lg">
                    <span className="block text-emerald-400 uppercase tracking-widest font-bold mb-1">Route Passes Forward To</span>
                    <span className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 block truncate">{activeGate.ifPassedTargetNodeId}</span>
                  </div>
                </div>
              </div>

              {/* Feedback Dispatch Instructions */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  Feedback Construction Directive
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px]">
                  {activeGate.feedbackProtocol}
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
