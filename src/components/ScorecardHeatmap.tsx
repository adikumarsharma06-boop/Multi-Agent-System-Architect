import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  TrendingUp, 
  Clock, 
  Cpu, 
  DollarSign, 
  HelpCircle, 
  Info, 
  Activity, 
  AlertOctagon, 
  CheckCircle2, 
  ChevronRight, 
  ChevronsUpDown,
  Lock
} from 'lucide-react';
import { MultiAgentSystem, SimulationStepLog } from '../types';

interface ScorecardHeatmapProps {
  activeWorkflow: MultiAgentSystem;
  baselineLogs: SimulationStepLog[];
  perturbedLogs: SimulationStepLog[];
  perturbationType: 'jitter' | 'extreme' | 'empty';
}

export const ScorecardHeatmap: React.FC<ScorecardHeatmapProps> = ({
  activeWorkflow,
  baselineLogs,
  perturbedLogs,
  perturbationType
}) => {
  // Mode toggle: Percentage Increase (%) vs Absolute Difference (Delta)
  const [displayMode, setDisplayMode] = useState<'percentage' | 'absolute'>('percentage');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ agentId: string; metricName: string } | null>(null);

  // Helper latency formula matching AgentPerformanceCharts
  const getLatency = (tokens: number, tier: string, jitterMultiplier = 1.0) => {
    const isPro = tier === 'gemini-3.1-pro-preview';
    const baseOffset = isPro ? 0.68 : 0.22;
    const speedFactor = isPro ? 0.00055 : 0.00012;
    return parseFloat(((baseOffset + (tokens * speedFactor)) * jitterMultiplier).toFixed(2));
  };

  // Process data for all agents
  const heatmapData = useMemo(() => {
    return activeWorkflow.agents.map((agent) => {
      const baseAgentLogs = baselineLogs.filter(log => log.nodeId === agent.id && log.nodeType === 'agent');
      const perturbedAgentLogs = perturbedLogs.filter(log => log.nodeId === agent.id && log.nodeType === 'agent');

      // 1. Tokens calculation
      let baseTokens = 0;
      if (baseAgentLogs.length > 0) {
        baseTokens = baseAgentLogs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0);
      } else {
        // Fallback realistic metrics before simulation run
        if (agent.id.includes('planner')) baseTokens = 1350;
        else if (agent.id.includes('builder') || agent.id.includes('synthesis')) baseTokens = 3800;
        else if (agent.id.includes('compliance') || agent.id.includes('audit') || agent.id.includes('validator')) baseTokens = 1600;
        else baseTokens = 1100;
      }

      let perturbedTokens = 0;
      if (perturbedAgentLogs.length > 0) {
        perturbedTokens = perturbedAgentLogs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0);
      } else {
        // Fallback realistic stress factor based on active template and type
        let boost = 1.35;
        if (perturbationType === 'extreme') {
          boost = agent.id.includes('builder') ? 1.95 : agent.id.includes('planner') ? 1.6 : 1.45;
        } else if (perturbationType === 'jitter') {
          boost = 1.25;
        } else {
          boost = 0.9; // Emptied/shrunk
        }
        perturbedTokens = Math.floor(baseTokens * boost);
      }

      // 2. Latency calculation
      const baseLatency = getLatency(baseTokens, agent.intelligenceTier);
      const perturbedLatency = getLatency(perturbedTokens, agent.intelligenceTier, perturbationType === 'jitter' ? 1.2 : 1.15);

      // 3. Cost calculation
      const getCost = (tokens: number, tier: string) => {
        const rate = tier === 'gemini-3.1-pro-preview' ? 0.00000125 : 0.00000015;
        return parseFloat((tokens * rate).toFixed(4));
      };
      const baseCost = getCost(baseTokens, agent.intelligenceTier);
      const perturbedCost = getCost(perturbedTokens, agent.intelligenceTier);

      // Percentage Deltas
      const tokenDeltaPercent = baseTokens > 0 ? ((perturbedTokens - baseTokens) / baseTokens) * 100 : 0;
      const latencyDeltaPercent = baseLatency > 0 ? ((perturbedLatency - baseLatency) / baseLatency) * 100 : 0;
      const costDeltaPercent = baseCost > 0 ? ((perturbedCost - baseCost) / baseCost) * 100 : 0;

      // Absolute Deltas
      const tokenAbsoluteDelta = perturbedTokens - baseTokens;
      const latencyAbsoluteDelta = parseFloat((perturbedLatency - baseLatency).toFixed(2));
      const costAbsoluteDelta = parseFloat((perturbedCost - baseCost).toFixed(4));

      return {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        tier: agent.intelligenceTier,
        baseTokens,
        perturbedTokens,
        tokenDeltaPercent,
        tokenAbsoluteDelta,
        baseLatency,
        perturbedLatency,
        latencyDeltaPercent,
        latencyAbsoluteDelta,
        baseCost,
        perturbedCost,
        costDeltaPercent,
        costAbsoluteDelta,
      };
    });
  }, [activeWorkflow.agents, baselineLogs, perturbedLogs, perturbationType]);

  // Set default selection on first load
  React.useEffect(() => {
    if (heatmapData.length > 0 && !selectedAgentId) {
      setSelectedAgentId(heatmapData[0].id);
    }
  }, [heatmapData, selectedAgentId]);

  // Get color scale classes based on percentage increase
  const getCellClasses = (percent: number) => {
    if (percent < 0) {
      return {
        bg: 'bg-emerald-950/20 text-emerald-300 border-emerald-900/30 hover:bg-emerald-950/40',
        badge: 'bg-emerald-950 text-emerald-400 border-emerald-900',
        label: 'Optimized'
      };
    }
    if (percent <= 15) {
      return {
        bg: 'bg-indigo-950/20 text-indigo-300 border-indigo-900/30 hover:bg-indigo-950/40',
        badge: 'bg-indigo-950 text-indigo-400 border-indigo-900',
        label: 'Stable (Negligible)'
      };
    }
    if (percent <= 45) {
      return {
        bg: 'bg-amber-950/20 text-amber-300 border-amber-900/30 hover:bg-amber-950/40',
        badge: 'bg-amber-950 text-amber-400 border-amber-900',
        label: 'Moderate Overhead'
      };
    }
    if (percent <= 75) {
      return {
        bg: 'bg-orange-950/30 text-orange-400 border-orange-900/40 hover:bg-orange-950/50',
        badge: 'bg-orange-950 text-orange-400 border-orange-900',
        label: 'High Expansion'
      };
    }
    return {
      bg: 'bg-rose-950/40 text-rose-400 border-rose-900/50 hover:bg-rose-900/20',
      badge: 'bg-rose-950 text-rose-400 border-rose-900',
      label: 'Critical Spikes'
    };
  };

  const selectedAgentData = heatmapData.find(d => d.id === selectedAgentId);

  return (
    <div className="bg-slate-950/40 rounded-2xl border border-slate-900 p-4 space-y-4 font-sans select-none" id="scorecard-heatmap-root">
      {/* Header section with toggle controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-900 pb-3" id="heatmap-panel-header">
        <div className="space-y-0.5">
          <h5 className="font-mono text-[11px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5 matches-glow">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Performance Delta Heatmap (Stress Hotspots)
          </h5>
          <p className="text-[9px] text-slate-500 font-mono">
            Highlights percentage increases comparing pristine vs. stressed runs across agency nodes.
          </p>
        </div>

        {/* Display mode buttons */}
        <div className="flex bg-slate-950/90 p-0.5 rounded-lg border border-slate-800 scale-95 origin-right self-start sm:self-auto font-mono text-[9px]">
          <button
            type="button"
            onClick={() => setDisplayMode('percentage')}
            className={`px-2 py-1 rounded font-bold cursor-pointer transition-all ${
              displayMode === 'percentage' ? 'bg-slate-800 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Relative %
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode('absolute')}
            className={`px-2 py-1 rounded font-bold cursor-pointer transition-all ${
              displayMode === 'absolute' ? 'bg-slate-800 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Absolute Delta
          </button>
        </div>
      </div>

      {/* Grid Layout of the Heatmap */}
      <div className="overflow-x-auto scrollbar-none" id="heatmap-matrix-scroll-wrapper">
        <div className="min-w-[500px] border border-slate-900 rounded-xl overflow-hidden bg-slate-950/50">
          
          {/* Header row of Columns */}
          <div className="grid grid-cols-12 bg-slate-950/80 border-b border-slate-900 text-[9.5px] font-mono text-slate-500 p-2 font-bold select-none uppercase tracking-wide">
            <div className="col-span-5 flex items-center gap-1.5 pl-1.5">
              <span>Agent Node Target</span>
            </div>
            <div className="col-span-2 text-center flex items-center justify-center gap-1">
              <Cpu className="w-3 h-3 text-slate-500" />
              <span>Token Exp.</span>
            </div>
            <div className="col-span-2 text-center flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Latency Del.</span>
            </div>
            <div className="col-span-2 text-center flex items-center justify-center gap-1">
              <DollarSign className="w-3 h-3 text-slate-500" />
              <span>Cost Delta</span>
            </div>
            <div className="col-span-1 text-right pr-2">
              <span>Inspect</span>
            </div>
          </div>

          {/* Body Rows */}
          <div className="divide-y divide-slate-950">
            {heatmapData.map((agent) => {
              const tokenClasses = getCellClasses(agent.tokenDeltaPercent);
              const latencyClasses = getCellClasses(agent.latencyDeltaPercent);
              const costClasses = getCellClasses(agent.costDeltaPercent);

              const isSelected = selectedAgentId === agent.id;

              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`grid grid-cols-12 items-center p-2 transition-all cursor-pointer select-none text-[10.5px] ${
                    isSelected ? 'bg-indigo-950/10 border-l-2 border-indigo-500' : 'hover:bg-slate-900/20'
                  }`}
                  id={`heatmap-row-${agent.id}`}
                >
                  {/* Row descriptor */}
                  <div className="col-span-5 pr-2 pl-1 z-10">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-slate-200 truncate flex items-center gap-1">
                        {agent.name}
                        {agent.tier === 'gemini-3.1-pro-preview' && (
                          <span className="text-[7.5px] font-sans font-extrabold bg-indigo-950 text-indigo-400 border border-indigo-900/60 px-1 py-0.1 space-x-1 rounded">PRO</span>
                        )}
                      </span>
                      <span className="text-[8.5px] font-mono text-slate-500 truncate mt-0.5">{agent.role}</span>
                    </div>
                  </div>

                  {/* Token Exp Cell */}
                  <div 
                    className="col-span-2 p-1.5"
                    onMouseEnter={() => setHoveredCell({ agentId: agent.id, metricName: 'Tokens' })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <div className={`p-1.5 rounded-lg border text-center font-mono font-extrabold text-[10px] uppercase transition-all duration-150 ${tokenClasses.bg}`}>
                      {displayMode === 'percentage' 
                        ? `+${agent.tokenDeltaPercent.toFixed(1)}%` 
                        : `+${agent.tokenAbsoluteDelta.toLocaleString()}`
                      }
                    </div>
                  </div>

                  {/* Latency Cell */}
                  <div 
                    className="col-span-2 p-1.5"
                    onMouseEnter={() => setHoveredCell({ agentId: agent.id, metricName: 'Latency' })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <div className={`p-1.5 rounded-lg border text-center font-mono font-extrabold text-[10px] uppercase transition-all duration-150 ${latencyClasses.bg}`}>
                      {displayMode === 'percentage' 
                        ? `+${agent.latencyDeltaPercent.toFixed(1)}%` 
                        : `+${agent.latencyAbsoluteDelta}s`
                      }
                    </div>
                  </div>

                  {/* Cost Cell */}
                  <div 
                    className="col-span-2 p-1.5"
                    onMouseEnter={() => setHoveredCell({ agentId: agent.id, metricName: 'Cost' })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <div className={`p-1.5 rounded-lg border text-center font-mono font-extrabold text-[10px] uppercase transition-all duration-150 ${costClasses.bg}`}>
                      {displayMode === 'percentage' 
                        ? `+${agent.costDeltaPercent.toFixed(1)}%` 
                        : `+$${agent.costAbsoluteDelta.toFixed(4)}`
                      }
                    </div>
                  </div>

                  {/* Inspector indicator */}
                  <div className="col-span-1 text-right pr-2">
                    <ChevronRight className={`w-3.5 h-3.5 inline-block text-slate-600 transition-transform ${
                      isSelected ? 'rotate-90 text-indigo-400' : ''
                    }`} />
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Auxiliary interactive tooltip status or hovering info */}
      <AnimatePresence>
        {hoveredCell && (() => {
          const matchingAgent = heatmapData.find(a => a.id === hoveredCell.agentId);
          if (!matchingAgent) return null;
          
          let val = '';
          let healthVerdict = '';
          if (hoveredCell.metricName === 'Tokens') {
            val = `Baseline: ${matchingAgent.baseTokens.toLocaleString()} → Perturbed: ${matchingAgent.perturbedTokens.toLocaleString()}`;
            healthVerdict = matchingAgent.tokenDeltaPercent > 45 ? '⚠️ Context caching review advised' : '✨ Well structured context margins';
          } else if (hoveredCell.metricName === 'Latency') {
            val = `Baseline: ${matchingAgent.baseLatency}s → Perturbed: ${matchingAgent.perturbedLatency}s`;
            healthVerdict = matchingAgent.latencyDeltaPercent > 45 ? '⚠️ Pro reasoning tier cold-<ctrl42> penalty' : '✨ Resilient processing rate';
          } else {
            val = `Baseline: $${matchingAgent.baseCost.toFixed(4)} → Perturbed: $${matchingAgent.perturbedCost.toFixed(4)}`;
            healthVerdict = '✨ Directly linked to baseline token scaling ratio';
          }

          return (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-[9.5px] font-mono text-slate-400 flex items-center justify-between gap-3 animate-fade-in"
              id="heatmap-cell-tooltip-bar"
            >
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>
                  <strong>{matchingAgent.name}</strong> • {hoveredCell.metricName}: <span className="text-slate-200">{val}</span>
                </span>
              </div>
              <span className="text-[8.5px] font-extrabold text-indigo-400 uppercase tracking-widest">{healthVerdict}</span>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Detailed side-by-side diagnostic bar cards for selected agent */}
      <AnimatePresence mode="wait">
        {selectedAgentData && (
          <motion.div
            key={selectedAgentData.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="bg-slate-950/70 border border-slate-900 rounded-xl p-3.5 space-y-3 font-mono text-[10px]"
            id="heatmap-diagnostics-expanded"
          >
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                <span className="font-bold text-slate-200 uppercase tracking-wide">
                  {selectedAgentData.name} Stress Diagnostics
                </span>
              </div>
              <span className="text-[8.5px] text-slate-500 font-mono">
                Tier: {selectedAgentData.tier}
              </span>
            </div>

            {/* Side-by-Side comparison cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Token Bar comparison */}
              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-900/60 space-y-2">
                <div className="flex justify-between items-center text-[9px] text-slate-500">
                  <span>TOKEN THROUGHPUT</span>
                  <span className={`font-bold ${selectedAgentData.tokenDeltaPercent > 45 ? 'text-amber-400' : 'text-slate-400'}`}>
                    +{selectedAgentData.tokenDeltaPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400 text-[8.5px]">
                    <span>Baseline:</span>
                    <span className="text-slate-200 font-bold">{selectedAgentData.baseTokens.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 roundedOverflow-hidden border border-slate-900 rounded-full relative">
                    <div className="absolute left-0 top-0 h-full bg-indigo-500 rounded-full" style={{ width: '45%' }} />
                    <div className="absolute left-0 top-0 h-full bg-amber-500/80 rounded-full" style={{ width: `${Math.min(95, 45 + (selectedAgentData.tokenDeltaPercent / 4))}%` }} />
                  </div>
                  <div className="flex justify-between text-slate-400 text-[8.5px] pt-0.5">
                    <span>Perturbed:</span>
                    <span className="text-amber-400 font-bold">{selectedAgentData.perturbedTokens.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Latency Bar comparison */}
              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-900/60 space-y-2">
                <div className="flex justify-between items-center text-[9px] text-slate-500">
                  <span>LATENCY DEGRADATION</span>
                  <span className={`font-bold ${selectedAgentData.latencyDeltaPercent > 45 ? 'text-orange-400' : 'text-slate-400'}`}>
                    +{selectedAgentData.latencyDeltaPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400 text-[8.5px]">
                    <span>Baseline:</span>
                    <span className="text-slate-200 font-bold">{selectedAgentData.baseLatency}s</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 roundedOverflow-hidden border border-slate-900 rounded-full relative">
                    <div className="absolute left-0 top-0 h-full bg-indigo-500 rounded-full" style={{ width: '35%' }} />
                    <div className="absolute left-0 top-0 h-full bg-orange-500/85 rounded-full" style={{ width: `${Math.min(95, 35 + (selectedAgentData.latencyDeltaPercent / 3))}%` }} />
                  </div>
                  <div className="flex justify-between text-slate-400 text-[8.5px] pt-0.5">
                    <span>Perturbed:</span>
                    <span className="text-orange-400 font-bold">{selectedAgentData.perturbedLatency}s</span>
                  </div>
                </div>
              </div>

              {/* Cost Bar comparison */}
              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-900/60 space-y-2">
                <div className="flex justify-between items-center text-[9px] text-slate-500">
                  <span>INFERENCE OVERHEAD</span>
                  <span className="text-emerald-400 font-bold">
                    +${(selectedAgentData.perturbedCost - selectedAgentData.baseCost).toFixed(4)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400 text-[8.5px]">
                    <span>Baseline:</span>
                    <span className="text-slate-200 font-bold">${selectedAgentData.baseCost.toFixed(4)}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 roundedOverflow-hidden border border-slate-900 rounded-full relative">
                    <div className="absolute left-0 top-0 h-full bg-indigo-500 rounded-full" style={{ width: '40%' }} />
                    <div className="absolute left-0 top-0 h-full bg-rose-500/80 rounded-full" style={{ width: `${Math.min(95, 40 + (selectedAgentData.costDeltaPercent / 4))}%` }} />
                  </div>
                  <div className="flex justify-between text-slate-400 text-[8.5px] pt-0.5">
                    <span>Perturbed:</span>
                    <span className="text-rose-400 font-bold">${selectedAgentData.perturbedCost.toFixed(4)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Recommendations block to handle premium user lock checks & optimization tips */}
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-start gap-2 text-[9.3px] text-slate-400 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-300 font-bold block mb-0.5">Recommended Remediation Strategy:</span>
                {selectedAgentData.tokenDeltaPercent > 50 ? (
                  <span>This node experiences significant instruction overhead. We recommend enabling context prompt caching strategy inside `Multi-Agent optimization` parameters to insulate intelligence from redundant tokens.</span>
                ) : (
                  <span>The node shows excellent resilience profile and minimal jitter. Ideal placement for high complexity agentic routing. No immediate prompt refactoring needed.</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
