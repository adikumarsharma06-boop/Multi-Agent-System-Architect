import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { authRouter, requireSession } from './server/authService.js';
import { projectRouter } from './server/projectService.js';

dotenv.config();

const app = express();
const PORT = 3000;

function getUserPlan(userId: string): 'free' | 'pro' | 'team' {
  try {
    const usersFile = path.join(process.cwd(), 'users-db.json');
    if (fs.existsSync(usersFile)) {
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
      const user = users.find((u: any) => u.id === userId);
      return user?.plan || 'free';
    }
  } catch (err) {
    console.error('Error fetching user plan:', err);
  }
  return 'free';
}

app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);

// Helper for lazy loading Gemini Client to prevent start-up crashes
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not defined in Secrets.');
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// 1. API: Design a custom Multi-Agent system for a given task description
app.post('/api/architect/design', requireSession, async (req: any, res) => {
  try {
    const { taskDescription } = req.body;
    if (!taskDescription || typeof taskDescription !== 'string') {
      res.status(400).json({ error: 'Please provide a valid taskDescription string.' });
      return;
    }

    const userId = req.session.userId;
    const userPlan = getUserPlan(userId);

    // Enforce limits for free plan
    if (userPlan === 'free') {
      const todayStr = new Date().toISOString().split('T')[0];
      const projectsFile = path.join(process.cwd(), 'projects-db.json');
      let projectsCount = 0;
      if (fs.existsSync(projectsFile)) {
        const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));
        projectsCount = projects.filter((p: any) => p.user_id === userId && p.created_at.startsWith(todayStr)).length;
      }
      if (projectsCount >= 5) {
        res.status(403).json({
          error: 'Daily generation limit reached! Under the Free Plan, you can generate/save up to 5 projects per day. Please upgrade your plan in your profile to Pro or Team for unlimited generations!',
          limitType: 'DAILY_LIMIT'
        });
        return;
      }
    }

    const ai = getGeminiClient();
    const systemPrompt = `You are a Principal AI Systems Architect. Decompose any user-described task into a multi-agent AI system.
You MUST write a highly structured, valid JSON object that adheres strictly to this exact TypeScript specification.
Your designed system MUST contain:
- Exactly 3 to 4 highly-focused agents that form a sequential or parallel pipelines.
- Exactly 1 Quality Assurance / Verification Gate which acts as a validation node and utilizes feedback loops.
- Flow edges connecting the agents and gates correctly (using type 'standard_route', 'validation_pass', 'validation_fail', etc.). Edge sourceId and targetId MUST point to existing agents or gates.
- Failure handling policies describing max retry budgets, alerting channels, and fallback triggers.
- Prompt and cost optimization strategies.
- Scalability patterns (event subscription models, agent orchestration design).

Provide deep, technical, professional content inside the descriptions, inputs, outputs, system instructions, and routing edges. No hand-waving or placeholders. Ensure node IDs are simple strings like "planner", "writer", "reviewer", "publisher".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Design a high-fidelity multi-agent system for this task: "${taskDescription}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['task', 'agents', 'gates', 'edges', 'failureHandling', 'optimization', 'scalability'],
          properties: {
            task: { type: Type.STRING, description: "Descriptive title of the core multi-agent system's objective" },
            agents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['id', 'name', 'role', 'description', 'intelligenceTier', 'inputs', 'outputs', 'tools', 'systemInstruction', 'decisionLogic', 'costOptimization'],
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING, description: "Professional agent name (e.g., 'Creative UX Copywriter')" },
                  role: { type: Type.STRING, description: "Clear focus area or technical specialty" },
                  description: { type: Type.STRING, description: "Clear explanation of what this agent does in the system" },
                  intelligenceTier: { type: Type.STRING, enum: ['gemini-3.5-flash', 'gemini-3.1-pro-preview'] },
                  inputs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Prerequisites data packets needed" },
                  outputs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific deliverables created" },
                  tools: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tools utilized (e.g. ['ESLint Scanner', 'Benfords Law Analyzer'])" },
                  systemInstruction: { type: Type.STRING, description: "The strict core persona and formatting constraints injected into this agent's system prompt context" },
                  decisionLogic: { type: Type.STRING, description: "Logic validation checklists or evaluation heuristics this agent applies" },
                  costOptimization: { type: Type.STRING, description: "How this agent minimizes tokens (e.g. caching schemas, shallow AST parses)" }
                }
              }
            },
            gates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['id', 'name', 'reviewerAgentId', 'criteria', 'testAsserts', 'ifPassedTargetNodeId', 'ifFailedTargetNodeId', 'feedbackProtocol'],
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING, description: "e.g. 'Security Compliance audit check'" },
                  reviewerAgentId: { type: Type.STRING, description: "ID of the agent that performs audit logic on this gate" },
                  criteria: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Conditions to pass" },
                  testAsserts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Executable or checklist pseudo-assert statements" },
                  ifPassedTargetNodeId: { type: Type.STRING, description: "Node ID to route to if checks pass" },
                  ifFailedTargetNodeId: { type: Type.STRING, description: "Node ID to route back to for reconstruction feedback" },
                  feedbackProtocol: { type: Type.STRING, description: "How failure logs are structured and dispatched" }
                }
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['id', 'sourceId', 'targetId', 'type', 'label'],
                properties: {
                  id: { type: Type.STRING },
                  sourceId: { type: Type.STRING },
                  targetId: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['standard_route', 'validation_pass', 'validation_fail', 'feedback_loop', 'fallback_route'] },
                  label: { type: Type.STRING, description: "What flows through this path (e.g. 'Draft copies', 'Ast error code')" }
                }
              }
            },
            failureHandling: {
              type: Type.OBJECT,
              required: ['maxRetryBudgets', 'fallbackTriggerPolicy', 'alertingChannels', 'circuitBreakerConditions'],
              properties: {
                maxRetryBudgets: { type: Type.INTEGER },
                fallbackTriggerPolicy: { type: Type.STRING },
                alertingChannels: { type: Type.ARRAY, items: { type: Type.STRING } },
                circuitBreakerConditions: { type: Type.STRING }
              }
            },
            optimization: {
              type: Type.OBJECT,
              required: ['promptWrapping', 'cachingStrategy', 'parallelizationOpportunity'],
              properties: {
                promptWrapping: { type: Type.STRING },
                cachingStrategy: { type: Type.STRING },
                parallelizationOpportunity: { type: Type.STRING }
              }
            },
            scalability: {
              type: Type.OBJECT,
              required: ['concurrencyModel', 'agentOrchestrationPattern', 'eventSubscriptionModel'],
              properties: {
                concurrencyModel: { type: Type.STRING },
                agentOrchestrationPattern: { type: Type.STRING },
                eventSubscriptionModel: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || '{}');
    res.json(parsedData);
  } catch (error: any) {
    console.error('Core architect design error:', error);
    res.status(500).json({ error: error.message || 'Failed to design multi-agent system due to internal AI error.' });
  }
});

// 2. API: Generate simulated sequential step-logs for a given custom Multi-Agent system
app.post('/api/architect/simulate', requireSession, async (req: any, res) => {
  try {
    const { system, sampleInput } = req.body;
    if (!system || !system.agents) {
      res.status(400).json({ error: 'Please provide a valid multi-agent system configuration.' });
      return;
    }

    const userId = req.session.userId;
    const userPlan = getUserPlan(userId);

    // If needed, we can also check simulation limits, e.g. Free plan simulation is allowed but restricted
    // Let's add a telemetry audit node log here or enforce checks

    const ai = getGeminiClient();
    const simulationPrompt = `You are an agentic emulator. Given a Multi-Agent AI system design JSON structure and a custom sample task input, emulate a step-by-step trace showing EXACTLY how the agents execute the work, encounter a validation failure on the gate, trigger a feedback loop block, perform a revision rewrite, and successfully pass.
    
You MUST output a valid JSON array of objects representing chronological simulation steps. Each step object must have the following fields:
1. 'nodeId': string (ID of the active agent or gate)
2. 'nodeName': string
3. 'nodeType': 'agent' | 'gate' | 'system'
4. 'status': 'processing' | 'success' | 'failed' | 'feedback_sent'
5. 'message': string (Dynamic explanation of the agent's calculations, thoughts, or actions at this point)
6. 'inputReceived': string (What parameters it read)
7. 'outputProduced': string (The mock code, text, report, or schema it yielded)
8. 'tokensUsed': integer (Simulated token calculation, e.g. 1420)
9. 'simulatedCost': number (USD estimation, e.g. 0.0021)
10. 'feedbackNote': string (Optional. ONLY include this on review gate failures to detail what broke and what needs correction)

Make the content deeply specific, highly realistic, technical, or creative. DO NOT return general placeholders.
Your list of steps MUST show:
- Step 1: Initial ingest agent or planner agent processing of "${sampleInput || 'Default task input'}".
- Step 2: Code or content generation agent creating the draft asset.
- Step 3: Review Gate / Audit checking the draft, finding an elegant error (e.g., missing error checking, off-brand absolute claims, currency balance variance), and failing with status 'failed' and generating a detailed corrective 'feedbackNote'.
- Step 4: The generation agent executing a revision, processing the feedback, and outputting an updated clean asset.
- Step 5: The Review Gate running again, passing successfully with status 'success'.
- Step 6: The release/publisher agent wrapping the build and finishing.

Adhere strictly to this array of objects format.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Simulate step-by-step logs for system: ${JSON.stringify(system)} and custom input: "${sampleInput || 'Standard Run'}"`,
      config: {
        systemInstruction: simulationPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['nodeId', 'nodeName', 'nodeType', 'status', 'message', 'inputReceived', 'outputProduced', 'tokensUsed', 'simulatedCost'],
            properties: {
              nodeId: { type: Type.STRING },
              nodeName: { type: Type.STRING },
              nodeType: { type: Type.STRING, enum: ['agent', 'gate', 'system'] },
              status: { type: Type.STRING, enum: ['processing', 'success', 'failed', 'feedback_sent'] },
              message: { type: Type.STRING },
              inputReceived: { type: Type.STRING },
              outputProduced: { type: Type.STRING },
              tokensUsed: { type: Type.INTEGER },
              simulatedCost: { type: Type.NUMBER },
              feedbackNote: { type: Type.STRING }
            }
          }
        }
      }
    });

    const steps = JSON.parse(response.text || '[]');
    res.json({ steps });
  } catch (error: any) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate simulation.' });
  }
});

// Configure Vite middleware or Static files depending on mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Technical Architect service running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
