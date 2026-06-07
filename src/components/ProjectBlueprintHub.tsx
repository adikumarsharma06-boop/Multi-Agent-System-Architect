import React, { useState } from 'react';
import { 
  FileText, Layers, Database, Code, ShieldCheck, 
  Monitor, DollarSign, Calendar, Cloud, Download, 
  Copy, Check, Sparkles, Flame, CheckCircle, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SimulationStepLog } from '../types';
import { jsPDF } from 'jspdf';

interface ProjectBlueprintHubProps {
  simulatedLogsPlayed: SimulationStepLog[];
  customInputText: string;
}

export const ProjectBlueprintHub: React.FC<ProjectBlueprintHubProps> = ({
  simulatedLogsPlayed,
  customInputText
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'overview' | 'tech' | 'ops'>('all');

  // Parse simulated outputs if available
  const requirementsLog = simulatedLogsPlayed.find(l => l.nodeId === 'requirements_agent' || l.nodeId === 'sys_features');
  const architectLog = simulatedLogsPlayed.find(l => l.nodeId === 'systems_architect' || l.nodeId === 'sys_planner');
  const dbLog = simulatedLogsPlayed.find(l => l.nodeId === 'db_designer');
  const apiLog = simulatedLogsPlayed.find(l => l.nodeId === 'api_designer');
  const securityLog = simulatedLogsPlayed.find(l => l.nodeId === 'security_auditor' || l.nodeId === 'gate_security_check' || l.nodeId === 'gate_security_rules');
  const roadmapLog = simulatedLogsPlayed.find(l => l.nodeId === 'roadmap_generator' || l.nodeId === 'roadmap_coordinator');
  const finalLog = simulatedLogsPlayed.find(l => l.nodeId === 'final_blueprint' || l.nodeId === 'deployment_manager');

  // Helper safe parser for JSON inside outputs
  const safeParseJSON = (text: string | undefined, fallback: any) => {
    if (!text) return fallback;
    try {
      // Find JSON block
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        return JSON.parse(text.slice(startIdx, endIdx + 1));
      }
      return JSON.parse(text);
    } catch {
      try {
        const startArr = text.indexOf('[');
        const endArr = text.lastIndexOf(']');
        if (startArr !== -1 && endArr !== -1) {
          return JSON.parse(text.slice(startArr, endArr + 1));
        }
      } catch {}
      return fallback;
    }
  };

  // Extract variables with strict fallbacks
  const customQuery = customInputText || "Build a 3D animation platform.";

  // 1. Requirements Section Fallback
  const reqData = safeParseJSON(requirementsLog?.outputProduced, {
    complexityScore: "89/100 (High-Complexity Product)",
    estimatedTime: "12 - 16 Weeks to MVP",
    teamRequirements: [
      "1 Lead Graphics Developer (WebGL / Canvas context)",
      "1 Full-Stack Systems Engineer (Real-time synchronization)",
      "1 Cloud DevOps Architect (GPU Batch compute Clusters)",
      "1 UX/UI Interaction Designer"
    ],
    features: [
      "Interactive multi-layer WebGL Workspace Studio component",
      "Dynamic spline-based Timeline editor with keyframe interpolation",
      "Drag-and-drop support for heavy glTF, USDZ, & OBJ resources",
      "RenderQueue orchestrator managing batch GPU background exports"
    ]
  });

  // 2. Systems Architect Fallback
  const archData = safeParseJSON(architectLog?.outputProduced, {
    techStack: {
      frontend: "React 19, TypeScript, Three.js / React Three Fiber, Tailwind CSS, Zustand",
      backend: "Node.js (Express), Socket.io, BullMQ worker nodes",
      database: "PostgreSQL with pgvector extension, Redis distributed cache",
      hosting: "AWS ECS with NVIDIA GPU G4dn instances, Cloudflare CDN, AWS S3 buckets"
    }
  });

  // 3. Database Designer Fallback
  const dbDataSchema = dbLog?.outputProduced || `CREATE TABLE WorkspaceProjects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  project_name VARCHAR(120) NOT NULL,
  webgl_scene_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE RenderJobs (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES WorkspaceProjects(project_id) ON DELETE CASCADE,
  status VARCHAR(24) NOT NULL,
  output_url TEXT,
  cost_spent NUMERIC(10, 4) DEFAULT 0.00
);`;

  // 4. API Designer Fallback
  const apiDataSpec = apiLog?.outputProduced || `paths:
  /api/v1/projects:
    post:
      summary: Initialize new 3D spatial scene
      security:
        - BearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [name]
              properties:
                name: { type: string }
  /api/v1/renders:
    post:
      summary: Dispatch batches GPU render job
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [projectId]
              properties:
                projectId: { type: string, format: uuid }`;

  // 5. Security Auditor Fallback
  const secureChecks = securityLog?.status === 'success' || !securityLog ? {
    authentication: "Strict secure cookies with signature validation and HTTPOnly flag.",
    authorization: "PostgreSQL Row-Level-Security (RLS) validating ownership before operations.",
    passwordStorage: "Upgraded Bcrypt hashing schema forcing 12 stretching salt rounds.",
    rateLimiting: "Custom Redis Rate-limiting applied (10 GPU renders/hour, 120 asset operations/hour).",
    apiSecurity: "Payload dimensions scanner blocking deep recursions of scene JSON configurations."
  } : {
    authentication: "Weak credentials validation identified inside baseline routing checks.",
    authorization: "Open workspace access rules detected.",
    passwordStorage: "Warning: Salt strength defined as 10 (System requires a minimum of 12 rounds).",
    rateLimiting: "Error: No throttle rates established on heavy computational hooks.",
    apiSecurity: "Over-permissive upload boundaries detected."
  };

  // 6. Roadmap Generator Fallback
  const roadmapData = safeParseJSON(roadmapLog?.outputProduced, [
    { week: "Week 1", topic: "3D Spatial State Modeling: Three.js canvas setup, scene saving logic" },
    { week: "Week 2", topic: "Timeline mechanics: Keyframe creation, bezier path calculations" },
    { week: "Week 3", topic: "WebSocket broker: Real-time user cursor sync and lock sharing" },
    { week: "Week 4", topic: "GPU render workers: Dockerizing render processes, AWS queue setups, load verification" }
  ]);

  // 7. Final Blueprint / Cost Fallback
  const finalEstimates = safeParseJSON(finalLog?.outputProduced, {
    costEstimates: {
      developmentCost: "₹25,00,000–₹50,05,000 ($30,000–$60,000)",
      monthlyServerCost: "₹35,000–₹1,20,000 ($400–$1,500) (High-end AWS GPU compute systems included)"
    },
    uiScreens: [
      "Studio Workspace 3D Canvas Editor screen (ThreeJS, Material Library, Keyframe Slider)",
      "Project Dashboard manager (glTF file explorer, billing overview, usage graphs)",
      "GPU Render Jobs queue panel (active renders status list, historical MP4 downloads)"
    ]
  });

  // Handle Actionable Copy Feedback
  const handleCopy = (sectionId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Complete blueprint JSON aggregation
  const buildComprehensiveBlueprint = () => {
    return {
      metadata: {
        rawIdea: customQuery,
        generatedAt: new Date().toLocaleDateString(),
        version: "1.0.0-PRO-BLUEPRINT"
      },
      requirementsAnalysis: {
        complexity: reqData.complexityScore,
        timeline: reqData.estimatedTime,
        teamNeeded: reqData.teamRequirements,
        mvpFeatures: reqData.features
      },
      architecturalStack: archData.techStack,
      relationalSchema: dbDataSchema,
      restApiSpecifications: apiDataSpec,
      securityPolicies: secureChecks,
      sprintSchedule: roadmapData,
      financialPlanning: finalEstimates.costEstimates,
      uiScreenBlueprint: finalEstimates.uiScreens,
      deploymentConfigs: {
        dockerfile: `FROM node:22-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:22-alpine-slim AS run\nWORKDIR /app\nCOPY --from=build /app/dist ./dist\nCOPY --from=build /app/package*.json ./\nRUN npm ci --omit=dev\nUSER node\nEXPOSE 3000\nCMD ["node", "dist/server.cjs"]`
      }
    };
  };

  const handleDownloadBlueprintFile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(buildComprehensiveBlueprint(), null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `project-blueprint-${customQuery.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const dockerfileCode = `FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine-slim AS run
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
USER node
EXPOSE 3000
CMD ["node", "dist/server.cjs"]`;

  const handleDownloadBlueprintPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let pageNum = 1;

    const drawPageHeader = () => {
      doc.setFillColor(15, 23, 42); // slate-900 background
      doc.rect(15, 8, 180, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('ARES-9 ENTERPRISE SYSTEM BLUEPRINT REPORT', 24, 13.5);
      
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`PAGE ${pageNum}`, 185, 13.5, { align: 'right' });
      
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.line(15, 17, 195, 17);
    };

    // Styling Cover Banner on Page 1
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(15, 15, 180, 32, 'F');

    doc.setFillColor(99, 102, 241); // indigo-500
    doc.rect(15, 15, 3, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ARES-9 COGNITIVE COMPILER OUTPUT', 24, 25);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(165, 180, 252); // indigo-300
    doc.text('ARES-9 SYSTEM SPECIFICATION HUB | PRODUCTION ARCHITECTURE REPORT', 24, 30);

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    const titleLines = doc.splitTextToSize(`TARGET PROJECT SCENE: "${customQuery}"`, 160);
    doc.text(titleLines, 24, 36);

    // Details meta row
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(15, 47, 180, 10, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, 47, 180, 10, 'S');

    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`GENERATED ON: ${new Date().toLocaleDateString()}`, 20, 53.5);
    doc.text('DOCUMENT VERSION: 1.0.0-PRO-BLUEPRINT', 95, 53.5);
    doc.text('CLASSIFICATION: INTEL SYSTEM INTERNAL', 150, 53.5);

    let currentY = 66;

    const drawTextLinesPerLine = (
      text: string, 
      x: number, 
      lineSpacing: number, 
      fontSize: number, 
      style: 'normal' | 'bold' = 'normal', 
      fontType: 'Helvetica' | 'Courier' = 'Helvetica', 
      color?: [number, number, number], 
      customLineWidth?: number
    ) => {
      doc.setFont(fontType, style);
      doc.setFontSize(fontSize);
      if (color) {
        doc.setTextColor(color[0], color[1], color[2]);
      } else {
        doc.setTextColor(30, 41, 59);
      }
      const maxW = customLineWidth || (180 - (x - 15));
      const wrapped = doc.splitTextToSize(text, maxW);
      wrapped.forEach((line: string) => {
        if (currentY + lineSpacing > 275) {
          doc.addPage();
          pageNum += 1;
          drawPageHeader();
          currentY = 25;
          
          doc.setFont(fontType, style);
          doc.setFontSize(fontSize);
          if (color) doc.setTextColor(color[0], color[1], color[2]);
          else doc.setTextColor(30, 41, 59);
        }
        doc.text(line, x, currentY);
        currentY += lineSpacing;
      });
    };

    const drawSectionHeader = (title: string) => {
      if (currentY + 16 > 275) {
        doc.addPage();
        pageNum += 1;
        drawPageHeader();
        currentY = 25;
      }
      
      doc.setFillColor(241, 245, 249);
      doc.rect(15, currentY, 180, 8, 'F');
      
      doc.setFillColor(79, 70, 229);
      doc.rect(15, currentY, 2, 8, 'F');
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(title.toUpperCase(), 19, currentY + 5.5);
      
      currentY += 13;
    };

    const drawCodeBlock = (code: string, languageLabel: string) => {
      const lines = code.split('\n');
      const codeLineSpacing = 4.2;

      if (currentY + 12 > 275) {
        doc.addPage();
        pageNum += 1;
        drawPageHeader();
        currentY = 25;
      }
      
      doc.setFillColor(15, 23, 42); 
      doc.setTextColor(56, 189, 248);
      doc.setFont('Courier', 'bold');
      doc.setFontSize(8);
      doc.text(`/// ${languageLabel.toUpperCase()}`, 18, currentY);
      currentY += 4.5;
      
      lines.forEach((lineText: string) => {
        if (currentY + 5 > 275) {
          doc.addPage();
          pageNum += 1;
          drawPageHeader();
          currentY = 25;
        }
        
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY - 3.5, 180, codeLineSpacing + 0.3, 'F');
        
        doc.setFillColor(148, 163, 184);
        doc.rect(15, currentY - 3.5, 1.5, codeLineSpacing + 0.3, 'F');
        
        doc.setFont('Courier', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        
        const truncatedLine = lineText.length > 90 ? lineText.substring(0, 87) + '...' : lineText;
        doc.text(truncatedLine, 19, currentY);
        currentY += codeLineSpacing;
      });
      
      currentY += 4;
    };

    // 1. Scope
    drawSectionHeader('1. Project Scope Analysis');
    drawTextLinesPerLine(`Complexity Score: ${reqData.complexityScore || "89/100 (High-Complexity Product)"}`, 18, 5.5, 9.5, 'bold', 'Helvetica', [79, 70, 229]);
    drawTextLinesPerLine(`Estimated Timeline: ${reqData.estimatedTime || "12 - 16 Weeks to MVP"}`, 18, 5.5, 9.5, 'bold', 'Helvetica', [15, 23, 42]);
    currentY += 3;

    drawTextLinesPerLine('ESTIMATED TEAM REQUIREMENTS:', 18, 5, 8.5, 'bold', 'Helvetica', [100, 110, 120]);
    (reqData.teamRequirements || []).forEach((t: string) => {
      drawTextLinesPerLine(`• ${t}`, 22, 5, 8.5, 'normal', 'Helvetica');
    });
    currentY += 3;

    drawTextLinesPerLine('MVP CORE SYSTEM FEATURES:', 18, 5, 8.5, 'bold', 'Helvetica', [100, 110, 120]);
    (reqData.features || []).forEach((f: string) => {
      drawTextLinesPerLine(`- ${f}`, 22, 5, 8.5, 'normal', 'Helvetica');
    });
    currentY += 6;

    // 2. Tech Stack
    drawSectionHeader('2. Recommended Architectural Stack');
    const stack = archData.techStack || {};
    drawTextLinesPerLine('FRONTEND ENGINE CLIENT LAYER:', 18, 5, 8.5, 'bold', 'Helvetica', [100, 110, 120]);
    drawTextLinesPerLine(stack.frontend || "React 19, TypeScript, Three.js / React Three Fiber, Tailwind CSS, Zustand", 22, 5, 8.5, 'normal', 'Helvetica');
    currentY += 2.5;

    drawTextLinesPerLine('BACKEND EVENT-LOOP WORKER LAYER:', 18, 5, 8.5, 'bold', 'Helvetica', [100, 110, 120]);
    drawTextLinesPerLine(stack.backend || "Node.js (Express), Socket.io, BullMQ worker nodes", 22, 5, 8.5, 'normal', 'Helvetica');
    currentY += 2.5;

    drawTextLinesPerLine('DATABASE AND INDEXING STORES:', 18, 5, 8.5, 'bold', 'Helvetica', [100, 110, 120]);
    drawTextLinesPerLine(stack.database || "PostgreSQL with pgvector, Redis distributed cache", 22, 5, 8.5, 'normal', 'Helvetica');
    currentY += 2.5;

    drawTextLinesPerLine('CLOUD HOSTING & GPU INFRASTRUCTURE:', 18, 5, 8.5, 'bold', 'Helvetica', [100, 110, 120]);
    drawTextLinesPerLine(stack.hosting || "AWS ECS G4dn GPU units, S3 storage buckets, Cloudflare CDN", 22, 5, 8.5, 'normal', 'Helvetica');
    currentY += 6;

    // 3. Costs
    drawSectionHeader('3. Financial Projections & Cost Sheet');
    const ec = finalEstimates.costEstimates || {};
    drawTextLinesPerLine(`Estimated Development Effort Cost:  ${ec.developmentCost || "₹25,00,000 - ₹50,05,000 ($30,000 - $60,000)"}`, 18, 5.5, 9.5, 'bold', 'Helvetica', [79, 70, 229]);
    drawTextLinesPerLine(`Estimated Monthly Server Core Cost: ${ec.monthlyServerCost || "₹35,000 - ₹1,20,000 ($400 - $1,500)"}`, 18, 5.5, 9.5, 'bold', 'Helvetica', [16, 185, 129]);
    currentY += 3;

    drawTextLinesPerLine('SERVER COST OPTIMIZATION ADVISORY NOTES:', 18, 5, 8.5, 'bold', 'Helvetica', [100, 110, 120]);
    drawTextLinesPerLine('Running serverless container scale-to-zero triggers (e.g. AWS Fargate or Google Cloud Run) can reduce inactive background GPU costs by up to 72% during non-peak offline slots when no workers match queues.', 22, 5, 8.5, 'normal', 'Helvetica');
    currentY += 6;

    // 4. Schema
    drawSectionHeader('4. Database Schema (Postgres SQL DDL)');
    drawCodeBlock(dbDataSchema, 'Postgres SQL Schema DDL');
    currentY += 4;

    // 5. API Specs
    drawSectionHeader('5. API Specs (OpenAPI / REST)');
    drawCodeBlock(apiDataSpec, 'REST YAML API Specs');
    currentY += 4;

    // 6. Security
    drawSectionHeader('6. Core Systems Security Policies');
    const sec = secureChecks;
    drawTextLinesPerLine('IDENTITY SECURITY & SESSION SIGNATURE POLICY:', 18, 5, 8.5, 'bold', 'Helvetica', [100, 110, 120]);
    drawTextLinesPerLine(sec.authentication || 'Strict secure cookie handles with HTTP-Only flag sets.', 22, 5, 8.5, 'normal', 'Helvetica');
    currentY += 2.5;

    drawTextLinesPerLine('ROW PRE-COMMIT ACCESS VALIDATION CHECK:', 18, 5, 8.5, 'bold', 'Helvetica', [100, 110, 120]);
    drawTextLinesPerLine(sec.authorization || 'PostgreSQL Row-Level-Security (RLS) validating ownership before operations.', 22, 5, 8.5, 'normal', 'Helvetica');
    currentY += 2.5;

    drawTextLinesPerLine('PASSWORD MATRIX SECURITY SALTING ROUNDS:', 18, 5, 8.5, 'bold', 'Helvetica', [100, 110, 120]);
    drawTextLinesPerLine(sec.passwordStorage || 'Forced Bcrypt stretching salt matrices parameterized with 12 cycles of work.', 22, 5, 8.5, 'normal', 'Helvetica');
    currentY += 2.5;

    drawTextLinesPerLine('COMPUTATIONAL RESOURCE THROTTLE RULES:', 18, 5, 8.5, 'bold', 'Helvetica', [100, 110, 120]);
    drawTextLinesPerLine(sec.rateLimiting || 'Strict Redis window buffers (Max 10 GPU workloads/hour, 120 workspace mutations/hour).', 22, 5, 8.5, 'normal', 'Helvetica');
    currentY += 6;

    // 7. UI Screens
    drawSectionHeader('7. UI Screens System Specs');
    const screens = finalEstimates.uiScreens || [];
    screens.forEach((screenText: string, screenIndex: number) => {
      drawTextLinesPerLine(`Layout 0${screenIndex + 1}: ${screenText}`, 18, 5.5, 8.5, 'normal', 'Helvetica', [15, 23, 42]);
    });
    currentY += 6;

    // 8. Weekly milestones
    drawSectionHeader('8. Weekly Sprint Milestones');
    roadmapData.forEach((wNode: any, wIndex: number) => {
      const weekLabel = wNode.week || `Week ${wIndex + 1}`;
      const weekDesc = wNode.topic || wNode.milestone || wNode;
      drawTextLinesPerLine(`• ${weekLabel}:`, 18, 5, 8.5, 'bold', 'Helvetica', [79, 70, 229]);
      drawTextLinesPerLine(weekDesc, 24, 5, 8.5, 'normal', 'Helvetica');
      currentY += 1.5;
    });
    currentY += 4.5;

    // 9. Docker file specs
    drawSectionHeader('9. Multi-Stage Production Docker Build');
    drawCodeBlock(dockerfileCode, 'Dockerfile Production Config Server');

    const filenamified = `ares9_blueprint_${customQuery.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')}.pdf`;
    doc.save(filenamified);
  };

  return (
    <div id="project-blueprint-hub-card" className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[9px] font-mono bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30 font-bold uppercase tracking-wide">
              Production Standard
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" /> Live Multi-Agent Output
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Compiled Project Blueprint Sheet
          </h2>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Task Idea: <span className="text-white font-medium">"{customQuery}"</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleDownloadBlueprintFile}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 text-xs font-mono font-bold rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Download className="w-4 h-4" />
            Download Blueprint.json
          </button>

          <button
            onClick={handleDownloadBlueprintPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-mono font-bold rounded-xl border border-indigo-500 shadow-lg shadow-indigo-500/10 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <FileText className="w-4 h-4" />
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Dynamic Sub-Tab Selector inside Blueprint Hub */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm select-none">
        <div className="flex items-center gap-1.5 px-2">
          <Layers className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block tracking-wider">
            Workspace Hub Subviews:
          </span>
        </div>
        <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 relative overflow-hidden flex-wrap max-w-full">
          {(['all', 'overview', 'tech', 'ops'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const label = 
              tab === 'all' ? '🗂️ Entire Blueprint' :
              tab === 'overview' ? '🎯 Product Overview' :
              tab === 'tech' ? '🛠️ Tech & Schema' :
              '🛡️ Ops & Security';
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer z-10 ${
                  isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeBlueprintSubTab"
                    className="absolute inset-0 bg-slate-900 rounded-lg -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid containing specifications with Framer Motion entering and exiting */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
        
        {/* 1. Project Analyzer Results */}
        {(activeTab === 'all' || activeTab === 'overview') && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                1. Project Scope Analysis
              </h3>
              <button 
                onClick={() => handleCopy('scope', JSON.stringify(reqData, null, 2))}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {copiedSection === 'scope' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="space-y-3 font-mono text-[11px]">
              <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500">Complexity:</span>
                <span className="text-indigo-600 font-bold">{reqData.complexityScore || "85/100"}</span>
              </div>
              <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500">Timeline:</span>
                <span className="text-slate-800 font-bold">{reqData.estimatedTime || "12 Weeks"}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">Estimated Team Needs</span>
                <ul className="space-y-1">
                  {(reqData.teamRequirements || []).map((t: string, i: number) => (
                    <li key={i} className="flex items-center gap-1.5 text-slate-600 truncate">
                      <CheckCircle className="w-3 h-3 text-slate-400 flex-shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">MVP Core Features</span>
                <ul className="space-y-1">
                  {(reqData.features || []).map((f: string, i: number) => (
                    <li key={i} className="bg-indigo-50/50 p-2 rounded text-indigo-950 font-sans leading-normal border border-indigo-100/40">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 2. Tech Stack Recommender */}
        {(activeTab === 'all' || activeTab === 'tech') && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500" />
                2. Recommended Tech Stack
              </h3>
              <button 
                onClick={() => handleCopy('stack', JSON.stringify(archData, null, 2))}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {copiedSection === 'stack' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="space-y-3 font-mono text-[11px]">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider block mb-0.5">Frontend Client</span>
                <span className="text-slate-800 font-semibold leading-normal block">{archData.techStack?.frontend || "React, Tailwind, Zustand"}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider block mb-0.5">Backend Engine</span>
                <span className="text-slate-800 font-semibold leading-normal block">{archData.techStack?.backend || "NodeJS (Express), BullMQ"}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider block mb-0.5">Database & Store</span>
                <span className="text-slate-800 font-semibold leading-normal block">{archData.techStack?.database || "PostgreSQL with PgVector"}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider block mb-0.5">Hosting & Compute</span>
                <span className="text-slate-800 font-semibold leading-normal block">{archData.techStack?.hosting || "AWS ECS (NVIDIA GPU)"}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Cost Estimator */}
        {(activeTab === 'all' || activeTab === 'ops') && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-500" />
                3. Financial Cost Sheet
              </h3>
              <button 
                onClick={() => handleCopy('cost', JSON.stringify(finalEstimates.costEstimates, null, 2))}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {copiedSection === 'cost' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="space-y-4 font-mono text-[11px]">
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-center">
                <span className="text-indigo-400 text-[9px] uppercase font-bold block mb-1">Development Cost Estimate</span>
                <span className="text-indigo-950 font-bold text-sm tracking-tight">{finalEstimates.costEstimates?.developmentCost || "₹50,05,000"}</span>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-center">
                <span className="text-emerald-500 text-[9px] uppercase font-bold block mb-1">Monthly Cloud Server Cost</span>
                <span className="text-emerald-950 font-bold text-sm tracking-tight">{finalEstimates.costEstimates?.monthlyServerCost || "₹35,000"}</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-800 text-[10px] leading-relaxed">
                <strong>💡 Cost optimization advice:</strong> Running serverless container scale-to-zero triggers (e.g. AWS Fargate or Cloud Run) can reduce inactive background GPU costs by up to 72% during non-peak offline slots.
              </div>
            </div>
          </div>
        )}

        {/* 4. Database Designer Schema */}
        {(activeTab === 'all' || activeTab === 'tech') && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4 md:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-500" />
                4. Database Schema (Postgres)
              </h3>
              <button 
                onClick={() => handleCopy('db', dbDataSchema)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {copiedSection === 'db' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="relative group">
              <pre className="p-3 bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-mono rounded-lg overflow-x-auto max-h-[220px]">
                <code>{dbDataSchema}</code>
              </pre>
              <div className="absolute right-2 top-2 bg-slate-900 border border-slate-700/80 px-1.5 py-0.5 rounded text-[8px] text-slate-400 font-bold font-mono opacity-80">
                CREATE TABLE DDL
              </div>
            </div>
          </div>
        )}

        {/* 5. API OpenAPI Specifications */}
        {(activeTab === 'all' || activeTab === 'tech') && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4 md:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                <Code className="w-4 h-4 text-slate-500" />
                5. API specs (OpenAPI / REST)
              </h3>
              <button 
                onClick={() => handleCopy('api', apiDataSpec)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {copiedSection === 'api' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="relative group">
              <pre className="p-3 bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-mono rounded-lg overflow-x-auto max-h-[220px]">
                <code>{apiDataSpec}</code>
              </pre>
              <div className="absolute right-2 top-2 bg-slate-900 border border-slate-700/80 px-1.5 py-0.5 rounded text-[8px] text-slate-400 font-bold font-mono opacity-80">
                REST YAML OpenApi
              </div>
            </div>
          </div>
        )}

        {/* 6. Security Auditor Checks */}
        {(activeTab === 'all' || activeTab === 'ops') && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4 lg:col-span-1">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                6. Security Checklist Checks
              </h3>
              <button 
                onClick={() => handleCopy('security', JSON.stringify(secureChecks, null, 2))}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {copiedSection === 'security' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="space-y-2.5 font-mono text-[10.5px]">
              <div className="p-2 border-l-2 border-indigo-500 bg-slate-50 leading-relaxed">
                <strong className="text-slate-700">Authentication:</strong>
                <p className="text-slate-600 mt-0.5">{secureChecks.authentication}</p>
              </div>
              <div className="p-2 border-l-2 border-indigo-500 bg-slate-50 leading-relaxed">
                <strong className="text-slate-700">Authorization:</strong>
                <p className="text-slate-600 mt-0.5">{secureChecks.authorization}</p>
              </div>
              <div className="p-2 border-l-2 border-indigo-500 bg-slate-50 leading-relaxed">
                <strong className="text-slate-700">Password Storage:</strong>
                <p className="text-slate-600 mt-0.5">{secureChecks.passwordStorage}</p>
              </div>
              <div className="p-2 border-l-2 border-indigo-500 bg-slate-50 leading-relaxed">
                <strong className="text-slate-700">Rate Limiting:</strong>
                <p className="text-slate-600 mt-0.5">{secureChecks.rateLimiting}</p>
              </div>
            </div>
          </div>
        )}

        {/* 7. UI Screen Planner */}
        {(activeTab === 'all' || activeTab === 'overview') && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4 md:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-slate-500" />
                7. UI Screen Blueprint Maps
              </h3>
              <button 
                onClick={() => handleCopy('ui', finalEstimates.uiScreens?.join('\n') || '')}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {copiedSection === 'ui' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <ul className="space-y-2 font-mono text-[11px]">
              {(finalEstimates.uiScreens || [
                "Login / Single-Sign-On screen",
                "Studio Workspace 3D Canvas Editor dashboard",
                "Project Dashboard manager",
                "Settings & Billing profile page",
                "Admin analytical summary charts Panel"
              ]).map((screen: string, idx: number) => (
                <li key={idx} className="flex gap-2.5 p-2 bg-slate-50 border border-slate-100 rounded-lg items-start">
                  <span className="w-5 h-5 rounded bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">
                    0{idx+1}
                  </span>
                  <span className="text-slate-700 leading-normal font-sans text-xs">
                    {screen}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 8. Roadmap Generator Timeline */}
        {(activeTab === 'all' || activeTab === 'overview') && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4 md:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                8. Weekly Sprint Milestones
              </h3>
              <button 
                onClick={() => handleCopy('roadmap', JSON.stringify(roadmapData, null, 2))}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {copiedSection === 'roadmap' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="space-y-3 font-mono text-[11px]">
              {roadmapData.map((step: any, index: number) => (
                <div key={index} className="flex gap-3 relative pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <span className="w-14 px-2 py-0.5 text-center text-[9px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md">
                      {step.week || `Week ${index + 1}`}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-800 leading-relaxed text-xs">
                      {step.topic || step.milestone || step}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. Deployment Plan */}
        {(activeTab === 'all' || activeTab === 'ops') && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4 lg:col-span-1">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-slate-500" />
                9. Multi-Stage Docker Build
              </h3>
              <button 
                onClick={() => handleCopy('deploy', `FROM node:22-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:22-alpine-slim AS run\nWORKDIR /app\nCOPY --from=build /app/dist ./dist\nCOPY --from=build /app/package*.json ./\nRUN npm ci --omit=dev\nUSER node\nEXPOSE 3000\nCMD ["node", "dist/server.cjs"]`)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {copiedSection === 'deploy' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <pre className="p-3 bg-slate-950 border border-slate-800 text-[10px] text-emerald-400 font-mono rounded-lg overflow-x-auto max-h-[220px]">
              {`FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine-slim AS run
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
USER node
EXPOSE 3000
CMD ["node", "dist/server.cjs"]`}
            </pre>
            <div className="text-[10px] text-slate-400 font-sans leading-normal">
              ⚙️ Ready container files targeting secure non-privileged users with lightweight production footprint sizes.
            </div>
          </div>
        )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};
