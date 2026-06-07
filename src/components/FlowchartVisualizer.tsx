import React from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  Handle, 
  Position,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AgentNode, ValidationGate, MultiAgentSystem, SimulationStepLog } from '../types';
import { Bot, ShieldCheck, Cpu, AlertTriangle, CheckCircle2, Hammer, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCollide,
  forceX,
  forceY
} from 'd3';

interface FlowchartVisualizerProps {
  system: MultiAgentSystem;
  activeNodeId: string | null;
  activeEdgeId: string | null;
  selectedNodeId: string | null;
  onSelectNode: (node: { id: string; type: 'agent' | 'gate' }) => void;
  simulationPhase: string | null; // 'idle' | 'running' | 'feedback_loop' | 'completed'
  simulatedLogsPlayed: SimulationStepLog[];
}

// -------------------------------------------------------------
// XYFlow Custom Agent Node Component
// -------------------------------------------------------------
const AgentCustomNode = ({ data }: any) => {
  const {
    name,
    subLabel,
    tier,
    toolsCount,
    isProcessing,
    hasFailedStep,
    hasPassedStep,
    isSelected,
    nodeState,
    stateDotColor,
    stateTextColor,
    statusBadge,
    rawNode,
    successes = 0,
    failures = 0,
    healthPercent = 100,
  } = data;

  let borderStyle = 'border-slate-800 bg-slate-900/90 text-slate-100 hover:border-slate-700';
  let glowEffect = 'shadow-md';

  if (isProcessing) {
    borderStyle = 'border-emerald-500 bg-slate-900/95 shadow-[0_0_20px_rgba(16,185,129,0.35)] text-white';
    glowEffect = 'ring-2 ring-emerald-500';
  } else if (hasFailedStep) {
    borderStyle = 'border-rose-500 bg-slate-900/95 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]';
    glowEffect = 'animate-fail-pulse';
  } else if (hasPassedStep) {
    borderStyle = 'border-emerald-500 bg-slate-900/95 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]';
    glowEffect = 'animate-success-glow';
  } else if (isSelected) {
    borderStyle = 'border-sky-500 bg-slate-900/95 ring-1 ring-sky-500 text-white';
  }

  return (
    <div 
      className={`group w-[290px] h-[116px] p-3.5 rounded-xl border flex flex-col justify-between transition-colors duration-300 relative select-none ${borderStyle} ${glowEffect}`}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-2 !h-2.5 !bg-indigo-500 !border-slate-950" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-2 !h-2.5 !bg-emerald-500 !border-slate-950" 
      />
      
      {statusBadge}

      {/* Real-time Health Circular Gauge */}
      <div 
        className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-950/80 border border-slate-800/80 px-2 py-1 rounded-lg shadow-sm"
        title={`Health Rating: ${healthPercent}% (${successes} Successful, ${failures} Failed)`}
      >
        <div className="relative flex items-center justify-center shrink-0 w-6 h-6">
          <svg className="w-6 h-6 transform -rotate-90">
            <circle
              className="text-slate-800"
              strokeWidth="2"
              stroke="currentColor"
              fill="transparent"
              r="10"
              cx="12"
              cy="12"
            />
            <circle
              className={healthPercent >= 90 ? "text-emerald-500" : healthPercent >= 50 ? "text-amber-500" : "text-rose-500"}
              strokeWidth="2"
              strokeDasharray={2 * Math.PI * 10}
              strokeDashoffset={2 * Math.PI * 10 * (1 - healthPercent / 100)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="10"
              cx="12"
              cy="12"
            />
          </svg>
          <span className="absolute text-[7.5px] font-bold font-mono text-slate-200">
            {healthPercent}
          </span>
        </div>
        <div className="flex flex-col text-[7px] font-mono leading-none font-semibold text-slate-500 uppercase tracking-wider">
          <span>Hlth</span>
          <span className="text-[6.5px] text-slate-600 font-bold mt-0.5">{successes}:{failures}</span>
        </div>
      </div>

      {/* Informative Hover Tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[120%] w-[330px] bg-slate-950/98 border border-slate-700/60 p-3.5 rounded-xl shadow-2xl text-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 flex flex-col gap-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex flex-col text-left">
            <span className="font-sans font-extrabold text-[11px] text-slate-100 tracking-wide uppercase">Agent Summary Card</span>
            <span className="text-[9px] font-mono text-slate-500">ID: {rawNode?.id || 'N/A'}</span>
          </div>
          <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded ${stateDotColor?.replace('shadow-', '').replace('animate-pulse', '').replace('animate-ping', '') || 'bg-slate-650'} bg-slate-900 border border-slate-800 text-slate-200 font-bold uppercase tracking-tight`}>
            {nodeState}
          </span>
        </div>

        <div className="text-left font-sans text-[11px] space-y-2">
          {/* Tooltip Real-time Health summary */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-850 p-2 rounded-lg text-slate-300">
            <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wide">Simulation Health Status</span>
            <span className={`font-mono text-[10px] font-bold ${healthPercent >= 90 ? 'text-emerald-400' : healthPercent >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {healthPercent}% Health ({successes} success, {failures} fail)
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wide">Goal & Purpose</span>
            <p className="text-slate-200 mt-0.5 leading-relaxed text-[11.5px] font-medium">{rawNode?.description || 'No direct objective declared.'}</p>
          </div>

          {rawNode?.systemInstruction && (
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wide">System prompt excerpt</span>
              <p className="text-slate-300 mt-0.5 font-mono text-[9px] line-clamp-2 leading-relaxed bg-slate-900 px-1.5 py-1 rounded border border-slate-850">
                "{rawNode.systemInstruction}"
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 border-t border-slate-850 pt-2 text-[9px] font-mono">
            <div>
              <strong className="text-indigo-400 block uppercase text-[8px] tracking-wide mb-0.5">📥 Inputs</strong>
              <div className="flex flex-wrap gap-1">
                {rawNode?.inputs?.map((input: string, idx: number) => (
                  <span key={idx} className="bg-slate-900 border border-slate-800 px-1 py-0.2 rounded text-[8px] text-slate-300 truncate max-w-full">
                    {input}
                  </span>
                )) || <span className="text-slate-600">None</span>}
              </div>
            </div>
            <div>
              <strong className="text-emerald-400 block uppercase text-[8px] tracking-wide mb-0.5">📤 Outputs</strong>
              <div className="flex flex-wrap gap-1">
                {rawNode?.outputs?.map((output: string, idx: number) => (
                  <span key={idx} className="bg-slate-900 border border-slate-800 px-1 py-0.2 rounded text-[8px] text-slate-300 truncate max-w-full">
                    {output}
                  </span>
                )) || <span className="text-slate-600">None</span>}
              </div>
            </div>
          </div>
        </div>

        <p className="text-[8.5px] font-mono text-slate-500 mt-1 border-t border-slate-850 pt-1.5 text-center leading-none">
          Click node to review full system specifications in the right panel.
        </p>
      </div>

      <div className="flex items-start gap-2.5">
        <div className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          isProcessing ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
        }`}>
          <Bot className="w-4 h-4" />
        </div>

        <div>
          <h4 className="font-sans font-semibold text-xs leading-none text-slate-100 truncate flex items-center gap-1.5 w-[210px] text-left">
            {name}
          </h4>
          <p className="font-mono text-[9px] mt-1 text-slate-400 leading-tight line-clamp-1 w-[210px] text-left">
            {subLabel}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-850/80 w-fit">
            <span className={`w-1.5 h-1.5 rounded-full ${stateDotColor} shrink-0`} />
            <span className={`text-[8.5px] font-mono leading-none tracking-tight ${stateTextColor}`}>
              State: {nodeState}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/80 pt-1.5 flex items-center justify-between text-[8px] font-mono text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
            <Cpu className="w-2.5 h-2.5 text-slate-400" />
            {tier === 'gemini-3.1-pro-preview' ? 'Pro' : 'Flash'}
          </span>
          <span className="flex items-center gap-1">
            <Hammer className="w-2.5 h-2.5" />
            <span>Tools: {toolsCount}</span>
          </span>
        </div>
        <span className="text-sky-400">Inspect spec ›</span>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// XYFlow Custom Compliance Gate Node Component
// -------------------------------------------------------------
const GateCustomNode = ({ data }: any) => {
  const {
    name,
    subLabel,
    isProcessing,
    hasFailedStep,
    hasPassedStep,
    isSelected,
    nodeState,
    stateDotColor,
    stateTextColor,
    statusBadge,
    criteriaCount,
    rawNode,
  } = data;

  let borderStyle = 'border-slate-800 bg-slate-900/90 text-slate-100 hover:border-slate-700';
  let glowEffect = 'shadow-md';

  if (isProcessing) {
    borderStyle = 'border-emerald-500 bg-slate-900/95 shadow-[0_0_20px_rgba(16,185,129,0.35)] text-white';
    glowEffect = 'ring-2 ring-emerald-500';
  } else if (hasFailedStep) {
    borderStyle = 'border-rose-500 bg-slate-900/95 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]';
    glowEffect = 'animate-fail-pulse';
  } else if (hasPassedStep) {
    borderStyle = 'border-emerald-500 bg-slate-900/95 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]';
    glowEffect = 'animate-success-glow';
  } else if (isSelected) {
    borderStyle = 'border-sky-500 bg-slate-900/95 ring-1 ring-sky-500 text-white';
  }

  let auditStatusIcon = (
    <div className="absolute right-3.5 top-3.5 flex items-center justify-center p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 shadow-sm z-25">
      <ShieldCheck className="w-3.5 h-3.5 text-slate-400 fill-slate-400/20" />
    </div>
  );

  if (hasFailedStep) {
    auditStatusIcon = (
      <div className="absolute right-3.5 top-3.5 flex items-center justify-center p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 shadow-sm z-25">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
      </div>
    );
  } else if (hasPassedStep) {
    auditStatusIcon = (
      <div className="absolute right-3.5 top-3.5 flex items-center justify-center p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 shadow-sm z-25">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
      </div>
    );
  } else if (isProcessing) {
    auditStatusIcon = (
      <div className="absolute right-3.5 top-3.5 flex items-center justify-center p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 shadow-sm z-25 animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
      </div>
    );
  }

  return (
    <div 
      className={`group w-[290px] h-[116px] p-3.5 rounded-xl border flex flex-col justify-between transition-colors duration-300 relative select-none ${borderStyle} ${glowEffect}`}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-2 !h-2.5 !bg-indigo-500 !border-slate-950" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-2 !h-2.5 !bg-emerald-500 !border-slate-950" 
      />

      {statusBadge}
      {auditStatusIcon}

      {/* Informative Hover Tooltip for Compliance Gate */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[120%] w-[330px] bg-slate-950/98 border border-slate-700/60 p-3.5 rounded-xl shadow-2xl text-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 flex flex-col gap-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex flex-col text-left">
            <span className="font-sans font-extrabold text-[11px] text-slate-100 tracking-wide uppercase">Compliance Gate Summary</span>
            <span className="text-[9px] font-mono text-slate-500">ID: {rawNode?.id || 'N/A'}</span>
          </div>
          <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded ${stateDotColor?.replace('shadow-', '').replace('animate-pulse', '').replace('animate-ping', '') || 'bg-slate-650'} bg-slate-900 border border-slate-800 text-slate-200 font-bold uppercase tracking-tight`}>
            {nodeState}
          </span>
        </div>

        <div className="text-left font-sans text-[11px] space-y-2">
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wide">Assigned Auditor Profile</span>
            <p className="text-slate-200 mt-0.5 leading-relaxed text-[11px] flex items-center gap-1.5 font-medium">
              <span className="inline-block w-2 h-2 rounded bg-indigo-500" />
              Reviewed by: <strong className="text-indigo-400 font-mono text-[10.5px]">{rawNode?.reviewerAgentId || 'N/A'}</strong>
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wide mb-1">Verification Guidelines & Criteria</span>
            <ul className="space-y-1 bg-slate-900 p-2 rounded-xl border border-slate-850">
              {rawNode?.criteria && rawNode.criteria.length > 0 ? (
                rawNode.criteria.map((crt: string, index: number) => (
                  <li key={index} className="text-[9.5px] text-slate-300 font-mono flex items-start gap-1.5 leading-tight">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>{crt}</span>
                  </li>
                ))
              ) : (
                <li className="text-[9.5px] text-slate-500 font-mono">Default validation standard</li>
              )}
            </ul>
          </div>

          {rawNode?.feedbackProtocol && (
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wide">Feedback routing strategy</span>
              <p className="text-rose-400 mt-0.5 font-mono text-[9px] leading-relaxed bg-slate-900/50 px-2 py-1 rounded border border-rose-950/20">
                ⚠️ Rejection protocol: {rawNode.feedbackProtocol}
              </p>
            </div>
          )}
        </div>

        <p className="text-[8.5px] font-mono text-slate-500 mt-1 border-t border-slate-850 pt-1.5 text-center leading-none">
          Click node to review full gate assertions in the right panel.
        </p>
      </div>

      <div className="flex items-start gap-2.5">
        <div className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          isProcessing ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-800 text-slate-400'
        }`}>
          <ShieldCheck className="w-4 h-4" />
        </div>

        <div className="pr-9 overflow-hidden">
          <h4 className="font-sans font-semibold text-xs leading-none text-slate-100 truncate flex items-center gap-1.5 w-[170px] text-left">
            {name}
          </h4>
          <p className="font-mono text-[9px] mt-1 text-slate-400 leading-tight line-clamp-1 w-[170px] text-left">
            {subLabel}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-850/80 w-fit">
            <span className={`w-1.5 h-1.5 rounded-full ${stateDotColor} shrink-0`} />
            <span className={`text-[8.5px] font-mono leading-none tracking-tight ${stateTextColor}`}>
              State: {nodeState}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/80 pt-1.5 flex items-center justify-between text-[8px] font-mono text-slate-500">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-amber-500/70" />
          <span>Validation Criteria: {criteriaCount} items</span>
        </div>
        <span className="text-sky-400">Inspect spec ›</span>
      </div>
    </div>
  );
};

const nodeTypes = {
  agent: AgentCustomNode,
  gate: GateCustomNode,
};

// Helper function to layout initial node coordinates dynamically matching our 1000x500 schema
const getInitialNodes = (system: MultiAgentSystem): Node[] => {
  const agents = system.agents;
  const gates = system.gates;
  const initialNodes: Node[] = [];

  agents.forEach((agent, idx) => {
    let x = 150;
    let y = 250;

    if (agents.length >= 6) {
      x = 75 + idx * (850 / (agents.length - 1));
      y = idx % 2 === 0 ? 210 : 290;
    } else {
      if (idx === 0) {
        x = 140;
        y = 250;
      } else if (idx === agents.length - 1 && agents.length > 2) {
        x = 900;
        y = 250;
      } else {
        x = 450;
        const intermediatesCount = agents.length - (agents.length > 2 ? 2 : 1);
        if (intermediatesCount === 1) {
          y = 250;
        } else {
          const activeIdx = idx - 1;
          y = 120 + activeIdx * (260 / (intermediatesCount - 1 || 1));
        }
      }
    }

    // Since our SVG mapping aligned centers and custom CSS translated nodes,
    // top-left coordinates of the 290x116 nodes should be shifted:
    initialNodes.push({
      id: agent.id,
      type: 'agent',
      position: { x: x - 145, y: y - 58 },
      data: {
        id: agent.id,
        name: agent.name,
        subLabel: agent.role,
        tier: agent.intelligenceTier,
        toolsCount: agent.tools?.length || 0,
        rawNode: agent,
        // Simulation details map dynamically
        isProcessing: false,
        hasFailedStep: false,
        hasPassedStep: false,
        isSelected: false,
        nodeState: 'Idle',
        stateDotColor: 'bg-slate-600',
        stateTextColor: 'text-slate-500',
        statusBadge: null,
        successes: 0,
        failures: 0,
        healthPercent: 100,
      }
    });
  });

  gates.forEach((gate, idx) => {
    let x = 700;
    let y = 250 + idx * 100;

    if (agents.length >= 6) {
      x = 630;
      y = 90;
    }

    initialNodes.push({
      id: gate.id,
      type: 'gate',
      position: { x: x - 145, y: y - 58 },
      data: {
        id: gate.id,
        name: gate.name,
        subLabel: `Gate Auditor (${gate.reviewerAgentId})`,
        criteriaCount: gate.criteria?.length || 0,
        rawNode: gate,
        isProcessing: false,
        hasFailedStep: false,
        hasPassedStep: false,
        isSelected: false,
        nodeState: 'Idle',
        stateDotColor: 'bg-slate-600',
        stateTextColor: 'text-slate-500',
        statusBadge: null,
        successes: 0,
        failures: 0,
        healthPercent: 100,
      }
    });
  });

  return initialNodes;
};

const getInitialEdges = (system: MultiAgentSystem): Edge[] => {
  return system.edges.map(edge => {
    return {
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      label: edge.label,
      type: 'bezier',
      animated: false,
      style: {
        stroke: '#334155',
        strokeWidth: 1.5,
      },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.95, stroke: '#1e293b', strokeWidth: 1 },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
      labelStyle: { fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }
    };
  });
};

export const FlowchartVisualizer: React.FC<FlowchartVisualizerProps> = ({
  system,
  activeNodeId,
  selectedNodeId,
  onSelectNode,
  simulationPhase,
  simulatedLogsPlayed
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Trigger D3-based force-directed layout
  const handleAutoLayout = () => {
    if (nodes.length === 0) return;

    interface SimNode {
      id: string;
      x: number;
      y: number;
      targetX: number;
      targetY: number;
    }

    const d3Nodes: SimNode[] = nodes.map((node) => {
      let targetX = 400;
      let targetY = 250;

      const isGate = node.type === 'gate';
      const agentIdx = system.agents.findIndex(a => a.id === node.id);

      if (isGate) {
        targetX = 750;
        targetY = 250 + (system.gates.findIndex(g => g.id === node.id) * 120);
      } else if (agentIdx === 0) {
        targetX = 100;
        targetY = 250;
      } else if (agentIdx === system.agents.length - 1) {
        targetX = 550;
        targetY = 250;
      } else {
        targetX = 320;
        const totalMiddle = system.agents.length - 2;
        if (totalMiddle > 0) {
          const middleIdx = agentIdx - 1;
          targetY = 120 + (middleIdx * (260 / totalMiddle));
        } else {
          targetY = 250;
        }
      }

      return {
        id: node.id,
        x: node.position.x + 145, // center X coordinate
        y: node.position.y + 58,  // center Y coordinate
        targetX,
        targetY
      };
    });

    const d3Edges = edges.map(edge => ({
      source: edge.source,
      target: edge.target
    }));

    // Setup force directed simulation
    const simulation = forceSimulation<SimNode>(d3Nodes)
      .force('link', forceLink<SimNode, any>(d3Edges)
        .id(d => d.id)
        .distance(180)
        .strength(0.8)
      )
      .force('charge', forceManyBody().strength(-2400))
      .force('collide', forceCollide().radius(145).strength(0.9))
      .force('x', forceX<SimNode>().x(d => d.targetX).strength(1.2))
      .force('y', forceY<SimNode>().y(d => d.targetY).strength(0.8));

    // Run simulation tick steps statically
    for (let i = 0; i < 220; i++) {
      simulation.tick();
    }

    // Apply simulation node configurations back to state
    setNodes(prev => prev.map(node => {
      const match = d3Nodes.find(dn => dn.id === node.id);
      if (match && typeof match.x === 'number' && typeof match.y === 'number') {
        return {
          ...node,
          position: {
            x: Math.round(match.x - 145),
            y: Math.round(match.y - 58)
          }
        };
      }
      return node;
    }));
  };

  // Reset/Initialize layout when the system changes
  React.useEffect(() => {
    setSelectedNodeIdInFlow(selectedNodeId);
    setNodes(getInitialNodes(system));
    setEdges(getInitialEdges(system));
  }, [system.task, system.agents, system.gates]);

  // Synchronise outer selection state back to flow
  const setSelectedNodeIdInFlow = (id: string | null) => {
    if (!id) return;
    setNodes(prev => prev.map(n => ({
      ...n,
      data: { ...n.data, isSelected: n.id === id }
    })));
  };

  // Keep state parameters reactive without dropping manual coordinates
  React.useEffect(() => {
    setNodes(prevNodes => {
      if (prevNodes.length === 0) return prevNodes;

      return prevNodes.map(node => {
        const isSelected = selectedNodeId === node.id;
        const isProcessing = activeNodeId === node.id;
        const isGate = node.type === 'gate';

        const hasFailedStep = simulatedLogsPlayed?.some(
          (step) => step.nodeId === node.id && step.status === 'failed'
        );

        const hasPassedStep = simulatedLogsPlayed?.some(
          (step) => step.nodeId === node.id && step.status === 'success'
        );

        let nodeState: 'Idle' | 'Processing' | 'Waiting for Approval' | 'Error' = 'Idle';
        let stateDotColor = 'bg-slate-500';
        let stateTextColor = 'text-slate-400';

        const activeNode = prevNodes.find(n => n.id === activeNodeId);
        const isGateProcessing = activeNode?.type === 'gate';

        if (hasFailedStep) {
          nodeState = 'Error';
          stateDotColor = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse';
          stateTextColor = 'text-rose-400 font-extrabold';
        } else if (simulationPhase === 'running') {
          if (isProcessing) {
            if (isGate) {
              nodeState = 'Waiting for Approval';
              stateDotColor = 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse';
              stateTextColor = 'text-amber-400 font-extrabold';
            } else {
              nodeState = 'Processing';
              stateDotColor = 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-ping';
              stateTextColor = 'text-emerald-400 font-extrabold animate-pulse';
            }
          } else if (!isGate && isGateProcessing && hasPassedStep) {
            nodeState = 'Waiting for Approval';
            stateDotColor = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse';
            stateTextColor = 'text-amber-400 font-bold';
          } else if (hasPassedStep) {
            nodeState = 'Idle';
            stateDotColor = 'bg-emerald-500/60';
            stateTextColor = 'text-slate-300';
          } else {
            nodeState = 'Idle';
            stateDotColor = 'bg-slate-600';
            stateTextColor = 'text-slate-500';
          }
        } else {
          nodeState = 'Idle';
          stateDotColor = 'bg-slate-600';
          stateTextColor = 'text-slate-500';
        }

        let statusBadge = null;
        if (isProcessing) {
          statusBadge = (
            <span className="absolute -top-2 -right-2 bg-emerald-500 text-slate-950 font-bold text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 animate-pulse shadow-lg select-none z-30">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping inline-block" />
              Active
            </span>
          );
        } else if (hasFailedStep) {
          statusBadge = (
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white font-bold text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg select-none z-30">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
              Audit Failed
            </span>
          );
        } else if (hasPassedStep) {
          statusBadge = (
            <span className="absolute -top-2 -right-2 bg-emerald-500 text-slate-950 font-bold text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg select-none z-30">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping inline-block" />
              Audit Passed
            </span>
          );
        }

        const nodeLogs = simulatedLogsPlayed?.filter(
          (step) => step.nodeId === node.id
        ) || [];

        const successCount = nodeLogs.filter(log => log.status === 'success').length;
        const failureCount = nodeLogs.filter(log => log.status === 'failed').length;
        const totalEvaluated = successCount + failureCount;
        const nodeHealthPercent = totalEvaluated > 0 ? Math.round((successCount / totalEvaluated) * 100) : 100;

        return {
          ...node,
          data: {
            ...node.data,
            isProcessing,
            hasFailedStep,
            hasPassedStep,
            isSelected,
            nodeState,
            stateDotColor,
            stateTextColor,
            statusBadge,
            successes: successCount,
            failures: failureCount,
            healthPercent: nodeHealthPercent,
          }
        };
      });
    });
  }, [activeNodeId, simulationPhase, selectedNodeId, simulatedLogsPlayed]);

  // Handle dynamic style update on edges
  React.useEffect(() => {
    setEdges(prevEdges => {
      return prevEdges.map(edge => {
        const isActive = activeNodeId === edge.source || activeNodeId === edge.target;
        const rawEdge = system.edges.find(e => e.id === edge.id);
        const type = rawEdge?.type || 'standard';

        let strokeColor = '#334155';
        let strokeWidth = 1.5;
        let animated = false;

        if (type === 'validation_fail' || type === 'feedback_loop') {
          strokeColor = '#e11d48';
          strokeWidth = 2;
        } else if (type === 'validation_pass') {
          strokeColor = '#10b981';
          strokeWidth = 2;
          animated = true;
        } else if (isActive) {
          strokeColor = '#10b981';
          strokeWidth = 2.5;
          animated = true;
        }

        return {
          ...edge,
          animated,
          style: {
            stroke: strokeColor,
            strokeWidth,
            strokeDasharray: (type === 'validation_fail' || type === 'feedback_loop') ? '5,4' : undefined,
          },
          labelStyle: { fill: strokeColor, fontSize: 8.5, fontFamily: 'monospace', fontWeight: 'bold' }
        };
      });
    });
  }, [activeNodeId, system.edges, nodes]);

  return (
    <div className="w-full relative select-none">
      {/* Visual Canvas containing Graph visualizers */}
      <div className="relative h-[500px] w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        
        {/* Upper Lane Info Labels */}
        <div className="absolute top-4 left-4 flex gap-4 text-xs font-mono text-slate-400 pointer-events-none z-20">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-700 block" /> Ingest Strategy</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-700 block" /> Active Synthesis</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-700 block" /> Compliance Gate</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-700 block" /> Release DevOps</div>
        </div>

        {/* Dynamic Layout Control Panel */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {/* Dynamic D3 Force-Directed Auto-Layout Button */}
          <button
            onClick={handleAutoLayout}
            className="bg-indigo-600/90 hover:bg-indigo-600 border border-indigo-500 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider text-white hover:shadow-indigo-500/20 active:scale-95 cursor-pointer select-none transition-all shadow-lg flex items-center gap-1.5"
            title="Automatically organize nodes using D3 force-directed algorithm to minimize crossing edges"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-200 animate-pulse" />
            <span>Auto-Layout</span>
          </button>

          {/* Dynamic Reset Layout Button */}
          <button
            onClick={() => {
              setNodes(getInitialNodes(system));
            }}
            className="bg-slate-900/90 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-white active:scale-95 cursor-pointer select-none transition-all shadow-lg flex items-center gap-1.5"
            title="Reset back to standard coordinate positioning"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Layout</span>
          </button>
        </div>

        {/* ReactFlow Interactive Canvas */}
        <div className="w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => {
              onSelectNode({ id: node.id, type: node.type as 'agent' | 'gate' });
            }}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
            className="w-full h-full"
          >
            <Background color="#1e293b" gap={32} size={1} />
            <Controls className="!bg-slate-900 !border-slate-800 !text-white !rounded-xl" />
          </ReactFlow>
        </div>

      </div>
    </div>
  );
};
