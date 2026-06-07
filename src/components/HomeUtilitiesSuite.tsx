import { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Calculator,
  ShieldCheck,
  Bot,
  ChevronRight,
  PlusCircle,
  HelpCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface HomeUtilitiesSuiteProps {
  onApplyPrompt: (prompt: string) => void;
  triggerNotice: (msg: string) => void;
  userPlan: 'free' | 'pro' | 'team';
}

export function HomeUtilitiesSuite({ onApplyPrompt, triggerNotice, userPlan }: HomeUtilitiesSuiteProps) {
  const [activeTab, setActiveTab] = useState<'enhancer' | 'savings' | 'pricing' | 'security' | 'roles'>('enhancer');

  // Utility 1: Prompt Enhancer State
  const [optimizerInput, setOptimizerInput] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState('');

  // Utility 2: ROI Savings Calculator State
  const [developerCount, setDeveloperCount] = useState(4);
  const [hourlyRate, setHourlyRate] = useState(1200); // INR per hour avg
  const [tasksPerMonth, setTasksPerMonth] = useState(15);
  const [complexity, setComplexity] = useState<'simple' | 'moderate' | 'complex'>('moderate');

  // Utility 3: Token Pricing Estimator State
  const [modelType, setModelType] = useState<'flash' | 'pro'>('flash');
  const [dailyRequests, setDailyRequests] = useState(250);
  const [avgTokensPrompt, setAvgTokensPrompt] = useState(3000);
  const [avgTokensOutput, setAvgTokensOutput] = useState(1500);

  // Utility 4: Security Shield State
  const [evalPrompt, setEvalPrompt] = useState('');
  const [evalResult, setEvalResult] = useState<{
    score: number;
    grade: 'A' | 'B' | 'C' | 'F';
    vulnerabilities: string[];
    risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  } | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Utility 5: Custom Role Generator
  const [crewGenre, setCrewGenre] = useState('E-commerce Logistics');
  const [customCrewResult, setCustomCrewResult] = useState<{
    title: string;
    description: string;
    agents: { name: string; role: string; instruction: string }[];
  } | null>(null);
  const [isGeneratingCrew, setIsGeneratingCrew] = useState(false);

  // 1. Process Prompt Enhancing
  const handleEnhancePrompt = () => {
    if (!optimizerInput.trim()) {
      triggerNotice('Please type a raw idea first!');
      return;
    }
    setIsEnhancing(true);
    setTimeout(() => {
      const phrases = [
        "Create an autonomous Multi-Agent hierarchy with an engineering feedback controller loop.",
        "Implement explicit sanity checker gates to protect transport data payloads against unexpected mutations.",
        "Equip downstream processing agents with zero-trust API validation and tokenized audit logs.",
        "Incorporate secure error correction protocols to redirect anomalous code block formats automatically."
      ];
      const randomizedPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      const enhanced = `SYSTEM SPECIFICATION TASK: ${optimizerInput.trim()}\n\n[ROBUSTNESS REQUIREMENTS]\n- Establish an autonomous Multi-Agent hierarchy\n- ${randomizedPhrase}\n- Define DDL schemas and continuous integration tests with strict telemetry bounds.`;
      
      setEnhancedResult(enhanced);
      setIsEnhancing(false);
      triggerNotice('ARES-9 enhanced the prompt with optimal compiler constraints!');
    }, 1000);
  };

  // 2. Savings Computations
  const computedROI = () => {
    const hoursMultiplier = complexity === 'simple' ? 8 : complexity === 'moderate' ? 24 : 72;
    const humanTotalHours = tasksPerMonth * developerCount * hoursMultiplier;
    const humanMonthlyCost = humanTotalHours * hourlyRate;

    // AI Pipeline takes ~5% of human active hours due to automation
    const aiTotalHours = Math.round(humanTotalHours * 0.045);
    const aiMonthlyCost = aiTotalHours * hourlyRate; // Or cost of tokens (tiny comparison)
    const savingsAmount = humanMonthlyCost - aiMonthlyCost;
    const hoursSaved = humanTotalHours - aiTotalHours;

    return {
      humanTotalHours,
      humanMonthlyCost,
      aiTotalHours,
      aiMonthlyCost,
      savingsAmount,
      hoursSaved
    };
  };

  const roi = computedROI();

  // 3. Token Pricing Computational logic
  const computedTokenCosts = () => {
    // Pricing per 1M tokens (approx in INR)
    // Flash: Input = ₹6.5, Output = ₹25
    // Pro: Input = ₹250, Output = ₹830
    const rates = modelType === 'flash' 
      ? { input: 6.5 / 1000000, output: 25 / 1000000 }
      : { input: 250 / 1000000, output: 830 / 1000000 };

    const dailyInputTokens = dailyRequests * avgTokensPrompt;
    const dailyOutputTokens = dailyRequests * avgTokensOutput;

    const dailyCost = (dailyInputTokens * rates.input) + (dailyOutputTokens * rates.output);
    const monthlyCost = dailyCost * 30.4;

    return {
      dailyInputTokens,
      dailyOutputTokens,
      dailyCost: dailyCost.toFixed(2),
      monthlyCost: Math.round(monthlyCost).toLocaleString('en-IN')
    };
  };

  const costData = computedTokenCosts();

  // 4. Prompt Auditor Execution
  const handleSecurityAudit = () => {
    if (!evalPrompt.trim()) {
      triggerNotice('Please provide a sample prompt to inspect!');
      return;
    }
    setIsAuditing(true);
    setTimeout(() => {
      const lower = evalPrompt.toLowerCase();
      const vulnerabilities: string[] = [];
      let score = 96;

      if (lower.includes('bypass') || lower.includes('override') || lower.includes('ignore instructions')) {
        vulnerabilities.push('High vulnerability: Direct Prompt Injection Bypass vectors.');
        score -= 30;
      }
      if (lower.includes('password') || lower.includes('secret') || lower.includes('credentials') || lower.includes('database')) {
        vulnerabilities.push('Medium risk: Potential credential leak vector in prompt context.');
        score -= 15;
      }
      if (lower.includes('transfer') || lower.includes('offshore') || lower.includes('money') || lower.includes('payment')) {
        vulnerabilities.push('Risk: Dynamic financial transactions require mandatory human-in-the-loop validation.');
        score -= 20;
      }
      if (lower.length < 15) {
        vulnerabilities.push('Advisory: Prompt is too short. Vague instructions foster stochastic hallucinations.');
        score -= 10;
      }

      let grade: 'A' | 'B' | 'C' | 'F' = 'A';
      let risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

      if (score < 40) {
        grade = 'F';
        risk = 'CRITICAL';
      } else if (score < 65) {
        grade = 'C';
        risk = 'HIGH';
      } else if (score < 85) {
        grade = 'B';
        risk = 'MEDIUM';
      }

      setEvalResult({
        score,
        grade,
        vulnerabilities: vulnerabilities.length > 0 ? vulnerabilities : ['Zero-Trust checks passed. Visually clean payload constraints.'],
        risk
      });
      setIsAuditing(false);
      triggerNotice('Prompt Zero-Trust audit complete!');
    }, 850);
  };

  // 5. Custom Quick Role Generator
  const handleGenerateCustomCrew = () => {
    if (!crewGenre.trim()) {
      triggerNotice('Describe a theme for the AI Crew!');
      return;
    }
    setIsGeneratingCrew(true);
    setTimeout(() => {
      const domain = crewGenre.match(/^[a-zA-Z\s]+/) ? crewGenre.trim() : "Automated Delivery Node";
      const customizedResult = {
        title: `${domain} Optimization Pipeline`,
        description: `Bespoke multi-agent coordination workflow to oversee ${domain} pipelines cleanly.`,
        agents: [
          {
            name: `${domain} Strategist`,
            role: "Strategy & Optimization Decoupler",
            instruction: "You are responsible for ingest strategy. Break down raw requirements into machine-executable microcommands."
          },
          {
            name: `${domain} Developer`,
            role: "Technical Execution Synthesis Engine",
            instruction: "You translate task blueprints directly into high-fidelity functional source code blocks and automation scripts."
          },
          {
            name: `${domain} Audit inspector`,
            role: "Security & Zero-Trust Certification Officer",
            instruction: "You strictly audit active logs and codeblocks against performance standards and vulnerability checklists."
          }
        ]
      };
      setCustomCrewResult(customizedResult);
      setIsGeneratingCrew(false);
      triggerNotice('Generated system schema!');
    }, 900);
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-xl max-w-4xl mx-auto space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-500 animate-pulse" />
            ARES-9 Interactive Utilities Suite
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            CHOOSE AN EXTRA TOOL FROM THE BENTO SUITE • READY FOR OFFLINE PLAYGROUND OR SYSTEM SYNTHESIS
          </p>
        </div>
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveTab('enhancer')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'enhancer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🪄 Enhancer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('savings')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'savings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📊 ROI Savings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'pricing' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            💰 Tokens Cost
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'security' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🛡️ Security Shield
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'roles' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🧬 Role Generator
          </button>
        </div>
      </div>

      {/* Tab Area Content */}
      <div className="space-y-4">

        {/* 1. PROMPT ENHANCER TAB */}
        {activeTab === 'enhancer' && (
          <div className="space-y-4 animate-fade-in text-slate-800">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Multi-Agent Prompt Optimizer
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Provide a raw micro-idea of your platform below. ARES-9 will rewrite your prompt to inject structured audit compliance loops, fail-safe heuristics, and clear agent-to-agent interface protocols automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              <div className="space-y-2 flex flex-col justify-between">
                <textarea
                  value={optimizerInput}
                  onChange={(e) => setOptimizerInput(e.target.value)}
                  placeholder="e.g. Build a stock trading analyzer which generates a daily pdf of key tech metrics..."
                  className="w-full h-32 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 font-sans leading-relaxed resize-none shadow-inner"
                />
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing}
                  className="w-full bg-slate-950 hover:bg-slate-800 text-white font-mono font-bold uppercase text-[10px] py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-900 shadow-sm disabled:opacity-55"
                >
                  {isEnhancing ? 'Enhancing system specs...' : '🪄 Compute Optimal Engineering Prompt'}
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 flex flex-col justify-between relative">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-500">
                    ARES-9 OPTIMIZED PROMPT OUTPUT
                  </span>
                  <div className="text-[11px] font-mono text-slate-600 bg-white p-3 rounded-lg border border-slate-100 max-h-36 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                    {enhancedResult || 'Output will appear here. Insert raw specifications inside the input box and click optimize.'}
                  </div>
                </div>

                {enhancedResult && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyPrompt(enhancedResult);
                      triggerNotice('Applied optimized blueprint prompt directly to primary search bar!');
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold uppercase text-[10px] py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all"
                  >
                    <span>⚡ Use This Prompt Now</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. ROI SAVINGS CALCULATOR TAB */}
        {activeTab === 'savings' && (
          <div className="space-y-4 animate-fade-in text-slate-800">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Pipeline ROI & Development Hours Saved
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Compare multi-agent system execution costs and speed against a human developer team. Enter your average team metrics to view automated compound savings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Sliders Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 text-xs font-sans">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Developer Team Size</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded text-indigo-600 font-extrabold border border-slate-200 shadow-sm">
                      {developerCount} engineers
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={developerCount}
                    onChange={(e) => setDeveloperCount(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg accent-indigo-600 appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Average Developer Rate (INR/Hour)</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded text-indigo-600 font-extrabold border border-slate-200 shadow-sm">
                      ₹{hourlyRate}/hr
                    </span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="3000"
                    step="50"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg accent-indigo-600 appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Tasks Compiled Per Month</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded text-indigo-600 font-extrabold border border-slate-200 shadow-sm">
                      {tasksPerMonth} systems
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={tasksPerMonth}
                    onChange={(e) => setTasksPerMonth(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg accent-indigo-600 appearance-none cursor-pointer"
                  />
                </div>

                {/* Complexity Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Task Complexity Tier</span>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/50 rounded-lg">
                    {(['simple', 'moderate', 'complex'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setComplexity(lvl)}
                        className={`py-1 text-center rounded text-[10px] font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                          complexity === lvl 
                            ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                            : 'text-slate-500 hover:text-slate-800 bg-transparent'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats Output */}
              <div className="bg-slate-950 text-white p-5 rounded-2xl border border-slate-800 space-y-4 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none scale-150">
                  <TrendingUp className="w-16 h-16" />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                    MONTHLY METRICS ENGINE REPORT
                  </span>
                  <h4 className="text-xs text-slate-300">
                    By migrating this tier of software work to automated Multi-Agent Crews:
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-900">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">Developer Time Saved</span>
                    <strong className="text-xl font-bold font-mono text-indigo-300">
                      {roi.hoursSaved} hours/mo
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">Compound Cost Saved</span>
                    <strong className="text-xl font-bold font-mono text-emerald-400">
                      ₹{roi.savingsAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-[10.5px] text-slate-400 font-sans leading-relaxed">
                  <p>
                     Human Execution Cost: <strong className="text-rose-400 font-mono">₹{roi.humanMonthlyCost.toLocaleString('en-IN')}</strong> ({roi.humanTotalHours} active hours)
                  </p>
                  <p>
                     ARES-9 Autonomous Cost: <strong className="text-emerald-400 font-mono">₹{roi.aiMonthlyCost.toLocaleString('en-IN')}</strong> (~{roi.aiTotalHours} processing hours)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. GEMINI API TOKENS COST ESTIMATOR */}
        {activeTab === 'pricing' && (
          <div className="space-y-4 animate-fade-in text-slate-800">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-500" />
                Gemini API Token Pricing Estimator
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Formulate estimated Google Cloud API token expenditures in Indian Rupees. Configure predicted daily requests and contextual token loads below.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Form Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans space-y-3.5 text-xs">
                
                {/* Model Selector */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Target Reasoner Model</span>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/50 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setModelType('flash')}
                      className={`py-1 rounded text-[10px] font-mono uppercase font-bold text-center cursor-pointer transition-all ${
                        modelType === 'flash' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Gemini 1.5 Flash (Economy)
                    </button>
                    <button
                      type="button"
                      onClick={() => setModelType('pro')}
                      className={`py-1 rounded text-[10px] font-mono uppercase font-bold text-center cursor-pointer transition-all ${
                        modelType === 'pro' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Gemini 1.5 Pro (Enterprise)
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Daily API Calls</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded text-indigo-600 font-extrabold border border-slate-200 shadow-sm">
                      {dailyRequests} calls
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="50"
                    value={dailyRequests}
                    onChange={(e) => setDailyRequests(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg accent-indigo-600 appearance-none cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Avg Prompt Input Tokens</span>
                    <input
                      type="number"
                      value={avgTokensPrompt}
                      onChange={(e) => setAvgTokensPrompt(parseInt(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs text-indigo-600 font-bold focus:border-indigo-400 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Avg Output Tokens</span>
                    <input
                      type="number"
                      value={avgTokensOutput}
                      onChange={(e) => setAvgTokensOutput(parseInt(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs text-indigo-600 font-bold focus:border-indigo-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Estimation Details */}
              <div className="bg-white border-2 border-indigo-400/20 p-5 rounded-2xl space-y-4 flex flex-col justify-between relative shadow-lg">
                <span className="absolute top-2.5 right-2.5 text-[8.5px] text-indigo-600 font-mono border border-indigo-200 px-2 py-0.5 bg-indigo-50/50 rounded-full font-bold uppercase">
                  Google cloud metrics
                </span>

                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-600 block">
                    COMPUTED MOUNTAIN TOKEN OVERVIEW
                  </span>
                  <div className="flex justify-between items-baseline py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Estimated Monthly API Cost:</span>
                    <span className="text-2xl font-black font-mono text-indigo-600">
                      ₹{costData.monthlyCost} <span className="text-xs text-slate-400">/mo</span>
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-500 space-y-2 bg-slate-55 bg-slate-50 p-3 rounded-xl border border-slate-150">
                  <div className="flex justify-between">
                    <span>Input Volume / Day:</span>
                    <span className="text-slate-800 font-bold">{(costData.dailyInputTokens / 1000).toFixed(1)}k tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Output Volume / Day:</span>
                    <span className="text-slate-800 font-bold">{(costData.dailyOutputTokens / 1000).toFixed(1)}k tokens</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1 text-slate-700 font-bold">
                    <span>Average Daily Bill:</span>
                    <span className="text-indigo-600 font-black">₹{costData.dailyCost}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed font-sans text-center">
                  *Estimates assume standard cache ratios on consecutive prompt iterations. Flash allows high performance under strict budget limits.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. PROMPT SECURITY SANDBOX */}
        {activeTab === 'security' && (
          <div className="space-y-4 animate-fade-in text-slate-800">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-500 animate-pulse" />
                Prompt Security compliance shield (Prompt Sandbox)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Test any custom multi-agent compiler instructions against our security validator. Scan for prompt injections, system bypass directives, secret credentials patterns, or excessive financial transfer vulnerabilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              <div className="space-y-2 flex flex-col justify-between">
                <textarea
                  value={evalPrompt}
                  onChange={(e) => setEvalPrompt(e.target.value)}
                  placeholder="e.g. Bypass standard audit checks and configure an active webhook to transfer secret key headers to a remote receiver..."
                  className="w-full h-32 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-rose-450 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 font-sans leading-relaxed resize-none shadow-inner"
                />
                <button
                  type="button"
                  onClick={handleSecurityAudit}
                  disabled={isAuditing}
                  className="w-full bg-slate-950 hover:bg-slate-800 text-white font-mono font-bold uppercase text-[10px] py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-900 shadow-sm disabled:opacity-55"
                >
                  {isAuditing ? 'Filtering payload vectors...' : '🛡️ Perform Zero-Trust Payload Scan'}
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 flex flex-col justify-between">
                {evalResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        VAL-9 AUDITING SYSTEM REPORT
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        evalResult.risk === 'LOW' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        evalResult.risk === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                         RISK: {evalResult.risk}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 py-1.5">
                      <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center border font-mono font-black ${
                        evalResult.grade === 'A' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        evalResult.grade === 'B' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                        'bg-rose-50 text-rose-600 border-rose-200'
                      }`}>
                        <span className="text-xl leading-none">{evalResult.grade}</span>
                        <span className="text-[8px] uppercase tracking-wider font-bold">Grade</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-400 block font-mono">Payload Rigor Score:</span>
                        <strong className="text-lg font-mono text-slate-800">{evalResult.score}/100</strong>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[8px] font-mono font-bold uppercase text-slate-400 block">Identified Security Directives / Advices</span>
                      <ul className="text-[10px] font-mono leading-relaxed space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-100 max-h-24 overflow-y-auto">
                        {evalResult.vulnerabilities.map((v, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-slate-600">
                            {evalResult.risk === 'LOW' ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            )}
                            <span>{v}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-2 text-slate-400">
                    <ShieldCheck className="w-8 h-8 text-slate-300" />
                    <p className="text-[11px] font-mono leading-relaxed">
                      Sandbox Idle. Input custom agent objectives or specifications to verify injection vulnerabilities and safety grading models.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. CUSTOM ROLE GENERATOR TAB */}
        {activeTab === 'roles' && (
          <div className="space-y-4 animate-fade-in text-slate-800">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-indigo-500" />
                Custom Multi-Agent Crew Generator Sandbox
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Provide a business domain name below. ARES-9 will generate a mock team of three specialized autonomous agents complete with operational roles, descriptions, and system instructions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              <div className="space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Business Theme / Target Sector</label>
                  <input
                    type="text"
                    value={crewGenre}
                    onChange={(e) => setCrewGenre(e.target.value)}
                    placeholder="e.g. Healthcare Diagnostics, Real Estate Arbitrage, Offshore Cargo"
                    className="w-full p-2.5 bg-slate-50 font-mono border border-slate-250 border-slate-200 rounded-xl focus:bg-white text-xs text-slate-700 outline-none focus:border-indigo-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerateCustomCrew}
                  disabled={isGeneratingCrew}
                  className="w-full bg-slate-950 hover:bg-slate-800 text-white font-mono font-bold uppercase text-[10px] py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-900 shadow-sm disabled:opacity-55"
                >
                  {isGeneratingCrew ? 'Creating mock system characters...' : '🧬 Synthesize Specialist Agent Crew Roles'}
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 flex flex-col justify-between">
                {customCrewResult ? (
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-500">
                      AUTONOMOUS MOCK CREW OVERVIEW
                    </span>
                    <strong className="text-xs font-bold text-slate-800 block leading-tight">{customCrewResult.title}</strong>
                    
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {customCrewResult.agents.map((agNode, idx) => (
                        <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-100 font-mono text-[9.5px] text-slate-600 leading-normal space-y-1">
                          <strong className="text-indigo-600 block text-[10.5px]">🤖 {agNode.name}</strong>
                          <p>Role: <span className="font-bold text-slate-700">{agNode.role}</span></p>
                          <p className="text-slate-400 text-[8.5px]">Instruction: "{agNode.instruction}"</p>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const builtPrompt = `Build an autonomous system in the ${crewGenre.trim()} domain targeting continuous integration. Enable verification audit checks to ensure absolute accuracy.`;
                        onApplyPrompt(builtPrompt);
                        triggerNotice('Bespoke domain workflow applied to your launcher query!');
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold uppercase text-[10px] py-1.5 rounded-lg text-center transition-all cursor-pointer"
                    >
                      🚀 Import This Workflow Design
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-2 text-slate-400">
                    <Bot className="w-8 h-8 text-slate-300 animate-bounce" />
                    <p className="text-[11px] font-mono leading-relaxed">
                      Theme Generator Idle. Input your desired business domain to synthesize customized software roles and backstories.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
