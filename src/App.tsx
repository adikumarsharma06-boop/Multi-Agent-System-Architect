import { useState, useEffect, useMemo, useRef, KeyboardEvent } from 'react';
import { MultiAgentSystem, SimulationStepLog, TemplateWorkflow } from './types';
import { TEMPLATES, SAMPLE_SIMULATIONS } from './templates';
import { FlowchartVisualizer } from './components/FlowchartVisualizer';
import { SpecificationDrawer } from './components/SpecificationDrawer';
import { ProjectBlueprintHub } from './components/ProjectBlueprintHub';
import { AgentPerformanceCharts } from './components/AgentPerformanceCharts';
import { ScorecardHeatmap } from './components/ScorecardHeatmap';
import { UserAccountAuth } from './components/UserAccountAuth';
import { SavedProjectsDashboard } from './components/SavedProjectsDashboard';
import { TeamWorkspaceDashboard } from './components/TeamWorkspaceDashboard';
import { SecureAuthWall } from './components/SecureAuthWall';
import { SystemBootloader } from './components/SystemBootloader';
import { LeadArchitectIntro } from './components/LeadArchitectIntro';
import { PremiumUnlockAuraModal } from './components/PremiumUnlockAuraModal';
import { HomeUtilitiesSuite } from './components/HomeUtilitiesSuite';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  ShieldCheck,
  Layers,
  Settings,
  Play,
  Sparkles,
  RefreshCw,
  FileCode,
  AlertTriangle,
  Cpu,
  BookOpen,
  Terminal,
  RotateCcw,
  PlusCircle,
  Crown,
  Clock,
  Copy,
  Check,
  ChevronRight,
  Sliders,
  Maximize2,
  TrendingUp,
  Server,
  Search,
  Filter,
  X
} from 'lucide-react';

export default function App() {
  // Application State
  const [isBooting, setIsBooting] = useState<boolean>(true);
  const [showArchitectIntro, setShowArchitectIntro] = useState<boolean>(false);
  const [isWorkspaceActive, setIsWorkspaceActive] = useState<boolean>(() => {
    return localStorage.getItem('ares_workspace_active') === 'true';
  });
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(() => {
    const saved = localStorage.getItem('ares_selected_template_index');
    if (saved) {
      const idx = parseInt(saved, 10);
      if (idx >= 0 && idx < TEMPLATES.length) {
        return idx;
      }
    }
    return 0;
  });
  const [customTaskQuery, setCustomTaskQuery] = useState<string>(() => {
    return localStorage.getItem('ares_custom_task_query') || '';
  });
  const [customInputText, setCustomInputText] = useState<string>(() => {
    return localStorage.getItem('ares_custom_input_text') || 'Build a 3D animation platform.';
  });
  const [activeWorkflow, setActiveWorkflow] = useState<MultiAgentSystem>(() => {
    try {
      const saved = localStorage.getItem('ares_active_workflow');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse active workflow from localStorage', e);
    }
    const savedIndex = localStorage.getItem('ares_selected_template_index');
    if (savedIndex) {
      const idx = parseInt(savedIndex, 10);
      if (idx >= 0 && idx < TEMPLATES.length) {
        return TEMPLATES[idx].system;
      }
    }
    return TEMPLATES[0].system;
  });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');

  const saveToLocalStorage = (
    w: MultiAgentSystem,
    q: string,
    idx: number,
    input: string,
    isWActive: boolean
  ) => {
    try {
      localStorage.setItem('ares_custom_task_query', q);
      localStorage.setItem('ares_active_workflow', JSON.stringify(w));
      localStorage.setItem('ares_custom_input_text', input);
      localStorage.setItem('ares_workspace_active', isWActive ? 'true' : 'false');
      localStorage.setItem('ares_selected_template_index', idx.toString());
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  };

  // Failure & Sizing Configs
  const [retryBudget, setRetryBudget] = useState<number>(3);
  const [concurrencyEnabled, setConcurrencyEnabled] = useState<boolean>(true);
  const [selectedLanguageTab, setSelectedLanguageTab] = useState<'python' | 'typescript'>('python');

  // UI Tabs & Inspectors
  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState<'flowchart' | 'project_blueprint' | 'performance' | 'blueprint' | 'code' | 'projects' | 'team_workspace'>('flowchart');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('sys_planner');
  const [selectedNodeType, setSelectedNodeType] = useState<'agent' | 'gate' | null>('agent');

  // API Call Trackers
  const [isDesigning, setIsDesigning] = useState<boolean>(false);
  const [designError, setDesignError] = useState<string | null>(null);
  const [designProgressIndex, setDesignProgressIndex] = useState<number>(0);

  // Dynamic Zero-Trust Authentication watcher
  const [hasAuthToken, setHasAuthToken] = useState<boolean>(() => {
    return !!localStorage.getItem('ares_auth_token') || localStorage.getItem('ares_auth_bypass') === 'true';
  });
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'team'>('free');
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState<'pro' | 'team' | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  const getRemainingTimeText = (expiresAt?: string | null) => {
    if (!expiresAt) return '';
    const expiry = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    const diff = expiry - now;
    if (diff <= 0) {
      return 'Expired';
    }
    const mins = Math.floor(diff / 60000);
    if (mins < 60) {
      return `${mins} minutes left`;
    }
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) {
      return `${hours} hours left`;
    }
    const days = Math.floor(diff / 86450000);
    return `${days} days left`;
  };

  const isPremiumExpiringSoon = useMemo(() => {
    if (!planExpiresAt || userPlan === 'free') return false;
    const expiry = new Date(planExpiresAt).getTime();
    const now = new Date().getTime();
    const diff = expiry - now;
    if (diff <= 0) return false;
    // Expiring in less than 3 days, OR less than 5 minutes for simulators
    return diff < 3 * 86400000 || diff < 5 * 60000;
  }, [planExpiresAt, userPlan]);

  const premiumStyles = useMemo(() => {
    if (userPlan === 'team') {
      return {
        accentBorder: 'border-b-2 border-amber-400 shadow-[0_4px_12px_rgba(245,158,11,0.25)]',
        accentBg: 'bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900',
        workspaceBadge: '🏆 TEAM ENTERPRISE WORKSPACE',
        accentText: 'text-amber-400 font-bold',
        boldClass: 'font-medium tracking-wide select-none',
        cardBg: 'bg-amber-50/5 border-amber-300/30'
      };
    } else if (userPlan === 'pro') {
      return {
        accentBorder: 'border-b-2 border-indigo-400 shadow-[0_4px_12px_rgba(99,102,241,0.25)]',
        accentBg: 'bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900',
        workspaceBadge: '👑 PRO CREATOR WORKSPACE',
        accentText: 'text-indigo-400 font-bold',
        boldClass: 'font-medium tracking-wide select-none',
        cardBg: 'bg-indigo-50/5 border-indigo-300/30'
      };
    } else {
      return {
        accentBorder: 'border-b border-slate-200/90',
        accentBg: 'bg-slate-50',
        workspaceBadge: 'FREE WORKSPACE',
        accentText: 'text-slate-500',
        boldClass: '',
        cardBg: 'bg-white border-slate-200/90'
      };
    }
  }, [userPlan]);

  useEffect(() => {
    const fetchUserAndPlan = async () => {
      const token = localStorage.getItem('ares_auth_token');
      if (!token) {
        setUserPlan('free');
        setPlanExpiresAt(null);
        setUserEmail('');
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserPlan(data.user?.plan || 'free');
          setPlanExpiresAt(data.user?.planExpiresAt || null);
          setUserEmail(data.user?.email || '');
        } else {
          setUserPlan('free');
          setPlanExpiresAt(null);
          setUserEmail('');
        }
      } catch (err) {
        console.error('Failed fetching user plan inside App', err);
      }
    };

    fetchUserAndPlan();
    
    // Listen to custom notification states
    const handlePlanUpdate = (e: any) => {
      if (e.detail?.plan) {
        setUserPlan(e.detail.plan);
      }
      if (e.detail?.planExpiresAt !== undefined) {
        setPlanExpiresAt(e.detail.planExpiresAt);
      }
    };

    const handleUnlockTrigger = (e: any) => {
      if (e.detail?.plan && (e.detail.plan === 'pro' || e.detail.plan === 'team')) {
        setShowUnlockAnimation(e.detail.plan);
      }
    };

    window.addEventListener('ares-user-plan-updated', handlePlanUpdate);
    window.addEventListener('ares-trigger-unlock-animation', handleUnlockTrigger);
    window.addEventListener('ares-auth-changed', fetchUserAndPlan);
    
    return () => {
      window.removeEventListener('ares-user-plan-updated', handlePlanUpdate);
      window.removeEventListener('ares-trigger-unlock-animation', handleUnlockTrigger);
      window.removeEventListener('ares-auth-changed', fetchUserAndPlan);
    };
  }, [hasAuthToken]);

  useEffect(() => {
    const checkToken = () => {
      setHasAuthToken(!!localStorage.getItem('ares_auth_token') || localStorage.getItem('ares_auth_bypass') === 'true');
    };
    window.addEventListener('ares-auth-changed', checkToken);
    const interval = setInterval(checkToken, 2000);
    return () => {
      window.removeEventListener('ares-auth-changed', checkToken);
      clearInterval(interval);
    };
  }, []);

  // Periodic Autosave effect to protect against unexpected reloads
  useEffect(() => {
    if (!isWorkspaceActive) return;

    const interval = setInterval(() => {
      setSaveStatus('saving');
      try {
        localStorage.setItem('ares_custom_task_query', customTaskQuery);
        localStorage.setItem('ares_active_workflow', JSON.stringify(activeWorkflow));
        localStorage.setItem('ares_custom_input_text', customInputText);
        localStorage.setItem('ares_workspace_active', 'true');
        localStorage.setItem('ares_selected_template_index', selectedTemplateIndex.toString());
        setTimeout(() => {
          setSaveStatus('saved');
        }, 850);
      } catch (err) {
        console.error('Autosave error', err);
        setSaveStatus('idle');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isWorkspaceActive, customTaskQuery, activeWorkflow, customInputText, selectedTemplateIndex]);

  // Stepper loop for synthesis simulation
  useEffect(() => {
    let interval: any = null;
    if (isDesigning) {
      setDesignProgressIndex(0);
      interval = setInterval(() => {
        setDesignProgressIndex((prev) => {
          if (prev < 4) return prev + 1;
          return prev;
        });
      }, 750);
    } else {
      setDesignProgressIndex(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDesigning]);

  // Simulation Running State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationSteps, setSimulationSteps] = useState<SimulationStepLog[]>([]);
  const [simulatedLogsPlayed, setSimulatedLogsPlayed] = useState<SimulationStepLog[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [simulationIntervalMs, setSimulationIntervalMs] = useState<number>(1800);
  const [simulationSuccessStatus, setSimulationSuccessStatus] = useState<'running' | 'success' | 'failed' | 'idle'>('idle');

  // Sensitivity Analysis State
  const [isSensitivityActive, setIsSensitivityActive] = useState<boolean>(false);
  const [perturbationType, setPerturbationType] = useState<'jitter' | 'extreme' | 'empty'>('jitter');
  const [sensitivityPhase, setSensitivityPhase] = useState<'idle' | 'baseline' | 'transition' | 'perturbed' | 'complete'>('idle');
  const [baselineLogs, setBaselineLogs] = useState<SimulationStepLog[]>([]);
  const [perturbedLogs, setPerturbedLogs] = useState<SimulationStepLog[]>([]);
  const [perturbedInputText, setPerturbedInputText] = useState<string>('');
  const [terminalTab, setTerminalTab] = useState<'baseline' | 'perturbed' | 'scorecard'>('baseline');

  const baselineTokens = useMemo(() => baselineLogs.reduce((acc, step) => acc + (step.tokensUsed || 0), 0), [baselineLogs]);
  const baselineCost = useMemo(() => baselineLogs.reduce((acc, step) => acc + (step.simulatedCost || 0), 0), [baselineLogs]);
  const baselineGateRetries = useMemo(() => baselineLogs.filter(step => step.nodeType === 'gate' && step.status === 'failed').length, [baselineLogs]);

  const perturbedTokens = useMemo(() => perturbedLogs.reduce((acc, step) => acc + (step.tokensUsed || 0), 0), [perturbedLogs]);
  const perturbedCost = useMemo(() => perturbedLogs.reduce((acc, step) => acc + (step.simulatedCost || 0), 0), [perturbedLogs]);
  const perturbedGateRetries = useMemo(() => perturbedLogs.filter(step => step.nodeType === 'gate' && step.status === 'failed').length, [perturbedLogs]);

  const logsToDisplay = useMemo(() => {
    if (!isSensitivityActive) return simulatedLogsPlayed;
    if (terminalTab === 'baseline') {
      return (sensitivityPhase === 'baseline' || sensitivityPhase === 'transition') ? simulatedLogsPlayed : baselineLogs;
    }
    if (terminalTab === 'perturbed') {
      return sensitivityPhase === 'perturbed' ? simulatedLogsPlayed : perturbedLogs;
    }
    return [];
  }, [isSensitivityActive, terminalTab, sensitivityPhase, simulatedLogsPlayed, baselineLogs, perturbedLogs]);

  // Search & Filter state for the Trace Engine terminal
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logAgentFilter, setLogAgentFilter] = useState('all');

  const uniqueNodes = useMemo(() => {
    const nodesMap = new Map<string, string>();
    logsToDisplay.forEach(log => {
      if (log.nodeId && log.nodeName) {
        nodesMap.set(log.nodeId, log.nodeName);
      }
    });
    return Array.from(nodesMap.entries()).map(([id, name]) => ({ id, name }));
  }, [logsToDisplay]);

  const filteredLogs = useMemo(() => {
    return logsToDisplay.filter(step => {
      if (logAgentFilter !== 'all' && step.nodeId !== logAgentFilter && step.nodeName !== logAgentFilter) {
        return false;
      }
      if (logSearchQuery.trim() !== '') {
        const q = logSearchQuery.toLowerCase();
        const msgMatch = (step.message || '').toLowerCase().includes(q);
        const nameMatch = (step.nodeName || '').toLowerCase().includes(q);
        const inputMatch = (step.inputReceived || '').toLowerCase().includes(q);
        const outputMatch = (step.outputProduced || '').toLowerCase().includes(q);
        const statusMatch = (step.status || '').toLowerCase().includes(q);
        const feedbackMatch = (step.feedbackNote || '').toLowerCase().includes(q);
        return msgMatch || nameMatch || inputMatch || outputMatch || statusMatch || feedbackMatch;
      }
      return true;
    });
  }, [logsToDisplay, logSearchQuery, logAgentFilter]);

  // Interactive Indicators
  const [copiedCodeText, setCopiedCodeText] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll terminal to bottom on step updates smoothly
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTo({
        top: terminalRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [simulatedLogsPlayed]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, []);

  // Sync Template Swaps
  const loadPreloadedTemplate = (idx: number) => {
    setSelectedTemplateIndex(idx);
    const tmpl = TEMPLATES[idx];
    setActiveWorkflow(tmpl.system);
    setRetryBudget(tmpl.system.failureHandling.maxRetryBudgets);
    
    // Set matching preloaded simulation sample input
    let matchingInput = '';
    if (idx === 0) {
      matchingInput = 'Build a 3D animation platform.';
    } else if (idx === 1) {
      matchingInput = 'Verify secure registration and password hashing validation.';
    } else if (idx === 2) {
      matchingInput = 'Incorporate Offshore transfer of $124,500 under digital invoice INV-9941.';
    } else if (idx === 3) {
      matchingInput = 'Craft EarthBottle campaign messaging incorporating outdoor lifestyle key terms.';
    } else {
      matchingInput = 'Verify secure registration, secure session tokens, and database encryption.';
    }
    setCustomInputText(matchingInput);

    // Default select first node
    if (tmpl.system.agents.length > 0) {
      setSelectedNodeId(tmpl.system.agents[0].id);
      setSelectedNodeType('agent');
    } else {
      setSelectedNodeId(null);
      setSelectedNodeType(null);
    }

    // Reset Simulation
    resetSimulationState();
    triggerNotice(`Loaded template: ${tmpl.name}`);

    // Immediately save to prevent data loss on instantaneous refresh
    saveToLocalStorage(tmpl.system, customTaskQuery, idx, matchingInput, isWorkspaceActive);
  };

  const startWithTemplate = (idx: number) => {
    loadPreloadedTemplate(idx);
    setIsWorkspaceActive(true);
    setShowArchitectIntro(true);
  };

  const startWithCustomIdea = (idea: string) => {
    const trimmed = idea.trim();
    if (!trimmed) return;
    setCustomTaskQuery(trimmed);
    setCustomInputText(trimmed);
    setIsWorkspaceActive(true);
    setShowArchitectIntro(true);
    triggerNotice('Workspace activated for custom project idea!');

    // Immediately save
    saveToLocalStorage(activeWorkflow, trimmed, selectedTemplateIndex, trimmed, true);
  };

  const handleLoadProjectFromDashboard = (project: { id: string; title: string; description: string }, output: MultiAgentSystem) => {
    if (!project) return;
    setCustomTaskQuery(project.title);
    setCustomInputText(project.title);
    if (output) {
      setActiveWorkflow(output);
      setRetryBudget(output.failureHandling?.maxRetryBudgets ?? 3);
      if (output.agents && output.agents.length > 0) {
        setSelectedNodeId(output.agents[0].id);
        setSelectedNodeType('agent');
      }
    }
    setIsWorkspaceActive(true);

    // Immediately save loaded project
    if (output) {
      saveToLocalStorage(output, project.title, selectedTemplateIndex, project.title, true);
    }
  };

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Restores Simulation logs
  const resetSimulationState = () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setIsSimulating(false);
    setSimulatedLogsPlayed([]);
    setCurrentStepIndex(-1);
    setSimulationSuccessStatus('idle');
    setSensitivityPhase('idle');
    setBaselineLogs([]);
    setPerturbedLogs([]);
    setPerturbedInputText('');
    setTerminalTab('baseline');
  };

  // Live design compilation utilizing server-side endpoint
  const compileCustomArchitectureSpec = async () => {
    if (!customTaskQuery.trim()) {
      setDesignError('A brief task description is required to compose custom multi-agent structures.');
      return;
    }

    if (userPlan === 'free') {
      triggerNotice("⚙️ Bespoke AI system synthesis is a Premium feature. Please upgrade your plan to unlock!");
      window.dispatchEvent(new CustomEvent('ares-open-plans-drawer'));
      return;
    }

    setIsDesigning(true);
    setDesignError(null);
    resetSimulationState();

    try {
      const token = localStorage.getItem('ares_auth_token');
      const response = await fetch('/api/architect/design', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ taskDescription: customTaskQuery }),
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed system generation.');
      }

      const designedSystem: MultiAgentSystem = await response.json();
      
      // Update our workflow specs
      setActiveWorkflow(designedSystem);
      setRetryBudget(designedSystem.failureHandling.maxRetryBudgets);
      
      // Select first node
      if (designedSystem.agents.length > 0) {
        setSelectedNodeId(designedSystem.agents[0].id);
        setSelectedNodeType('agent');
      }

      triggerNotice('Successfully generated bespoke Multi-Agent specification!');
    } catch (err: any) {
      console.error(err);
      setDesignError(err.message || 'Connecting server failed. Ensure Gemini SDK credentials exist in Secrets tab.');
    } finally {
      setIsDesigning(false);
    }
  };

  // Purely client-side synthetic trace generator under custom perturbation stresses
  const generatePerturbedSyntheticSteps = (sys: MultiAgentSystem, input: string, type: 'jitter' | 'extreme' | 'empty'): SimulationStepLog[] => {
    const trace: SimulationStepLog[] = [];
    const ts = () => new Date().toLocaleTimeString();

    if (type === 'jitter') {
      const firstAgent = sys.agents[0];
      if (firstAgent) {
        trace.push({
          timestamp: ts(),
          nodeId: firstAgent.id,
          nodeName: firstAgent.name,
          nodeType: 'agent',
          status: 'success',
          message: `⚠️ [Jitter Detected] Normalizing unexpected formatting & terminal command-line noise. Bypassing non-fatal checksum anomalies safely.`,
          inputReceived: input,
          outputProduced: `Ingested task sanitized. Extracted essential workflow target details.`,
          tokensUsed: 1350,
          simulatedCost: 0.0021
        });
      }

      const secondAgent = sys.agents[1] || firstAgent;
      if (secondAgent) {
        trace.push({
          timestamp: ts(),
          nodeId: secondAgent.id,
          nodeName: secondAgent.name,
          nodeType: 'agent',
          status: 'success',
          message: `Synthesizing codebase while embedding strict runtime assertions to guard against input noise.`,
          inputReceived: `Sanitized edge conditions`,
          outputProduced: `High-Integrity Output Block with embedded exception handlers.`,
          tokensUsed: 1820,
          simulatedCost: 0.0028
        });
      }

      const gateNode = sys.gates[0];
      if (gateNode) {
        trace.push({
          timestamp: ts(),
          nodeId: gateNode.id,
          nodeName: gateNode.name,
          nodeType: 'gate',
          status: 'failed',
          message: `🔍 Audit Gate parsing inputs. Found non-standard compiler annotations under jitter input stress.`,
          inputReceived: `High-Integrity Output Block`,
          outputProduced: `Audit Status: REJECTED (Non-standard warning flags)`,
          feedbackNote: `Remediation Directive: Code meets core checklist, but has debug warnings flag present. Strip '--bypass-certs' signatures to preserve zero-trust integrity.`,
          tokensUsed: 1100,
          simulatedCost: 0.0016
        });

        if (secondAgent) {
          trace.push({
            timestamp: ts(),
            nodeId: secondAgent.id,
            nodeName: secondAgent.name,
            nodeType: 'agent',
            status: 'success',
            message: `Fixing security signature anomalies. Securing the transport layers as instructed.`,
            inputReceived: `Directive: strip --bypass-certs`,
            outputProduced: `Production-ready sanitized block.`,
            tokensUsed: 1480,
            simulatedCost: 0.0022
          });
        }

        trace.push({
          timestamp: ts(),
          nodeId: gateNode.id,
          nodeName: gateNode.name,
          nodeType: 'gate',
          status: 'success',
          message: `Re-evaluating security audit constraints. Zero-trust validation PASS.`,
          inputReceived: `Production-ready sanitized block`,
          outputProduced: `Security criteria fully satisfied under jitter strain.`,
          tokensUsed: 980,
          simulatedCost: 0.0015
        });
      }

      const finalAgent = sys.agents[sys.agents.length - 1];
      if (finalAgent && secondAgent && finalAgent.id !== secondAgent.id) {
        trace.push({
          timestamp: ts(),
          nodeId: finalAgent.id,
          nodeName: finalAgent.name,
          nodeType: 'agent',
          status: 'success',
          message: `Packaging final build artifacts. Pipeline robustly recovered from input perturbation!`,
          inputReceived: `Clean verified files`,
          outputProduced: `Artifact deployed securely.`,
          tokensUsed: 1250,
          simulatedCost: 0.0019
        });
      }
    } else if (type === 'extreme') {
      const firstAgent = sys.agents[0];
      if (firstAgent) {
        trace.push({
          timestamp: ts(),
          nodeId: firstAgent.id,
          nodeName: firstAgent.name,
          nodeType: 'agent',
          status: 'success',
          message: `⚡ [High-Volume Input Stress] Unpacking massive context payload (${input.length} characters). Prompt caching optimization triggered to reduce latency.`,
          inputReceived: input.substring(0, 300) + '... (truncated)',
          outputProduced: `Context summary formulated. Redundancies compiled down into streamlined specifications.`,
          tokensUsed: 4800,
          simulatedCost: 0.0072
        });
      }

      const secondAgent = sys.agents[1] || firstAgent;
      if (secondAgent) {
        trace.push({
          timestamp: ts(),
          nodeId: secondAgent.id,
          nodeName: secondAgent.name,
          nodeType: 'agent',
          status: 'success',
          message: `Generating complete specifications utilizing robust template compression rules.`,
          inputReceived: `Compressed instructions`,
          outputProduced: `Exhaustive code draft addressing full volume specifications.`,
          tokensUsed: 5200,
          simulatedCost: 0.0078
        });
      }

      const gateNode = sys.gates[0];
      if (gateNode) {
        trace.push({
          timestamp: ts(),
          nodeId: gateNode.id,
          nodeName: gateNode.name,
          nodeType: 'gate',
          status: 'success',
          message: `🔍 Evaluating draft specifications against multi-tier checklist. Massive scale checks outline PASS. No feedback loop loopback required.`,
          inputReceived: `Exhaustive code draft`,
          outputProduced: `Scale and performance metrics certified.`,
          tokensUsed: 3100,
          simulatedCost: 0.0046
        });
      }

      const finalAgent = sys.agents[sys.agents.length - 1];
      if (finalAgent && secondAgent && finalAgent.id !== secondAgent.id) {
        trace.push({
          timestamp: ts(),
          nodeId: finalAgent.id,
          nodeName: finalAgent.name,
          nodeType: 'agent',
          status: 'success',
          message: `Final continuous-integration pipeline wrap-up. Output size stable. Deployment complete.`,
          inputReceived: `Certified specifications`,
          outputProduced: `Enterprise deployment successful.`,
          tokensUsed: 3800,
          simulatedCost: 0.0057
        });
      }
    } else { // empty
      const firstAgent = sys.agents[0];
      if (firstAgent) {
        trace.push({
          timestamp: ts(),
          nodeId: firstAgent.id,
          nodeName: firstAgent.name,
          nodeType: 'agent',
          status: 'success',
          message: `⚠️ [Depleted Input Stress] Ingest layer received empty/generic directive. Activating fallback fail-safe defaults to preserve operation.`,
          inputReceived: input,
          outputProduced: `Instantiated standard fail-safe pipeline contract specifications.`,
          tokensUsed: 620,
          simulatedCost: 0.0009
        });
      }

      const secondAgent = sys.agents[1] || firstAgent;
      if (secondAgent) {
        trace.push({
          timestamp: ts(),
          nodeId: secondAgent.id,
          nodeName: secondAgent.name,
          nodeType: 'agent',
          status: 'success',
          message: `Synthesizing minimum viable specifications following zero-input fallback templates.`,
          inputReceived: `Standard fallback specs`,
          outputProduced: `Standard spec boilerplate formulated.`,
          tokensUsed: 950,
          simulatedCost: 0.0014
        });
      }

      const gateNode = sys.gates[0];
      if (gateNode) {
        trace.push({
          timestamp: ts(),
          nodeId: gateNode.id,
          nodeName: gateNode.name,
          nodeType: 'gate',
          status: 'success',
          message: `🔍 Audit Gate assessing boilerplate safety compliance. Boilerplates verified as structurally secure.`,
          inputReceived: `Fallback boilerplate`,
          outputProduced: `Safe default checks: OK.`,
          tokensUsed: 680,
          simulatedCost: 0.0010
        });
      }

      const finalAgent = sys.agents[sys.agents.length - 1];
      if (finalAgent && secondAgent && finalAgent.id !== secondAgent.id) {
        trace.push({
          timestamp: ts(),
          nodeId: finalAgent.id,
          nodeName: finalAgent.name,
          nodeType: 'agent',
          status: 'success',
          message: `Completing minimal deployment lifecycle cleanly.`,
          inputReceived: `Boilerplate checked`,
          outputProduced: `Minimal viable stack deployed as fail-safe default.`,
          tokensUsed: 800,
          simulatedCost: 0.0012
        });
      }
    }

    return trace;
  };

  // Triggers workflow simulation stepper
  const launchActiveSimulation = async () => {
    // Check if free user tries to simulate raw custom systems or custom inputs
    const activeTemplate = TEMPLATES[selectedTemplateIndex];
    const isStandardPreload = activeTemplate && JSON.stringify(activeWorkflow) === JSON.stringify(activeTemplate.system);
    const matchesDefaultInput = 
      (selectedTemplateIndex === 0 && customInputText.toLowerCase().includes('animation')) ||
      (selectedTemplateIndex === 1 && customInputText.includes('registration')) ||
      (selectedTemplateIndex === 2 && customInputText.includes('Offshore')) ||
      (selectedTemplateIndex === 3 && customInputText.includes('EarthBottle')) ||
      (selectedTemplateIndex === 4 && customInputText.includes('registration'));

    if (userPlan === 'free' && (!isStandardPreload || !matchesDefaultInput)) {
      triggerNotice("⚙️ Custom pipeline simulation & dynamic trace generation require a premium Pro or Team Plan!");
      window.dispatchEvent(new CustomEvent('ares-open-plans-drawer'));
      return;
    }

    resetSimulationState();
    setIsSimulating(true);
    setSimulationSuccessStatus('running');
    setTerminalTab('baseline');

    const getStepsForInput = async (inputText: string): Promise<SimulationStepLog[]> => {
      let stepsToPlay: SimulationStepLog[] = [];
      if (isStandardPreload && matchesDefaultInput && inputText === customInputText && SAMPLE_SIMULATIONS[activeTemplate.name]) {
        stepsToPlay = SAMPLE_SIMULATIONS[activeTemplate.name].steps.map(step => ({
          ...step,
          timestamp: new Date().toLocaleTimeString(),
          tokensUsed: step.tokensUsed || Math.floor(Math.random() * 800) + 700,
          simulatedCost: step.simulatedCost || parseFloat((Math.random() * 0.003 + 0.001).toFixed(4))
        }));
      } else {
        try {
          const token = localStorage.getItem('ares_auth_token');
          const response = await fetch('/api/architect/simulate', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              system: activeWorkflow,
              sampleInput: inputText
            }),
          });
          if (!response.ok) throw new Error('Simulation compilation failed.');
          const data = await response.json();
          stepsToPlay = data.steps.map((st: any) => ({
            ...st,
            timestamp: new Date().toLocaleTimeString()
          }));
        } catch (e) {
          stepsToPlay = generateSyntheticSteps(activeWorkflow, inputText);
        }
      }
      return stepsToPlay;
    };

    if (isSensitivityActive) {
      setSensitivityPhase('baseline');
    }

    const baselineSteps = await getStepsForInput(customInputText);
    setSimulationSteps(baselineSteps);
    setSimulatedLogsPlayed([]);

    let idx = 0;
    setCurrentStepIndex(0);
    setSimulatedLogsPlayed([baselineSteps[0]]);

    simulationTimerRef.current = setInterval(async () => {
      idx++;
      if (idx < baselineSteps.length) {
        setCurrentStepIndex(idx);
        setSimulatedLogsPlayed((played) => [...played, baselineSteps[idx]]);
      } else {
        if (simulationTimerRef.current) {
          clearInterval(simulationTimerRef.current);
          simulationTimerRef.current = null;
        }

        const completedBaselineLogs = [...baselineSteps];
        setBaselineLogs(completedBaselineLogs);

        if (isSensitivityActive) {
          setSensitivityPhase('transition');
          triggerNotice('Baseline successful. Perturbing prompts for robustness analysis...');
          
          let perturbedStr = '';
          if (perturbationType === 'jitter') {
            perturbedStr = customInputText + ' --chaos-mode --env=stochastic_v2 --debug-traces --bypass-certs -vvv';
          } else if (perturbationType === 'extreme') {
            perturbedStr = customInputText + ' ' + ' [STRESS_TEST_HEAVY_CONTEXT] '.repeat(4) + ' [AST_MAX_DEPTH_EXCEPTION] [TOKEN_FLOOD_MUTATION_CRITERIA]';
          } else {
            perturbedStr = '[DEPLETED_VOID_STUB_CRITERIA] --input=void {}';
          }
          setPerturbedInputText(perturbedStr);

          setTimeout(async () => {
            setSensitivityPhase('perturbed');
            setTerminalTab('perturbed');
            
            const perturbedSteps = generatePerturbedSyntheticSteps(activeWorkflow, perturbedStr, perturbationType);
            
            setSimulationSteps(perturbedSteps);
            setCurrentStepIndex(0);
            setSimulatedLogsPlayed([perturbedSteps[0]]);

            let pIdx = 0;
            simulationTimerRef.current = setInterval(() => {
              pIdx++;
              if (pIdx < perturbedSteps.length) {
                setCurrentStepIndex(pIdx);
                setSimulatedLogsPlayed((played) => [...played, perturbedSteps[pIdx]]);
              } else {
                if (simulationTimerRef.current) {
                  clearInterval(simulationTimerRef.current);
                  simulationTimerRef.current = null;
                }
                setPerturbedLogs(perturbedSteps);
                setSensitivityPhase('complete');
                setIsSimulating(false);
                setSimulationSuccessStatus('success');
                setTerminalTab('scorecard');
                triggerNotice('Sensitivity analysis report successfully generated!');
              }
            }, simulationIntervalMs);

          }, 2000);

        } else {
          const lastStep = baselineSteps[baselineSteps.length - 1];
          setSimulationSuccessStatus(lastStep.status === 'failed' ? 'failed' : 'success');
          setIsSimulating(false);
        }
      }
    }, simulationIntervalMs);
  };

  // Purely client-side fallback synthetic trace generator for ultimate robustness
  const generateSyntheticSteps = (sys: MultiAgentSystem, input: string): SimulationStepLog[] => {
    const trace: SimulationStepLog[] = [];
    const ts = () => new Date().toLocaleTimeString();

    // Step 1: Ingest Strategy
    const firstAgent = sys.agents[0];
    trace.push({
      timestamp: ts(),
      nodeId: firstAgent.id,
      nodeName: firstAgent.name,
      nodeType: 'agent',
      status: 'success',
      message: `Decomposing input schema payload and standardizing objectives context target parameters...`,
      inputReceived: input,
      outputProduced: `Raw ingested task contract structured properly: [${firstAgent.outputs.join(', ')}]`,
      tokensUsed: 1100,
      simulatedCost: 0.0017
    });

    // Step 2: Synthesis implementation
    const secondAgent = sys.agents[1] || firstAgent;
    trace.push({
      timestamp: ts(),
      nodeId: secondAgent.id,
      nodeName: secondAgent.name,
      nodeType: 'agent',
      status: 'success',
      message: `Consuming planner spec models. Running standard logic synthesizers and formatting modules...`,
      inputReceived: firstAgent.outputs.join(', '),
      outputProduced: `Functional Draft Spec Code Blocks: ${secondAgent.outputs[0] || 'Draft Deliverables'}`,
      tokensUsed: 1540,
      simulatedCost: 0.0023
    });

    // Step 3: Gate Failure Loop
    const gateNode = sys.gates[0];
    if (gateNode) {
      trace.push({
        timestamp: ts(),
        nodeId: gateNode.id,
        nodeName: gateNode.name,
        nodeType: 'gate',
        status: 'failed',
        message: `Performing audit validation runs. Reviewing structural items against assertions list...`,
        inputReceived: secondAgent.outputs[0] || 'Draft Deliverables',
        outputProduced: `Sanity Checks: BREACHED`,
        feedbackNote: `Remediation Directive: Code payload lacked secure exception trapping block and violates assertions list item [1]. Re-routing flow for remediation loop.`,
        tokensUsed: 980,
        simulatedCost: 0.0015
      });

      // Step 4: Remediation synthesis
      trace.push({
        timestamp: ts(),
        nodeId: secondAgent.id,
        nodeName: secondAgent.name,
        nodeType: 'agent',
        status: 'success',
        message: `Analyzing Gate feedback requirements. Refactoring target source models to address exception criteria...`,
        inputReceived: `Directives: wrap exceptions and check salt levels`,
        outputProduced: `Refactored Asset: Successfully integrated secure wrapper layers and stretch parameters.`,
        tokensUsed: 1620,
        simulatedCost: 0.0024
      });

      // Step 5: Gate Passes
      trace.push({
        timestamp: ts(),
        nodeId: gateNode.id,
        nodeName: gateNode.name,
        nodeType: 'gate',
        status: 'success',
        message: `Performing full validation loop. Re-evaluating updated structures against criteria checkboxes...`,
        inputReceived: `Refactored Asset`,
        outputProduced: `Checks PASS. Code status: MERGE READY.`,
        tokensUsed: 920,
        simulatedCost: 0.0014
      });
    }

    // Step 6: Delivery DevOps Agent
    const finalAgent = sys.agents[sys.agents.length - 1];
    if (finalAgent && finalAgent.id !== secondAgent.id) {
      trace.push({
        timestamp: ts(),
        nodeId: finalAgent.id,
        nodeName: finalAgent.name,
        nodeType: 'agent',
        status: 'success',
        message: `Compiling final authorized pipeline deliverables. Provisioning environment setups...`,
        inputReceived: `Merge ready source assets`,
        outputProduced: `Production Deliverables published. Image tag: latest. Integration logs normal.`,
        tokensUsed: 1350,
        simulatedCost: 0.0020
      });
    }

    return trace;
  };

  // Renders code generators
  const pythonCrewAiSource = useMemo(() => {
    return `# ==========================================================
# BESPOKE CREWAI GENERATION
# Title: ${activeWorkflow.task}
# Generated: 2026-06-02 (Systems Architect Engine)
# ==========================================================

from crewai import Agent, Task, Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI
import os

# Set API Credentials
os.environ["GEMINI_API_KEY"] = "YOUR_API_KEY_HERE"

# Configure standard reasoning model
model_tier_flash = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
model_tier_pro = ChatGoogleGenerativeAI(model="gemini-1.5-pro")

# ----------------------------------------------------------
# AGENT DEFINITIONS
# ----------------------------------------------------------
${activeWorkflow.agents.map((agent) => {
  const variableName = agent.id.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const modelVar = agent.intelligenceTier === 'gemini-3.1-pro-preview' ? 'model_tier_pro' : 'model_tier_flash';
  return `
agent_${variableName} = Agent(
    role="${agent.role}",
    goal="${agent.description.replace(/"/g, '\\"')}",
    backstory="${agent.systemInstruction.replace(/"/g, '\\"').substring(0, 150)}...",
    verbose=True,
    llm=${modelVar},
    tools=[] # Add specialized tools: ${JSON.stringify(agent.tools)}
)`;
}).join('\n')}

# ----------------------------------------------------------
# TASK PROTOCOLS (SEQUENTIAL WITH VERIFICATION LOOP)
# ----------------------------------------------------------
${activeWorkflow.agents.map((agent, i) => {
  const varName = agent.id.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `
task_${varName} = Task(
    description="${agent.description.replace(/"/g, '\\"')}",
    expected_output="High fidelity product matching: ${JSON.stringify(agent.outputs)}",
    agent=agent_${varName}
)`;
}).join('\n')}

# ----------------------------------------------------------
# ORCHESTRATION PIPELINE
# ----------------------------------------------------------
system_orchestration_crew = Crew(
    agents=[${activeWorkflow.agents.map(a => `agent_${a.id.toLowerCase().replace(/[^a-z0-9]/g, '_')}`).join(', ')}],
    tasks=[${activeWorkflow.agents.map(a => `task_${a.id.toLowerCase().replace(/[^a-z0-9]/g, '_')}`).join(', ')}],
    process=Process.sequential,
    verbose=True
)

if __name__ == "__main__":
    print("Initiating Multi-Agent Run: ${activeWorkflow.task}")
    result = system_orchestration_crew.kickoff()
    print("Execution complete. Deliverables formulated.")
`;
  }, [activeWorkflow]);

  const typescriptLangGraphSource = useMemo(() => {
    return `/**
 * BESPOKE LANGGRAPH NODE.JS EXECUTION BLUEPRINT
 * Title: ${activeWorkflow.task}
 * Framework: State-Graph Architecture with Loopback Checkpoint
 */

import { StateGraph, Annotation } from "@langchain/langgraph";
import { GoogleGenAI } from "@google/genai";

// Schema defining State channels
const WorkflowState = Annotation.Root({
  taskInput: Annotation.SimpleString(),
  draftAsset: Annotation.SimpleString(),
  vulnerabilities: Annotation.SimpleStringList(),
  reviewedCount: Annotation.SimpleNumber(),
  remediationDirectives: Annotation.SimpleString(),
  finalProduct: Annotation.SimpleString()
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const maxRetries = ${retryBudget};

// ----------------------------------------------------------
// NODE CONTROLLERS
// ----------------------------------------------------------
${activeWorkflow.agents.map((agent) => {
  const varName = agent.id.replace(/[^a-zA-Z0-9]/g, '');
  return `
async function node${varName}(state: typeof WorkflowState.State) {
  console.log("Executing Agent Node: ${agent.name}");
  
  // Call designated intelligence: ${agent.intelligenceTier}
  const response = await ai.models.generateContent({
    model: "${agent.intelligenceTier === 'gemini-3.1-pro-preview' ? 'gemini-1.5-pro' : 'gemini-1.5-flash'}",
    contents: state.taskInput + "\\nFeedback: " + (state.remediationDirectives || "None"),
    config: {
      systemInstruction: "${agent.systemInstruction.substring(0, 160).replace(/\n/g, ' ')}..."
    }
  });

  return { 
    draftAsset: response.text, 
    remediationDirectives: "" 
  };
}`;
}).join('\n')}

// ----------------------------------------------------------
// DECISION PATHWAYS & LOOPBACK GATE
// ----------------------------------------------------------
function evaluateAuditorGate(state: typeof WorkflowState.State) {
  const retries = state.reviewedCount || 0;
  console.log(\`Evaluating Quality Gate. Loop count: \${retries}\`);
  
  // Gate check assertions:
  // ${activeWorkflow.gates[0]?.criteria.slice(0, 2).join(', ')}
  
  const failedAssertions = true; // Simulated condition
  
  if (failedAssertions) {
    if (retries >= maxRetries) {
      console.log("Circuit Breaker Tripped! Escalate.");
      return "escalate_to_human";
    }
    return "remediate";
  }
  return "deploy";
}

// ----------------------------------------------------------
// CONFIGURING FLOW GRAPH
// ----------------------------------------------------------
const builder = new StateGraph(WorkflowState)
  ${activeWorkflow.agents.map(a => `.addNode("${a.id}", node${a.id.replace(/[^a-zA-Z0-9]/g, '')})`).join('\n  ')}

  // Connections
  .addEdge("__start__", "${activeWorkflow.agents[0].id}")
  .addEdge("${activeWorkflow.agents[0].id}", "${activeWorkflow.agents[1]?.id || '__end__'}")
  
  // Review Gate conditional routing
  .addConditionalEdges(
    "${activeWorkflow.agents[1]?.id || 'gate'}",
    evaluateAuditorGate,
    {
      remediate: "${activeWorkflow.gates[0]?.ifFailedTargetNodeId || activeWorkflow.agents[0].id}",
      deploy: "${activeWorkflow.gates[0]?.ifPassedTargetNodeId || '__end__'}",
      escalate_to_human: "__end__"
    }
  );

export const graph = builder.compile();
`;
  }, [activeWorkflow, retryBudget]);

  // Copy helper
  const copyBoilerplateToClipboard = () => {
    const textToCopy = selectedLanguageTab === 'python' ? pythonCrewAiSource : typescriptLangGraphSource;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCodeText(true);
    triggerNotice('Boilerplate copied to clipboard!');
    setTimeout(() => setCopiedCodeText(false), 2000);
  };

  const handleCustomQueryKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      compileCustomArchitectureSpec();
    }
  };

  // Simulation Active Info Calculations
  const simulationMetrics = useMemo(() => {
    const totalStepsPlayed = simulatedLogsPlayed.length;
    const tokens = simulatedLogsPlayed.reduce((acc, step) => acc + (step.tokensUsed || 0), 0);
    const cost = simulatedLogsPlayed.reduce((acc, step) => acc + (step.simulatedCost || 0), 0);
    const activeStepNode = currentStepIndex >= 0 ? simulationSteps[currentStepIndex] : null;

    return {
      totalStepsPlayed,
      tokens,
      cost,
      activeStepNode
    };
  }, [simulationSteps, simulatedLogsPlayed, currentStepIndex]);

  // Handle active node selected inside list
  const activeAgentNode = useMemo(() => {
    if (selectedNodeType === 'agent') {
      return activeWorkflow.agents.find(a => a.id === selectedNodeId);
    }
    return null;
  }, [activeWorkflow, selectedNodeId, selectedNodeType]);

  const activeGateNode = useMemo(() => {
    if (selectedNodeType === 'gate') {
      return activeWorkflow.gates.find(g => g.id === selectedNodeId);
    }
    return null;
  }, [activeWorkflow, selectedNodeId, selectedNodeType]);

  const activeAgentRole = useMemo(() => {
    const stepNode = simulationMetrics.activeStepNode;
    if (!stepNode) return null;
    const name = (stepNode.nodeName || '').toLowerCase();
    const msg = (stepNode.message || '').toLowerCase();
    const id = (stepNode.nodeId || '').toLowerCase();
    const type = stepNode.nodeType;

    if (type === 'gate' || name.includes('gate') || name.includes('audit') || name.includes('validate') || msg.includes('audit') || msg.includes('validation')) {
      return 'validator';
    }
    if (name.includes('planner') || name.includes('ingest') || name.includes('decouple') || id.includes('planner') || id.includes('ingest') || msg.includes('decomposing') || msg.includes('schema')) {
      return 'planner';
    }
    if (name.includes('research') || name.includes('search') || name.includes('scra') || id.includes('research') || msg.includes('analyzing') || msg.includes('gathering')) {
      return 'research';
    }
    return 'builder';
  }, [simulationMetrics.activeStepNode]);

  return (
    <div className={`min-h-screen font-sans p-6 md:p-8 flex flex-col justify-between transition-all duration-700 ${
      userPlan === 'team'
        ? 'bg-gradient-to-tr from-slate-950 via-amber-950/15 to-slate-950 text-slate-100 font-medium'
        : userPlan === 'pro'
          ? 'bg-gradient-to-tr from-slate-950 via-indigo-950/15 to-slate-950 text-slate-100 font-medium'
          : 'bg-slate-50 text-slate-900'
    } ${premiumStyles.boldClass}`}>
      {/* Dynamic Zero-Trust Secure Access Lock Screen */}
      <AnimatePresence>
        {!hasAuthToken && (
          <SecureAuthWall 
            onAuthSuccess={() => setHasAuthToken(true)}
            onClose={() => {
              localStorage.setItem('ares_auth_bypass', 'true');
              setHasAuthToken(true);
              triggerNotice("Welcome Guest Developer! Access granted to compiler playground. Unlock Pro cards for full sync.");
            }}
            triggerGlobalNotice={triggerNotice}
          />
        )}
      </AnimatePresence>

      {/* Immersive key lock unlock aura animation overlay */}
      <AnimatePresence>
        {showUnlockAnimation && (
          <PremiumUnlockAuraModal
            plan={showUnlockAnimation}
            onClose={() => {
              setShowUnlockAnimation(null);
              triggerNotice(`Refactored system successfully. Premium benefits unlocked!`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Animated Full Screen Bootloader Portal Overlay */}
      <AnimatePresence mode="wait">
        {isBooting && (
          <motion.div
            key="system-bootloader"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 1.05,
              filter: 'blur(8px)',
              transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
            }}
            className="fixed inset-0 z-50 overflow-hidden"
          >
            <SystemBootloader onBootComplete={() => {
              setIsBooting(false);
              setShowArchitectIntro(false);
            }} />
          </motion.div>
        )}

        {showArchitectIntro && (
          <LeadArchitectIntro 
            onEnterWorkspace={() => {
              setShowArchitectIntro(false);
              triggerNotice('ARES-9 Lead Systems Architect compiled. Workspace active!');
            }}
            selectedTemplateName={TEMPLATES[selectedTemplateIndex]?.name || 'Cognitive Compiler'}
          />
        )}
      </AnimatePresence>

      {/* Visual Workspace Container */}
      <div className="w-full max-w-7xl mx-auto space-y-6">
        
        {/* Floating Notification Header */}
        {actionNotice && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-emerald-300 font-mono text-xs px-4 py-2 rounded-full border border-emerald-800 shadow-xl flex items-center gap-2 transition-all duration-300 animate-slide-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Soon Expiry Warning Notice Bar */}
        {isPremiumExpiringSoon && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row items-center justify-between gap-3 bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-mono font-bold text-rose-400">🚨 EXPIRE WARNING:</span>
              <span>Your Premium {userPlan.toUpperCase()} card validity is ending soon ({getRemainingTimeText(planExpiresAt)}). Re-extend cards to keep full system features!</span>
            </div>
            <button
              onClick={() => {
                triggerNotice('Directing to plans premium dashboard...');
                // Trigger global event on the page to open accounts plans modal
                const customEvt = new CustomEvent('ares-open-plans-drawer');
                window.dispatchEvent(customEvt);
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-[9px] uppercase font-bold rounded-lg cursor-pointer transition-all active:scale-95 shrink-0"
            >
              Extend Card Now ⚡
            </button>
          </motion.div>
        )}

        {!isWorkspaceActive ? (
          /* Welcome Portal Panel (at first) */
          <motion.div
            key="welcome-portal"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto py-12 px-4 space-y-8 text-center"
          >
            {/* Top Auth Bar */}
            <div className="flex justify-end max-w-5xl mx-auto pr-4 md:pr-0">
              <UserAccountAuth triggerGlobalNotice={triggerNotice} />
            </div>

            {/* Visual Header */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <span className="bg-slate-950 p-4 rounded-3xl border border-slate-800 shadow-xl inline-flex items-center justify-center shrink-0">
                <svg className="w-16 h-16" viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="40" y1="30" x2="200" y2="30" stroke="#818cf8" strokeWidth="12" strokeLinecap="round" />
                  <line x1="40" y1="110" x2="200" y2="110" stroke="#818cf8" strokeWidth="12" strokeLinecap="round" />
                  <line x1="40" y1="30" x2="40" y2="110" stroke="#6366f1" strokeWidth="10" strokeLinecap="round" />
                  <line x1="200" y1="30" x2="200" y2="110" stroke="#6366f1" strokeWidth="10" strokeLinecap="round" />
                  <circle cx="40" cy="30" r="16" fill="#10b981" />
                  <circle cx="120" cy="30" r="13" fill="#6366f1" />
                  <circle cx="200" cy="30" r="16" fill="#10b981" />
                  <circle cx="40" cy="110" r="16" fill="#10b981" />
                  <circle cx="120" cy="110" r="13" fill="#6366f1" />
                  <circle cx="200" cy="110" r="16" fill="#10b981" />
                  <text x="120" y="78" textAnchor="middle" dominantBaseline="middle" className="text-[52px] font-mono font-black" fill="#ffffff" style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.75))" }}>AI</text>
                </svg>
              </span>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="px-2 py-0.5 text-[9px] font-mono bg-indigo-500/10 text-indigo-600 rounded border border-indigo-500/20 font-bold uppercase tracking-widest">
                    SYSTEM DESIGN LAB
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 font-sans">
                  ARES-9 Multi-Agent System Architect
                </h1>
                <p className="text-sm text-slate-505 text-slate-500 max-w-xl mx-auto leading-relaxed">
                  Welcome to your secure agent synthesis laboratory. Input any project idea or task below, and our systems architect will compile a highly-reliable multi-agent blueprint, DDL schema models, API specifications, security checks, and financial costs.
                </p>
              </div>
            </div>

            {/* Prompt Form Box */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-xl max-w-2xl mx-auto space-y-4">
              <div className="text-left space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-405 text-slate-400">
                  What software idea can I design for you today?
                </span>
                <textarea
                  id="primary-welcome-textarea"
                  placeholder="e.g., Build a 3D animation platform with timeline keyframes..."
                  className="w-full h-28 p-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-400 focus:bg-white focus:outline-none transition-all placeholder:text-slate-405 text-slate-400 font-sans leading-relaxed resize-none shadow-inner"
                  value={customTaskQuery}
                  onChange={(e) => setCustomTaskQuery(e.target.value)}
                />
              </div>

              <button
                onClick={() => {
                  const val = customTaskQuery.trim() || "Build a 3D animation platform.";
                  startWithCustomIdea(val);
                }}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white font-mono font-bold uppercase text-xs py-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-lg hover:shadow-indigo-500/10"
              >
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                Inquire Architect & Generate Custom Blueprint
              </button>
            </div>

            {/* Quick Presets Grid */}
            <div className="space-y-4 pt-4 animate-fade-in">
              <div className="flex items-center justify-center gap-2">
                <span className="w-12 h-[1px] bg-slate-200" />
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  OR CHOOSE A SYSTEMS BLUEPRINT ARCHITECTURE PRESET
                </span>
                <span className="w-12 h-[1px] bg-slate-200" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {TEMPLATES.map((tmpl, idx) => {
                  const getIcon = (index: number) => {
                    if (index === 0) return <Layers className="w-5 h-5 text-indigo-550 text-indigo-500" />;
                    if (index === 1) return <ShieldCheck className="w-5 h-5 text-emerald-555 text-emerald-500" />;
                    if (index === 2) return <Cpu className="w-5 h-5 text-amber-555 text-amber-500" />;
                    return <Sparkles className="w-5 h-5 text-indigo-555 text-indigo-500" />;
                  };

                  return (
                    <button
                      key={idx}
                      onClick={() => startWithTemplate(idx)}
                      className="bg-white hover:bg-slate-50 p-5 rounded-2xl border border-slate-200/95 hover:border-slate-350 text-left cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md flex items-start gap-4"
                    >
                      <span className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0">
                        {getIcon(idx)}
                      </span>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-800 font-mono block">
                          {tmpl.name}
                        </span>
                        <p className="text-[11px] text-slate-505 text-slate-500 leading-normal line-clamp-2">
                          {tmpl.taskDescription}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-mono font-bold pt-1">
                          Activate Template <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-w-3xl mx-auto pt-6 text-left">
              <SavedProjectsDashboard
                currentSystem={activeWorkflow}
                currentTaskQuery={customTaskQuery}
                onLoadProject={handleLoadProjectFromDashboard}
                triggerNotice={triggerNotice}
              />
            </div>

            {/* Extended Interactive Options and Utilities Suite */}
            <div className="max-w-4xl mx-auto pt-6 text-left">
              <HomeUtilitiesSuite
                onApplyPrompt={(p) => {
                  setCustomTaskQuery(p);
                  // Scroll to the main text area for a smooth user experience
                  const elem = document.getElementById('primary-welcome-textarea');
                  if (elem) {
                    elem.focus();
                    elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                triggerNotice={triggerNotice}
                userPlan={userPlan}
              />
            </div>
          </motion.div>
        ) : (
          <>
            {/* Master App Bar */}
            <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <span className="bg-slate-950 p-[5px] rounded-xl border border-slate-800 shadow-md flex items-center justify-center shrink-0">
                    <svg className="w-9 h-9" viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Symbol: ●──●──●  │ AI │  ●──●──● */}
                      {/* Connection Lines represent drawing */}
                      <line x1="40" y1="30" x2="200" y2="30" stroke="#818cf8" strokeWidth="12" strokeLinecap="round" />
                      <line x1="40" y1="110" x2="200" y2="110" stroke="#818cf8" strokeWidth="12" strokeLinecap="round" />
                      <line x1="40" y1="30" x2="40" y2="110" stroke="#6366f1" strokeWidth="10" strokeLinecap="round" />
                      <line x1="200" y1="30" x2="200" y2="110" stroke="#6366f1" strokeWidth="10" strokeLinecap="round" />
                      
                      {/* Grid system nodes */}
                      <circle cx="40" cy="30" r="16" fill="#10b981" />
                      <circle cx="120" cy="30" r="13" fill="#6366f1" />
                      <circle cx="200" cy="30" r="16" fill="#10b981" />
                      <circle cx="40" cy="110" r="16" fill="#10b981" />
                      <circle cx="120" cy="110" r="13" fill="#6366f1" />
                      <circle cx="200" cy="110" r="16" fill="#10b981" />
                      
                      {/* Central branding text */}
                      <text x="120" y="78" textAnchor="middle" dominantBaseline="middle" className="text-[52px] font-mono font-black" fill="#ffffff" style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.75))" }}>AI</text>
                    </svg>
                  </span>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-950 font-sans leading-none flex items-center gap-2">
                      Multi-Agent System Architect
                    </h1>
                    <p className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                      <span>SECURE COMPILER WORKBENCH • STABLE AGENT PIPELINES</span>
                      <span className="text-slate-350 select-none">•</span>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold tracking-wider uppercase ${
                        saveStatus === 'saving' ? 'text-indigo-500' : 'text-emerald-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          saveStatus === 'saving' ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'
                        }`} />
                        {saveStatus === 'saving' ? 'Autosaving...' : 'Draft Saved'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Select Preset Targets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <UserAccountAuth triggerGlobalNotice={triggerNotice} />
                <span className="text-[10px] font-mono font-bold uppercase text-slate-300 mx-1 md:block hidden">
                  |
                </span>
                <button
                  onClick={() => {
                    setIsWorkspaceActive(false);
                    localStorage.removeItem('ares_workspace_active');
                    triggerNotice('Returned to template/idea selector.');
                  }}
                  className="px-3 py-1.5 text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-705 text-slate-700 border border-slate-200 rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                >
                  ← New Project
                </button>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-300 mx-1 md:block hidden">
                  |
                </span>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 mr-2 md:block hidden">
                  Blueprints:
                </span>
                {TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadPreloadedTemplate(idx)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer select-none ${
                      selectedTemplateIndex === idx && customTaskQuery === ''
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </header>

        {/* Top-Level Design Layout Split */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: System Configuration Workspace (35%) */}
          <section className="lg:col-span-4 space-y-5">
            
            {/* Box 1: Custom Workflow Generation */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                  Define Custom Agentic Task
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] bg-slate-100 text-slate-505 text-slate-500 font-mono px-2 py-0.5 rounded border border-slate-200">
                    Real-time AI Synthesis
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWorkspaceActive(false);
                      localStorage.removeItem('ares_workspace_active');
                      triggerNotice('Returned to template/idea selector.');
                    }}
                    className="px-2 py-[2px] text-[9.5px] font-mono font-black bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-md cursor-pointer transition-all flex items-center gap-1"
                    title="Quit Section & Go Home"
                  >
                    🚪 Quit
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <textarea
                  value={customTaskQuery}
                  onChange={(e) => setCustomTaskQuery(e.target.value)}
                  onKeyDown={handleCustomQueryKeyPress}
                  placeholder="e.g., A system to generate social media content, verify compliance against Facebook rules, and translate automatically to Spanish..."
                  className="w-full h-24 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-400 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 font-sans leading-relaxed resize-none"
                />
                <p className="text-[10px] text-slate-400 font-mono leading-normal">
                  Describe any technical pipeline. Gemini will identify essential agents, custom tools, fail-safes, routing rules, and design a custom flowchart.
                </p>
              </div>

              <button
                onClick={compileCustomArchitectureSpec}
                disabled={isDesigning || !customTaskQuery.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm relative overflow-hidden"
              >
                {isDesigning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    Synthesizing Architecture: Step {designProgressIndex + 1}/5
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    Design bespoken multi-agent system
                  </>
                )}
              </button>

              {isDesigning && (
                <div className="p-4 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 space-y-2.5 font-mono text-[11px] mt-3 shadow-lg animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                      AI Orchestrator Pipeline
                    </span>
                    <span className="text-[9px] text-slate-500">Processing...</span>
                  </div>
                  {[
                    { label: 'Analyzing Request', id: 'analyze' },
                    { label: 'Planning Workflow', id: 'plan' },
                    { label: 'Creating Agents', id: 'create' },
                    { label: 'Running Validation', id: 'validate' },
                    { label: 'Generating Solution', id: 'generate' },
                  ].map((step, idx) => {
                    const isCompleted = designProgressIndex > idx;
                    const isActive = designProgressIndex === idx;
                    return (
                      <div key={step.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <span className="text-emerald-400 font-bold">✓</span>
                          ) : isActive ? (
                            <span className="text-indigo-400 animate-pulse">●</span>
                          ) : (
                            <span className="text-slate-700">○</span>
                          )}
                          <span className={isCompleted ? 'text-slate-500 line-through decoration-slate-800/50 text-[10px]' : isActive ? 'text-slate-100 font-semibold' : 'text-slate-600'}>
                            {step.label}...
                          </span>
                        </div>
                        {isActive && (
                          <span className="text-[8px] bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-900/50 animate-pulse uppercase select-none font-bold">
                            Active
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[8px] text-emerald-500 uppercase font-bold tracking-wider">
                            Done
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {designError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-xl font-mono flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{designError}</span>
                </div>
              )}
            </div>

            {/* Box 2: Flow Settings & Fail-Safe Parameters */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-slate-400" />
                  Operational Fail-Safe Policies
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceActive(false);
                    localStorage.removeItem('ares_workspace_active');
                    triggerNotice('Returned to template/idea selector.');
                  }}
                  className="px-2 py-[2px] text-[9.5px] font-mono font-black bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-md cursor-pointer transition-all flex items-center gap-1"
                  title="Quit Section & Go Home"
                >
                  🚪 Quit
                </button>
              </div>

              {/* Slider for Retry budget */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Failure Retry Budget</span>
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold border border-slate-200">
                    {retryBudget} iterations
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={retryBudget}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (userPlan === 'free' && val > 2) {
                      triggerNotice("⚙️ Failure Retry Budgets above 2 iterations require Pro or Team membership!");
                      window.dispatchEvent(new CustomEvent('ares-open-plans-drawer'));
                      return;
                    }
                    setRetryBudget(val);
                    setActiveWorkflow((w) => ({
                      ...w,
                      failureHandling: {
                        ...w.failureHandling,
                        maxRetryBudgets: val
                      }
                    }));
                  }}
                  className="w-full accent-slate-900 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[9.5px] text-slate-400 leading-normal">
                  Defines the max permitted loops back from audit gates for bug fix rewrites before throwing circuit breaker alerts.
                </p>
              </div>

              {/* Toggles for Optimization */}
              <div className="pt-3 border-t border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 block">Parallel Scaffolding</span>
                    <span className="text-[9px] text-slate-400">Run safe sibling nodes in parallel</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={concurrencyEnabled}
                    onChange={(e) => setConcurrencyEnabled(e.target.checked)}
                    className="w-4 h-4 accent-slate-900 cursor-pointer text-slate-900 bg-slate-100 rounded border-slate-300"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-[10px] font-mono text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Cache Context Model:</span>
                    <span className="text-emerald-600 font-bold">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Structured Outputs Spec:</span>
                    <span className="text-slate-600">Schema forced</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 3: Live Execution Playground Input */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  Playground Simulation Target Input
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceActive(false);
                    localStorage.removeItem('ares_workspace_active');
                    triggerNotice('Returned to template/idea selector.');
                  }}
                  className="px-2 py-[2px] text-[9.5px] font-mono font-black bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-md cursor-pointer transition-all flex items-center gap-1"
                  title="Quit Section & Go Home"
                >
                  🚪 Quit
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 block uppercase font-bold">
                  Custom Task Payload Input
                </label>
                <textarea
                  value={customInputText}
                  onChange={(e) => setCustomInputText(e.target.value)}
                  className="w-full h-20 p-2.5 text-xs bg-slate-50 font-mono border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-slate-400 transition-all leading-normal"
                />
              </div>

              {/* Sensitivity Analysis Controls */}
              <div className="p-3.5 bg-slate-905 bg-slate-950 text-white rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10.5px] font-mono font-bold uppercase text-indigo-300">Sensitivity Stress Test</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={isSensitivityActive} 
                      onChange={(e) => {
                        if (e.target.checked && userPlan === 'free') {
                          triggerNotice("⚙️ Sensitivity Stress Testing requires Pro or Team membership!");
                          window.dispatchEvent(new CustomEvent('ares-open-plans-drawer'));
                          return;
                        }
                        setIsSensitivityActive(e.target.checked);
                        if (e.target.checked) {
                          setTerminalTab('baseline');
                        }
                      }} 
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-500 after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-indigo-500 peer-checked:after:bg-white"></div>
                  </label>
                </div>
                
                {isSensitivityActive && (
                  <div className="space-y-2 pt-1 border-t border-slate-800/80 animate-fade-in text-[10px] font-mono">
                    <p className="text-slate-400 text-[9.5px] leading-relaxed">
                      Auto-runs a dual trace: Baseline, then Stress-tested with perturbed input to analyze system consistency.
                    </p>
                    
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Stress Model</span>
                      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-830 border-slate-800">
                        {(['jitter', 'extreme', 'empty'] as const).map((type) => {
                          const label = type === 'jitter' ? 'Jitter' : type === 'extreme' ? 'Extreme' : 'Stub';
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setPerturbationType(type)}
                              className={`py-1 text-center rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                                perturbationType === type 
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-900/50 shadow-sm' 
                                  : 'text-slate-500 hover:text-slate-300 bg-transparent border border-transparent'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Simulation Stepper Speed */}
              <div className="flex items-center justify-between gap-1 border-t border-slate-100 pt-3">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Step Interval</span>
                <select
                  value={simulationIntervalMs}
                  onChange={(e) => setSimulationIntervalMs(parseInt(e.target.value))}
                  className="bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-mono p-1 text-slate-600 select-none outline-none focus:border-slate-400"
                >
                  <option value={1000}>Fast (1.0s)</option>
                  <option value={1800}>Standard (1.8s)</option>
                  <option value={3000}>Observing (3.0s)</option>
                </select>
              </div>

              <button
                onClick={launchActiveSimulation}
                disabled={isSimulating}
                className="w-full bg-emerald-600 text-slate-950 hover:bg-emerald-500 font-bold tracking-wide py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_4px_12px_rgba(16,185,129,0.15)] disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>
                      {isSensitivityActive 
                        ? (sensitivityPhase === 'baseline' ? 'Running Baseline...' : sensitivityPhase === 'transition' ? 'Perturbing Input...' : 'Running Stress Metric...') 
                        : 'Running Trace...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Launch orchestrator simulation</span>
                  </>
                )}
              </button>

              {isSimulating && (
                <div className="p-3.5 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px] mt-3 shadow-lg animate-fade-in select-none">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-1">
                    <span className="text-[9.5px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Dynamic Agent Monitor
                    </span>
                    <span className="text-[8px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900/50 uppercase font-bold tracking-widest animate-pulse">
                      Live
                    </span>
                  </div>
                  {[
                    { emoji: '🧠', role: 'Planner Agent Active', type: 'planner', desc: 'Decomposing objectives & orchestration strategy' },
                    { emoji: '🔍', role: 'Research Agent Active', type: 'research', desc: 'Sourcing system parameters & guidelines context' },
                    { emoji: '🛠', role: 'Builder Agent Active', type: 'builder', desc: 'Synthesizing solutions & refactoring assets' },
                    { emoji: '✅', role: 'Validator Agent Active', type: 'validator', desc: 'Audit gate validation & criteria evaluation' }
                  ].map((role) => {
                    const isActive = activeAgentRole === role.type;
                    return (
                      <div 
                        key={role.type} 
                        className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all duration-300 ${
                          isActive 
                            ? 'border-emerald-500/40 bg-emerald-950/20 text-white shadow-[0_0_12px_rgba(16,185,129,0.1)] scale-[1.02]' 
                            : 'border-slate-900/60 opacity-35 text-slate-400 scale-[0.98]'
                        }`}
                      >
                        <span className={`text-sm ${isActive ? 'animate-bounce' : ''}`}>{role.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? 'text-emerald-300' : 'text-slate-400'}`}>
                              {role.role}
                            </span>
                            {isActive && (
                              <span className="flex h-1.5 w-1.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                            )}
                          </div>
                          <span className="text-[8.5px] text-slate-500 truncate block mt-0.5 leading-none">
                            {role.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </section>

          {/* RIGHT: Layout visualizer workbench (65%) */}
          <section className="lg:col-span-8 space-y-6">
            
            {/* Workbench Control Navigation */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-sm">
              <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 relative overflow-hidden flex-wrap">
                {(['flowchart', 'project_blueprint', 'performance', 'blueprint', 'code', 'projects', 'team_workspace'] as const).map((tab) => {
                  const isActive = activeWorkbenchTab === tab;
                  const isLocked = tab === 'team_workspace' && userPlan !== 'team';
                  const label = 
                    tab === 'flowchart' ? 'Interactive Flowchart' :
                    tab === 'project_blueprint' ? '🚀 Project Blueprint Hub' :
                    tab === 'performance' ? '📊 Engine Performance' :
                    tab === 'blueprint' ? 'Reliability & Scale Spec' :
                    tab === 'projects' ? '📂 Projects Dashboard' :
                    tab === 'team_workspace' ? `👥 Team Workspace ${isLocked ? '🔒' : ''}` :
                    'Export Boilerplate Code';
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        if (tab === 'team_workspace' && userPlan !== 'team') {
                          triggerNotice('👥 Team Workspace is locked! Shared team environments require the Enterprise Team Plan.');
                          window.dispatchEvent(new CustomEvent('ares-open-plans-drawer'));
                          return;
                        }
                        setActiveWorkbenchTab(tab);
                      }}
                      className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer z-10 ${
                        isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="activeWorkbenchTab"
                          className="absolute inset-0 bg-slate-900 rounded-lg -z-10 shadow-sm"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Status Header Block */}
              <div className="flex items-center gap-2 justify-end px-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full block ${
                    simulationSuccessStatus === 'running' ? 'bg-emerald-500 animate-ping' :
                    simulationSuccessStatus === 'success' ? 'bg-emerald-500' :
                    simulationSuccessStatus === 'failed' ? 'bg-rose-500' : 'bg-slate-400'
                  }`} />
                  <span className="font-mono text-[10px] text-slate-505 text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">
                    Status: {simulationSuccessStatus === 'idle' ? 'Dormant' : simulationSuccessStatus}
                  </span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceActive(false);
                    localStorage.removeItem('ares_workspace_active');
                    triggerNotice('Returned to template/idea selector.');
                  }}
                  className="px-2.5 py-[3px] text-[10px] font-mono font-black bg-rose-600 hover:bg-rose-700 text-white rounded-md cursor-pointer transition-all flex items-center gap-1 shadow-sm active:scale-95"
                  title="Quit Entire Workspace View & Return to Home Page"
                >
                  🚪 Exit
                </button>
              </div>
            </div>

            {/* Workbench Display Content Card */}
            <div>
              <AnimatePresence mode="wait">
                {activeWorkbenchTab === 'flowchart' && (
                  <motion.div
                    key="flowchart"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    {/* Flow Chart Grid Overlay */}
                    <FlowchartVisualizer
                      system={activeWorkflow}
                      activeNodeId={simulationMetrics.activeStepNode?.nodeId || null}
                      activeEdgeId={null}
                      selectedNodeId={selectedNodeId}
                      onSelectNode={(node) => {
                        setSelectedNodeId(node.id);
                        setSelectedNodeType(node.type);
                      }}
                      simulationPhase={simulationSuccessStatus === 'running' ? 'running' : 'idle'}
                      simulatedLogsPlayed={simulatedLogsPlayed}
                    />

                    {/* Flow chart footer hint */}
                    <div className="text-center p-1 font-mono text-[9.5px] text-slate-400">
                      💡 Click on any agent node or compliance audit check to inspect exact roles, custom tools, and prompt architectures below.
                    </div>
                  </motion.div>
                )}

                {activeWorkbenchTab === 'project_blueprint' && (
                  <motion.div
                    key="project_blueprint"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    <ProjectBlueprintHub
                      simulatedLogsPlayed={simulatedLogsPlayed}
                      customInputText={customTaskQuery || TEMPLATES[selectedTemplateIndex]?.taskDescription || 'Build a 3D animation platform.'}
                    />
                  </motion.div>
                )}

                {activeWorkbenchTab === 'performance' && (
                  <motion.div
                    key="performance"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    <AgentPerformanceCharts
                      activeWorkflow={activeWorkflow}
                      simulatedLogsPlayed={simulatedLogsPlayed}
                      isSimulating={isSimulating}
                      baselineLogs={baselineLogs}
                      perturbedLogs={perturbedLogs}
                      isSensitivityActive={isSensitivityActive}
                    />
                  </motion.div>
                )}

                {activeWorkbenchTab === 'blueprint' && (
                  <motion.div
                    key="blueprint"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6"
                  >
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="font-sans font-bold text-base text-slate-900 flex items-center gap-2">
                        <Server className="w-5 h-5 text-indigo-500" />
                        Dynamic Production Runtime Blueprint
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Operational specs to deploy this designed multi-agent system onto real enterprise workflows.
                      </p>
                    </div>

                    {/* 3 Grid Core Areas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl border border-rose-200/60 bg-rose-50/10 space-y-2">
                        <div className="font-mono text-[11px] font-bold text-rose-600 uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> High Availability
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans">
                          <strong>Fallback Route Action:</strong> {activeWorkflow.failureHandling.fallbackTriggerPolicy}
                        </p>
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-400 font-mono block uppercase">Monitor Webhooks</span>
                          <div className="flex gap-1.5 flex-wrap mt-1">
                            {activeWorkflow.failureHandling.alertingChannels.map((c, i) => (
                              <span key={i} className="text-[9px] font-mono bg-white border border-rose-200 text-rose-700 px-2 py-0.5 rounded-md">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-indigo-200/60 bg-indigo-50/10 space-y-2">
                        <div className="font-mono text-[11px] font-bold text-indigo-600 uppercase flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5" /> Context Optimization
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans">
                          <strong>Prompt Structure:</strong> {activeWorkflow.optimization.promptWrapping}
                        </p>
                        <p className="text-xs text-slate-400 leading-normal font-mono text-[10px] border-t border-indigo-100/60 pt-2">
                          <strong>Cache Rules:</strong> {activeWorkflow.optimization.cachingStrategy}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl border border-emerald-200/60 bg-emerald-50/10 space-y-2">
                        <div className="font-mono text-[11px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> Horizontal Scaling
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans">
                          <strong>Concurrency Model:</strong> {activeWorkflow.scalability.concurrencyModel}
                        </p>
                        <p className="text-xs text-slate-400 leading-normal font-mono text-[10px] border-t border-emerald-100/60 pt-2">
                          <strong>Broker Loop:</strong> {activeWorkflow.scalability.eventSubscriptionModel}
                        </p>
                      </div>
                    </div>

                    {/* Orchestration Pattern Detail */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 p-4 space-y-2">
                      <h4 className="text-xs font-mono font-bold text-slate-700 uppercase">
                        Recommended Orchestration Design Topology
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {activeWorkflow.scalability.agentOrchestrationPattern}
                      </p>
                      <div className="p-3 bg-white rounded-lg border border-slate-200/80 font-mono text-[11px] text-slate-500">
                        🎯 <strong>Verification Gateway Connection:</strong> Routing routes standard drafts sequentially to review nodes. If reviews fail, feedback-loops route back to Synthesis Agents. If they pass, delivery routines trigger.
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeWorkbenchTab === 'code' && (
                  <motion.div
                    key="code"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-sans font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <FileCode className="w-5 h-5 text-indigo-500" />
                          Compilation Code generator
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Copy ready-to-run orchestration boilerplates for this exact system framework context.
                        </p>
                      </div>

                      <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 font-mono text-[10px]">
                        <button
                          onClick={() => setSelectedLanguageTab('python')}
                          className={`px-3 py-1 rounded-md transition-all ${
                            selectedLanguageTab === 'python' ? 'bg-white font-bold text-slate-900 shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          CrewAI (Python)
                        </button>
                        <button
                          onClick={() => setSelectedLanguageTab('typescript')}
                          className={`px-3 py-1 rounded-md transition-all ${
                            selectedLanguageTab === 'typescript' ? 'bg-white font-bold text-slate-900 shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          LangGraph (TS)
                        </button>
                      </div>
                    </div>

                    {/* Copied and Action Container */}
                    <div className="relative">
                      <pre className="p-5 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[380px] select-all">
                        {selectedLanguageTab === 'python' ? pythonCrewAiSource : typescriptLangGraphSource}
                      </pre>

                      <button
                        onClick={copyBoilerplateToClipboard}
                        className="absolute top-3 right-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 cursor-pointer flex items-center gap-1.5 text-[11px] font-mono"
                      >
                        {copiedCodeText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCodeText ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeWorkbenchTab === 'projects' && (
                  <motion.div
                    key="projects-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <SavedProjectsDashboard
                      currentSystem={activeWorkflow}
                      currentTaskQuery={customTaskQuery}
                      onLoadProject={handleLoadProjectFromDashboard}
                      triggerNotice={triggerNotice}
                    />
                  </motion.div>
                )}

                {activeWorkbenchTab === 'team_workspace' && (
                  <motion.div
                    key="team-workspace-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <TeamWorkspaceDashboard
                      triggerNotice={triggerNotice}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* LOWER PORTION: Live simulation log terminal stream (Spacious Full Width) */}
            <div className="w-full">
              <div className="flex flex-col bg-slate-950 rounded-3xl border border-slate-800 p-5 text-slate-100 overflow-hidden shadow-2xl min-h-[350px]">
                
                {/* Visual Terminal Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 mb-3 shrink-0 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-800 block flex items-center justify-center font-bold text-[8px] text-slate-600">●</span>
                    <span className="font-mono text-[10px] text-slate-400 uppercase font-bold tracking-widest flex items-center gap-1">
                      <Terminal className="w-3.5 h-3.5 text-slate-500" /> Trace Engine terminal
                    </span>
                  </div>

                  {isSensitivityActive && (
                    <div className="flex bg-slate-900/85 p-0.5 rounded-lg border border-slate-800 font-mono text-[9px] scale-[0.95] sm:scale-100">
                      <button
                        type="button"
                        onClick={() => setTerminalTab('baseline')}
                        className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
                          terminalTab === 'baseline' ? 'bg-slate-800 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Pristine Run
                      </button>
                      <button
                        type="button"
                        disabled={sensitivityPhase === 'idle' || sensitivityPhase === 'baseline'}
                        onClick={() => setTerminalTab('perturbed')}
                        className={`px-2.5 py-1 rounded transition-all font-bold disabled:opacity-40 disabled:cursor-not-allowed ${
                          terminalTab === 'perturbed' ? 'bg-slate-800 text-amber-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Stress-Test
                      </button>
                      <button
                        type="button"
                        disabled={sensitivityPhase !== 'complete'}
                        onClick={() => setTerminalTab('scorecard')}
                        className={`px-2.5 py-1 rounded transition-all font-bold disabled:opacity-40 disabled:cursor-not-allowed ${
                          terminalTab === 'scorecard' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/30 font-extrabold shadow-[0_0_10px_rgba(99,102,241,0.15)]' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        📊 Scorecard
                      </button>
                    </div>
                  )}

                  {simulationSuccessStatus === 'running' && (
                    <span className="text-[8px] font-mono bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900 flex items-center gap-1 animate-pulse justify-center shrink-0">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Stream Live
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsWorkspaceActive(false);
                      localStorage.removeItem('ares_workspace_active');
                      triggerNotice('Returned to template/idea selector.');
                    }}
                    className="px-2.5 py-1 text-[9.5px] font-mono font-black bg-rose-900/40 hover:bg-rose-900 text-rose-400 border border-rose-900/50 rounded-xl cursor-pointer transition-all flex items-center gap-1 select-none"
                    title="Quit Terminal & Go Home"
                  >
                    🚪 Quit Console
                  </button>
                </div>

                {/* Simulated live telemetry metrics panel */}
                <div className="grid grid-cols-2 gap-2 border-b border-slate-900 pb-3 mb-3 text-[10px] font-mono select-none shrink-0 animate-fade-in">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-900">
                    <span className="text-slate-500 block uppercase text-[8px] font-bold">Total Tokens</span>
                    <span className="text-indigo-400 font-bold block mt-0.5 text-xs">
                      {isSensitivityActive 
                        ? (terminalTab === 'baseline' ? baselineTokens.toLocaleString() : terminalTab === 'perturbed' ? perturbedTokens.toLocaleString() : (baselineTokens + perturbedTokens).toLocaleString())
                        : simulationMetrics.tokens.toLocaleString()
                      }
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-900">
                    <span className="text-slate-500 block uppercase text-[8px] font-bold">Inference Cost</span>
                    <span className="text-emerald-400 font-bold block mt-0.5 text-xs">
                      {isSensitivityActive
                        ? `$${(terminalTab === 'baseline' ? baselineCost : terminalTab === 'perturbed' ? perturbedCost : (baselineCost + perturbedCost)).toFixed(4)}`
                        : `$${simulationMetrics.cost.toFixed(4)}`
                      }
                    </span>
                  </div>
                </div>

                {/* Search & Filter Controls inside Terminal */}
                {terminalTab !== 'scorecard' && logsToDisplay.length > 0 && (
                  <div className="flex flex-col md:flex-row gap-2 bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl mb-3 shrink-0">
                    {/* Search Field */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search Trace Logs (e.g. prompt, success, agentName)..."
                        value={logSearchQuery}
                        onChange={(e) => setLogSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-500 text-slate-200 transition-colors placeholder:text-slate-600"
                      />
                      {logSearchQuery && (
                        <button
                          onClick={() => setLogSearchQuery('')}
                          type="button"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Filter Dropdown */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 min-w-[150px] md:min-w-[180px]">
                        <Filter className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
                        <select
                          value={logAgentFilter}
                          onChange={(e) => setLogAgentFilter(e.target.value)}
                          className="bg-transparent text-xs font-mono font-bold text-slate-200 focus:outline-none cursor-pointer w-full pr-4 appearance-none"
                        >
                          <option value="all" className="bg-slate-950 text-slate-300">All Modules</option>
                          
                          {/* Dynamically grouped unique log emitters */}
                          {uniqueNodes.length > 0 && (
                            <optgroup label="Active Trace Nodes" className="bg-slate-955 text-indigo-400 font-bold bg-slate-950">
                              {uniqueNodes.map(node => (
                                <option key={node.id} value={node.id} className="bg-slate-950 text-slate-200 font-mono">
                                  {node.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          
                          {/* Also show template configuration's static list of agents & gates as backup option groups */}
                          {activeWorkflow.agents && activeWorkflow.agents.length > 0 && (
                            <optgroup label="Workflow Agents" className="bg-slate-955 text-emerald-400 font-bold bg-slate-950">
                              {activeWorkflow.agents.map(agent => (
                                <option key={agent.id} value={agent.id} className="bg-slate-955 text-slate-200">
                                  {agent.name} (Agent)
                                </option>
                              ))}
                            </optgroup>
                          )}

                          {activeWorkflow.gates && activeWorkflow.gates.length > 0 && (
                            <optgroup label="Compliance Gates" className="bg-slate-955 text-rose-400 font-bold bg-slate-950">
                              {activeWorkflow.gates.map(gate => (
                                <option key={gate.id} value={gate.id} className="bg-slate-955 text-slate-200">
                                  {gate.name} (Gate)
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                        <span className="absolute right-3.5 pointer-events-none text-[8px] text-slate-500">▼</span>
                      </div>
                      
                      {/* Clear Button if Filtered */}
                      {(logAgentFilter !== 'all' || logSearchQuery !== '') && (
                        <button
                          onClick={() => {
                            setLogSearchQuery('');
                            setLogAgentFilter('all');
                          }}
                          type="button"
                          className="px-2.5 py-1.5 bg-slate-955 border border-slate-800 text-[10px] font-mono text-indigo-400 hover:text-indigo-300 rounded-lg hover:border-slate-700 transition-colors cursor-pointer"
                          title="Reset Filters"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Infinite logs scroll body */}
                {terminalTab === 'scorecard' && isSensitivityActive && sensitivityPhase === 'complete' ? (
                  <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin max-h-[550px] font-sans pb-2 text-slate-100">
                    <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-4 animate-fade-in text-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-2">
                        <div>
                          <h4 className="text-xs font-bold font-mono uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                            <span>🧪 Multi-Agent Robustness Assessment</span>
                          </h4>
                          <span className="text-[9.5px] text-slate-500 font-mono block mt-0.5">
                            Stress model: {perturbationType === 'jitter' ? 'Syntactic Jitter' : perturbationType === 'extreme' ? 'Content Context Bloat' : 'Depleted Stub payload'}
                          </span>
                        </div>
                        
                        <div className="bg-emerald-950/50 border border-emerald-900/40 px-3 py-1 rounded-xl text-center shadow-lg shrink-0 flex items-center gap-2">
                          <div>
                            <span className="text-[8px] font-mono font-bold text-slate-500 block uppercase leading-none">Resilience</span>
                            <span className="text-sm text-emerald-400 font-extrabold tracking-tight block mt-0.5">
                              {perturbationType === 'jitter' ? '96%' : perturbationType === 'extreme' ? '91%' : '88%'}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900/50 uppercase tracking-widest animate-pulse">
                            STABLE
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[10.5px]">
                        
                        {/* Box baseline */}
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900/80 space-y-2">
                          <div className="flex justify-between items-center pb-1.5 border-b border-slate-900">
                            <span className="text-indigo-400 font-bold uppercase text-[9px]">Pristine Run</span>
                            <span className="text-[8px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 border border-slate-800">baseline</span>
                          </div>
                          <div className="space-y-1.5 text-slate-300">
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-500 select-none">Task Ingress:</span>
                              <span className="truncate max-w-[130px] font-semibold text-slate-300">{customInputText}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 select-none">Total Tokens:</span>
                              <span className="font-semibold">{baselineTokens.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 select-none">Est. Cost:</span>
                              <span className="text-emerald-400 font-semibold">${baselineCost.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 select-none">Gate Check Fail:</span>
                              <span className="font-semibold">{baselineGateRetries} retries</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 select-none">Outcome:</span>
                              <span className="text-emerald-400 font-bold bg-emerald-950/30 px-1.5 py-0.5 rounded text-[8.5px] uppercase border border-emerald-900/30">SUCCESS</span>
                            </div>
                          </div>
                        </div>

                        {/* Perturbed Box */}
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900/80 space-y-2">
                          <div className="flex justify-between items-center pb-1.5 border-b border-slate-900">
                            <span className="text-amber-400 font-bold uppercase text-[9px]">Stress-Test Run</span>
                            <span className="text-[8px] bg-amber-950/10 px-1.5 py-0.5 rounded text-amber-500 border border-amber-900/20 font-bold uppercase">Stressed</span>
                          </div>
                          <div className="space-y-1.5 text-slate-300">
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-500 select-none">Stressed Payload:</span>
                              <span className="truncate max-w-[130px] font-semibold text-slate-300">{perturbedInputText}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 select-none">Total Tokens:</span>
                              <span className={`font-semibold ${perturbedTokens > baselineTokens ? 'text-amber-400' : ''}`}>
                                {perturbedTokens.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 select-none">Est. Cost:</span>
                              <span className="text-emerald-400 font-semibold">${perturbedCost.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 select-none">Gate Check Fail:</span>
                              <span className="font-semibold">{perturbedGateRetries} retries</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 select-none">Outcome:</span>
                              <span className="text-indigo-400 font-bold bg-indigo-950/30 px-1.5 py-0.5 rounded text-[8.5px] uppercase border border-indigo-900/30">RECOVERED</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Performance Delta Heatmap Visualizer */}
                      <ScorecardHeatmap
                        activeWorkflow={activeWorkflow}
                        baselineLogs={baselineLogs}
                        perturbedLogs={perturbedLogs}
                        perturbationType={perturbationType}
                      />

                      {/* Resilience Insights Narrative */}
                      <div className="bg-slate-950/85 p-3 border border-slate-900 rounded-xl space-y-1 text-[10.5px] text-slate-400 font-mono leading-relaxed select-all">
                        <span className="text-indigo-400 font-bold uppercase text-[9px] block mb-1">Consistency Audit Diagnosis</span>
                        {perturbationType === 'jitter' ? (
                          <p>
                            <strong>VERDICT: SUPERIOR FAULT ISOLATION.</strong> The multi-agent pipeline successfully absorbed syntactic command noise. The quality checkpoint triggered corrective feedback Loops, directing the writer to clean debugging commands before final packing. Out of box zero-trust integrity score is pristine.
                          </p>
                        ) : perturbationType === 'extreme' ? (
                          <p>
                            <strong>VERDICT: LOGICAL CONSISTENCY MAINTAINED.</strong> Stress-testing with heavily expanded payload context details incurred a <strong>+{baselineTokens > 0 ? (((perturbedTokens - baselineTokens) / baselineTokens) * 100).toFixed(0) : '0'}% context expansion</strong>. Caching mechanisms successfully mitigated token throughput limits, ensuring stable formatting specifications without architectural drift.
                          </p>
                        ) : (
                          <p>
                            <strong>VERDICT: SECURE STUB REMEDIATION.</strong> Ingress layer successfully intercepted depleted void parameters. Fallen back to secure standard templates to shield downstream agents from nil pointers, verifying high fallback logic consistency under extreme cold-calls.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div ref={terminalRef} className="flex-1 overflow-y-auto space-y-3 scrollbar-thin max-h-[320px] font-mono text-[11px] leading-relaxed">
                    <AnimatePresence initial={false}>
                      {filteredLogs.map((step, idx) => {
                        const isStepFailed = step.status === 'failed';
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                            className="space-y-1 bg-slate-900/40 p-3 rounded-xl border border-slate-900"
                          >
                            <div className="flex items-center justify-between text-[10px] border-b border-slate-900 pb-1 text-slate-500 select-none">
                              <span className="font-bold flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full inline-block ${isStepFailed ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                                {step.nodeName}
                              </span>
                              <span>{step.timestamp}</span>
                            </div>

                            <p className="text-slate-300 font-mono font-medium">{step.message}</p>

                            <div className="mt-2.5 space-y-2 text-[10px] bg-slate-950 p-3 rounded-xl border border-slate-900">
                              <div>
                                <span className="text-indigo-400 font-bold uppercase select-none block">Input Context Received:</span>
                                <div className="text-slate-400 font-mono whitespace-pre-wrap mt-1 leading-relaxed">{step.inputReceived}</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900 mt-2">
                                <span className="text-emerald-400 font-bold uppercase select-none block">Produced Deliverable:</span>
                                <div className="text-slate-200 font-mono whitespace-pre-wrap mt-1 leading-relaxed">{step.outputProduced}</div>
                              </div>

                              {step.feedbackNote && (
                                <div className="mt-1.5 pt-1.5 border-t border-rose-950 text-rose-300 bg-rose-950/20 p-1.5 rounded">
                                  <span className="font-bold uppercase text-rose-400 block select-none">⚠️ Failed Gate Check Feedback:</span>
                                  <p className="text-[10px] mt-0.5 whitespace-pre-wrap">{step.feedbackNote}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {logsToDisplay.length > 0 && filteredLogs.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 border border-dashed border-slate-800 p-8 rounded-2xl font-mono py-12 select-none animate-fade-in">
                        <Search className="w-7 h-7 text-indigo-400 opacity-60 mb-2 animate-bounce" />
                        <span className="font-bold text-xs text-slate-300 block">No matching trace frames</span>
                        <span className="text-[10.5px] text-slate-500 mt-1.5 max-w-[280px]">No matches found for "{logSearchQuery}" using this filter layout.</span>
                        <button
                          onClick={() => {
                            setLogSearchQuery('');
                            setLogAgentFilter('all');
                          }}
                          className="mt-4 px-3.5 py-1.5 bg-indigo-600/35 hover:bg-indigo-650 hover:bg-opacity-80 border border-indigo-500/40 text-indigo-200 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          Clear Filter Layout safely
                        </button>
                      </div>
                    )}

                    {logsToDisplay.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 font-mono py-12 select-none">
                        <Terminal className="w-8 h-8 opacity-20 mb-2 animate-bounce" />
                        <span>Trace output idle. Click Launch Simulation above to view active runs.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reset button inside terminal wrapper */}
                {simulatedLogsPlayed.length > 0 && !isSimulating && (
                  <button
                    onClick={resetSimulationState}
                    className="mt-3 w-full border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 py-1.5 rounded-lg text-[10px] font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear simulation history</span>
                  </button>
                )}

              </div>

            </div>

          </section>

        </main>
      </>
    )}

      </div>

      {/* Footer Area */}
      <footer className="mt-12 border-t border-slate-200/80 pt-6 text-center text-[11px] text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between max-w-7xl w-full mx-auto gap-3">
        <span>Designed & Verified using @google/genai Multi-Agent design rules.</span>
        <div className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active Agency Sandbox Engine</span>
        </div>
      </footer>

      {/* Floating sliding right Drawer Overlay for Agents/Gates specifications inspection */}
      <AnimatePresence>
        {selectedNodeId && (
          <SpecificationDrawer
            system={activeWorkflow}
            selectedNodeId={selectedNodeId}
            selectedNodeType={selectedNodeType}
            onClose={() => {
              setSelectedNodeId(null);
              setSelectedNodeType(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
