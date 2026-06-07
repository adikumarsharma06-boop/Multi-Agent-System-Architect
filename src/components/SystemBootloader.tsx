import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Cpu, ShieldCheck, ArrowRight } from 'lucide-react';

interface SystemBootloaderProps {
  onBootComplete: () => void;
}

interface LogLine {
  id: number;
  prefix: string;
  message: string;
  status: 'info' | 'success' | 'warn';
  delay: number;
}

export const SystemBootloader: React.FC<SystemBootloaderProps> = ({ onBootComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [bootProgress, setBootProgress] = useState(0);
  const [readyToLaunch, setReadyToLaunch] = useState(false);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  const rawLogs: Omit<LogLine, 'id'>[] = [
    { prefix: 'SYS_CORE', message: 'INTEGRITY VERIFICATION FOR MULTI-AGENT COMPILER...', status: 'info', delay: 100 },
    { prefix: 'NET_GATE', message: 'CONNECTING AGENT CIRCUITS: PLANNER, RESEARCH, BUILDER, VALIDATOR...', status: 'info', delay: 500 },
    { prefix: 'CODE_AUDIT', message: 'COMPILING HIGH-CONTRAST SECURE LAYER RULES FOR CODES GATE...', status: 'success', delay: 1000 },
    { prefix: 'SAAS_STRT', message: 'INITIATING PORT 3000 HOOKS... STABLE INGRESS DETECTED.', status: 'info', delay: 1500 },
    { prefix: 'MEM_CACHE', message: 'HYDRATING SYSTEM SPECIFICATION SHORT-TERM & LONG-TERM CONTEXT...', status: 'info', delay: 1900 },
    { prefix: 'SYS_PLAN', message: 'GEMINI COGNITIVE INTERACTION PIPELINE STATUS: 200 OK (READY)', status: 'success', delay: 2300 },
    { prefix: 'METRIC_ENG', message: 'SYNAPSE DYNAMIC TRACE ROUTERS LOADED. ALL CHANNELS STABLE.', status: 'success', delay: 2600 },
  ];

  // Start building boot logs based on timestamps
  useEffect(() => {
    const timers: any[] = [];
    rawLogs.forEach((item, index) => {
      const timer = setTimeout(() => {
        setLogs((prev) => {
          if (prev.some((p) => p.id === index)) return prev;
          return [
            ...prev,
            {
              ...item,
              id: index,
            },
          ];
        });
        setActiveStep(index + 1);
        setBootProgress(((index + 1) / rawLogs.length) * 100);

        if (index === rawLogs.length - 1) {
          setReadyToLaunch(true);
        }
      }, item.delay);
      timers.push(timer);
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Auto-scroll terminal log to bottom
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Handle immediate workspace launch
  const handleLaunch = () => {
    onBootComplete();
  };

  // Automatically launch workspace after logs complete
  useEffect(() => {
    if (readyToLaunch) {
      const autoTimer = setTimeout(() => {
        onBootComplete();
      }, 1000);
      return () => clearTimeout(autoTimer);
    }
  }, [readyToLaunch, onBootComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 font-mono select-none overflow-hidden p-6 text-slate-100">
      {/* Background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-505/10 to-transparent pointer-events-none filter blur-3xl opacity-30" />

      {/* Container holding the logo and interactive sequences */}
      <div className="w-full max-w-lg flex flex-col items-center gap-8 relative z-10">
        
        {/* Animated Cybernetic Core Logo Frame */}
        <div className="relative flex flex-col items-center">
          
          {/* Main SVG Logo Representation */}
          <svg className="w-60 h-36 drop-shadow-[0_0_15px_rgba(99,102,241,0.25)]" viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="dotGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>

            {/* Connecting lines - Animated drawing length */}
            {/* Top Horizontal line ●──●──● */}
            <motion.line 
              x1="40" y1="30" x2="200" y2="30" 
              stroke="url(#logoGlow)" strokeWidth="3" strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            {/* Bottom Horizontal line ●──●──● */}
            <motion.line 
              x1="40" y1="110" x2="200" y2="110" 
              stroke="url(#logoGlow)" strokeWidth="3" strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
            />
            {/* Left Vertical Line: representing | border of │  AI  │ */}
            <motion.line 
              x1="40" y1="30" x2="40" y2="110" 
              stroke="url(#logoGlow)" strokeWidth="2.5" strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "easeInOut", delay: 0.6 }}
            />
            {/* Right Vertical Line: representing | border of │  AI  │ */}
            <motion.line 
              x1="200" y1="30" x2="200" y2="110" 
              stroke="url(#logoGlow)" strokeWidth="2.5" strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "easeInOut", delay: 0.6 }}
            />

            {/* Inner dynamic dots on horizontal lines representing connectors */}
            {/* Top Row: Left, Middle, Right */}
            <motion.circle 
              cx="40" cy="30" r="6" 
              fill="url(#dotGlow)" 
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.1, duration: 0.4 }}
            />
            <motion.circle 
              cx="120" cy="30" r="5" 
              fill="#6366f1" 
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.4, duration: 0.4 }}
            />
            <motion.circle 
              cx="200" cy="30" r="6" 
              fill="url(#dotGlow)" 
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.7, duration: 0.4 }}
            />

            {/* Bottom Row: Left, Middle, Right */}
            <motion.circle 
              cx="40" cy="110" r="6" 
              fill="url(#dotGlow)" 
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.8, duration: 0.4 }}
            />
            <motion.circle 
              cx="120" cy="110" r="5" 
              fill="#6366f1" 
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 1.0, duration: 0.4 }}
            />
            <motion.circle 
              cx="200" cy="110" r="6" 
              fill="url(#dotGlow)" 
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 1.2, duration: 0.4 }}
            />

            {/* Glowing background circles */}
            <circle cx="120" cy="70" r="24" fill="#6366f1" fillOpacity="0.04" />

            {/* Centered TEXT "AI" */}
            <motion.text 
              x="120" y="74" 
              textAnchor="middle" 
              dominantBaseline="middle"
              className="text-3xl font-mono tracking-[0.15em] font-black"
              fill="#ffffff"
              style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.7))" }}
              initial={{ opacity: 0, y: 79 }}
              animate={{ opacity: 1, y: 74 }}
              transition={{ duration: 0.8, delay: 0.9, cubicBezier: [0.16, 1, 0.3, 1] }}
            >
              AI
            </motion.text>
          </svg>

          {/* Glowing pulse rings surrounding core */}
          <div className="absolute -inset-4 rounded-full border border-indigo-500/10 animate-[ping_2s_infinite] opacity-50" />
        </div>

        {/* Loading header details */}
        <div className="text-center space-y-1">
          <h2 className="text-[10px] font-bold text-indigo-400 tracking-[0.3em] uppercase">
            Multi-Agent System Bootloader
          </h2>
          <p className="text-xs text-slate-400 font-sans tracking-wide">
            Initializing secure compilation workplace...
          </p>
        </div>

        {/* System Load Progress Bar */}
        <div className="w-full bg-slate-900 border border-slate-800/80 rounded-full h-1 p-0.5 overflow-hidden">
          <motion.div 
            className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 h-full rounded-full"
            style={{ width: `${bootProgress}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </div>

        {/* Mini simulated Shell view for detailed log status */}
        <div className="w-full bg-slate-950/80 border border-slate-900 rounded-xl p-4 h-36 font-mono text-[9.5px] text-slate-400 flex flex-col justify-between shadow-2xl relative">
          <div className="absolute top-2.5 right-3 flex items-center gap-1.5 text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          </div>

          <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 scrollbar-none select-text">
            {logs.map((item) => (
              <div key={item.id} className="flex items-start gap-1.5 animate-fade-in line-clamp-1">
                <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                <span className={`font-bold shrink-0 ${
                  item.status === 'success' ? 'text-emerald-500' : item.status === 'warn' ? 'text-amber-500' : 'text-indigo-400'
                }`}>
                  {item.prefix}
                </span>
                <span className="text-slate-500 shrink-0">&gt;&gt;</span>
                <span className="text-slate-300 tracking-tight">{item.message}</span>
              </div>
            ))}
            <div ref={terminalBottomRef} />
          </div>

          <div className="pt-2 border-t border-slate-900/40 flex justify-between items-center text-slate-500 text-[8.5px]">
            <span>ENGINE AT WORK: PORT 3000 COMPLETED</span>
            <span>SECURE_BOOT_VER_1.1</span>
          </div>
        </div>

        {/* Skip Actions to make it feel extremely responsive */}
        <div className="flex flex-col items-center gap-2 pt-2.5 w-full">
          <button 
            onClick={handleLaunch}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wider flex items-center justify-center gap-2 border cursor-pointer transition-all duration-300 ${
              readyToLaunch
                ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
                : 'bg-slate-900/50 hover:bg-slate-900 text-slate-300 border-slate-800'
            }`}
          >
            {readyToLaunch ? (
              <>
                LAUNCH SECURE WORKSPACE <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                INITIALIZING MULTI-AGENTS...
              </>
            )}
          </button>
          
          <button 
            type="button"
            onClick={handleLaunch}
            className="text-[9px] text-slate-500 hover:text-slate-300 uppercase tracking-widest cursor-pointer transition-colors"
          >
            Skip Intro Sequence
          </button>
        </div>

      </div>
    </div>
  );
};
