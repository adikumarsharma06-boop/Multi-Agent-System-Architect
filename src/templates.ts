import { MultiAgentSystem, TemplateWorkflow } from './types';

export const TEMPLATES: TemplateWorkflow[] = [
  {
    name: "Ultimate Project Blueprint Creator",
    taskDescription: "Convert any raw software idea into a detailed product blueprint consisting of a requirements scope analysis, recommended tech stack, normalized SQL/NoSQL schemas, REST OpenAPI endpoints, security checklists, weekly milestones, UI screen blueprints, and full development and hosting cost sheets.",
    system: {
      task: "User Idea to Complete Production Blueprint",
      agents: [
        {
          id: "requirements_agent",
          name: "Requirements Agent (Project Analyzer)",
          role: "Feature Scope Analyzer & Sizing",
          description: "Decomposes raw product descriptions into features lists, complexity scoring, estimated timeframes, and specific team requirements.",
          intelligenceTier: "gemini-3.5-flash",
          inputs: ["Raw Software Idea", "Target Constraints"],
          outputs: ["Granular Features List", "Team Capacity Metrics", "Complexity Sizing Score"],
          tools: ["Product PRD Author", "Sizing Estimator Core", "Feature Matrix Parser"],
          systemInstruction: "You are a senior Requirements Analyst. Your goal is to map creative concepts into exhaustive, non-ambiguous functional scope checklists, evaluating technical risk and effort.",
          decisionLogic: "Enforce strictly defined MVP bounds. Identify scope-creep risks early.",
          costOptimization: "Return clear bullet lists and tabular capacity targets."
        },
        {
          id: "systems_architect",
          name: "Lead Systems Architect (Stack Recommender)",
          role: "Enterprise Architecture & Infrastructure Mapping",
          description: "Recommends modern, high-performance technology stacks (frontend, backend, database, hosting, caches, and tools) aligned to requirements.",
          intelligenceTier: "gemini-3.1-pro-preview",
          inputs: ["Granular Features List", "Complexity Sizing Score"],
          outputs: ["Recommended Tech Stack", "Infrastructure Architecture Map"],
          tools: ["Architecture Template DB", "Latency Profiler", "Hosting Cost Matrix"],
          systemInstruction: "You are a Principal Lead Systems Architect. You choose robust, production-ready, highly compatible frameworks and cloud environments with clear integration pathways.",
          decisionLogic: "Enforce modular separation of concerns. Guard against vendor lock-in.",
          costOptimization: "Synthesize target specifications cleanly; optimize server footprints."
        },
        {
          id: "db_designer",
          name: "Database Designer (Schema Modeler)",
          role: "Relational Index & Data Structure Layout",
          description: "Generates fully normalized database schemas (PostgreSQL DDL state/collection mappings), relationships, primary keys, and specialized compound search indexes.",
          intelligenceTier: "gemini-3.1-pro-preview",
          inputs: ["Recommended Tech Stack", "Granular Features List"],
          outputs: ["PostgreSQL Schema DDLs", "Indexed Fields Matrix", "Entity Mappings"],
          tools: ["ER Diagrams Engine", "DDL Validator", "Query Plan Estimator"],
          systemInstruction: "You are an elite DB schema architect. Design fully normalised tables including explicit data types, cascade criteria, index keys, and metadata trackers.",
          decisionLogic: "Validate 3NF compliance. Reject plain text password mappings; require secure salting.",
          costOptimization: "Expose direct SQL tables without hand-waving explanations."
        },
        {
          id: "api_designer",
          name: "API Designer (REST Specialist)",
          role: "OpenAPI Specification & REST Architecture",
          description: "Formulates descriptive OpenAPI YAML schemas, matching resources, JSON payload formats, query params, headers, and rates limiters.",
          intelligenceTier: "gemini-3.5-flash",
          inputs: ["PostgreSQL Schema DDLs", "Recommended Tech Stack"],
          outputs: ["OpenAPI Swagger Specifications", "Model Routing Schema"],
          tools: ["Swagger YAML Sandbox", "REST API Linter", "JSON Payload Formatter"],
          systemInstruction: "You are a Principal API contract architect. Draft clear, idempotent endpoints with JWT bearer security claims, consistent paging, and JSON envelopes.",
          decisionLogic: "Check URI correctness, require header tokens for private endpoints, and confirm input validators.",
          costOptimization: "Batch endpoint contracts neatly to limit prompt tokens."
        },
        {
          id: "security_auditor",
          name: "Security Auditor Agent (Audit Inspector)",
          role: "Zero-Trust Security Verification & Penetration Guard",
          description: "Audits authentication, authorization rules, password storage algorithms, database locks, and rate limiters to guarantee solid security posture before deployment planning.",
          intelligenceTier: "gemini-3.5-flash",
          inputs: ["OpenAPI Swagger Specifications", "PostgreSQL Schema DDLs"],
          outputs: ["Zero-Trust Audit Score", "Security Hardening Recommendations"],
          tools: ["Vulnerability Profiler", "OWASP Registry Analyzer", "Access Control Tester"],
          systemInstruction: "You are an unyielding Zero-Trust Security Officer. Check inputs for SQL Injection risk, inspect encryption salt counts, verify endpoint auth limits, and require DDoS throttling rules.",
          decisionLogic: "Fail audit if passwords use less than 12 salt rounds, or private routes lack JWT headers.",
          costOptimization: "Generate dense, checklist-oriented audit scoring to save metadata space."
        },
        {
          id: "roadmap_generator",
          name: "Roadmap Generator (Milestone Scheduler)",
          role: "Chronological Sprint Implementation Schedulers",
          description: "Converts requirements and architectures into sequential, actionable weekly development plans centered around specific MVP milestones.",
          intelligenceTier: "gemini-3.5-flash",
          inputs: ["OpenAPI Swagger Specifications", "Security Hardening Recommendations"],
          outputs: ["Sprint Milestones Schedule (Weeks 1-4)", "Path Dependency Maps"],
          tools: ["Timeline Coordinator", "Milestone Scaffolder", "Agile Task Bundler"],
          systemInstruction: "You are a veteran technical program manager. Sequence the development of core components (database -> api routes -> screen integration -> testing) in clean logical order.",
          decisionLogic: "Ensure security and database modules are scheduled before UI screens in Week 1.",
          costOptimization: "Serialize milestone descriptions using short, actionable verbs."
        },
        {
          id: "final_blueprint",
          name: "Final Blueprint (Production Assembler)",
          role: "Production Artifact & Cost Estimator Sheets",
          description: "Aggregates the entire multi-agent compilation, plans UI screen components, executes financial development / hosting estimates, and compiles a downloadable project blueprint.",
          intelligenceTier: "gemini-3.1-pro-preview",
          inputs: ["Sprint Milestones Schedule (Weeks 1-4)", "Recommended Tech Stack"],
          outputs: ["Compiled Project Blueprint Documentation", "Cost Spreadsheet Estimates", "UI Screens Layout"],
          tools: ["Project Blueprint Bundler", "UI Wireframe Scheduler", "Financial Budget Planner"],
          systemInstruction: "You are the final Cognitive Compiler. Take all intermediate specifications and formulate the definitive product blueprint: with comprehensive cost forecasts, UI layout, and download links.",
          decisionLogic: "Ensure every user feature maps back directly to a planned UI screen and estimated sprint.",
          costOptimization: "Compress final blueprint documents using a compact nested outline."
        }
      ],
      gates: [
        {
          id: "gate_security_check",
          name: "Zero-Trust Security & Data Privacy Gate",
          reviewerAgentId: "security_auditor",
          criteria: [
            "User credentials hashing salt work-factor must be at least 12.",
            "All private REST endpoints must explicitly require JWT authentication tokens.",
            "API routes must enforce volume rate limits to prevent brute-force attacks."
          ],
          testAsserts: [
            "assert(schemas.users.password_salt_rounds >= 12)",
            "assert(routes.private.headers.contains('Authorization: Bearer <JWT>'))",
            "assert(routes.rate_limiter.maxRequestsPerMinute <= 100)"
          ],
          ifPassedTargetNodeId: "roadmap_generator",
          ifFailedTargetNodeId: "db_designer",
          feedbackProtocol: "Compile an error report highlighting cryptographic salt weaknesses, missing JWT declarations, or over-exposed routes with specific repair codes."
        }
      ],
      edges: [
        {
          id: "e_req_arch",
          sourceId: "requirements_agent",
          targetId: "systems_architect",
          type: "standard_route",
          label: "Analyzed Feature Matrix Specs"
        },
        {
          id: "e_arch_db",
          sourceId: "systems_architect",
          targetId: "db_designer",
          type: "standard_route",
          label: "Tech Infrastructure Setup"
        },
        {
          id: "e_db_api",
          sourceId: "db_designer",
          targetId: "api_designer",
          type: "standard_route",
          label: "Database DDL Layout"
        },
        {
          id: "e_api_gate",
          sourceId: "api_designer",
          targetId: "gate_security_check",
          type: "standard_route",
          label: "REST OpenAPI Specifications"
        },
        {
          id: "e_gate_pass",
          sourceId: "gate_security_check",
          targetId: "roadmap_generator",
          type: "validation_pass",
          label: "PASS: Security Audit Approved"
        },
        {
          id: "e_gate_fail",
          sourceId: "gate_security_check",
          targetId: "db_designer",
          type: "validation_fail",
          label: "FAIL: Security Checklist Remediation"
        },
        {
          id: "e_road_final",
          sourceId: "roadmap_generator",
          targetId: "final_blueprint",
          type: "standard_route",
          label: "Sprint Milestones Schedule"
        }
      ],
      failureHandling: {
        maxRetryBudgets: 3,
        fallbackTriggerPolicy: "Enforce strict default encrypted local storage patterns. Notify Principal Security Liaison.",
        alertingChannels: ["Security Integrity Slack", "SysOps PagerDuty Channel"],
        circuitBreakerConditions: "Consecutive audit failures specifically concerning unsecured data leakage risks."
      },
      optimization: {
        promptWrapping: "Ensure all designed endpoint definitions contain corresponding request validation objects.",
        cachingStrategy: "Cache base relational SQL models to expedite security audits.",
        parallelizationOpportunity: "UI Screen mapping plans can run concurrently with Roadmap schedules."
      },
      scalability: {
        concurrencyModel: "Parallel execution of DB design validation and API routing.",
        agentOrchestrationPattern: "Sequential pipeline with automated verification loop.",
        eventSubscriptionModel: "Real-time SSE updates dispatched to operators as agents lock artifacts."
      }
    }
  },
  {
    name: "Full-Stack Feature Development",
    taskDescription: "Design, develop, and review a new secure authentication feature for a web app, including frontend UI, backend controller, and audit checks.",
    system: {
      task: "Web App Authentication Feat - End-to-End Delivery",
      agents: [
        {
          id: "sys_planner",
          name: "Lead Systems Architect",
          role: "Technical Planning & Spec Generation",
          description: "Decomposes feature requests into rigorous technical specifications, API schemas, and security design criteria.",
          intelligenceTier: "gemini-3.1-pro-preview",
          inputs: ["Raw Feature Request", "Existing System Codebase Specs"],
          outputs: ["API Contract Specs", "Technical Blueprint Schema", "Data Models"],
          tools: ["Swagger Editor", "DB Schema Generator", "Architecture Spec DB"],
          systemInstruction: "You are an elite enterprise backend architect. Your system instruction mandates writing strict, unyielding Swagger/OpenAPI schemas, defining primary keys under UUIDv4, and specifying transport security requirements before writing any code skeleton.",
          decisionLogic: "Verify interface idempotency. Check query limits. Ensure authorization claims exist on all endpoints.",
          costOptimization: "Prompt wrapping restricted to schema definitions. Avoid raw text chatter. Cache model context over repeated structural guidelines."
        },
        {
          id: "code_dev",
          name: "Senior Software Engineer",
          role: "Feature Implementation & Module Coding",
          description: "Generates high-performance, clean, modular code conforming strictly to the architectural contract.",
          intelligenceTier: "gemini-3.5-flash",
          inputs: ["API Contract Specs", "Technical Blueprint Schema"],
          outputs: ["React Frontend Code", "Express Controller Code", "Integration Tests Suite"],
          tools: ["TypeScript Compiler (tsc)", "Linting & Formatter Engine", "Secure Code Analyzer"],
          systemInstruction: "You are a senior full-stack developer specializing in React with Vite and Express. Your role is write code that passes rigorous lint audits. Always write self-contained TS templates with explicit error wrapping.",
          decisionLogic: "Ensure password hashing uses bcrypt-like logic. Encrypt JWT payloads on custom claims. Ensure React state is localized to avert memory leaks.",
          costOptimization: "Strip comments during downstream builds. Utilize inline prompts. Batch code block generation sequentially."
        },
        {
          id: "qa_reviewer",
          name: "Automated QA & Security Editor",
          role: "Security Auditing & Code Execution Validator",
          description: "Validates code syntax correctness, sanity checks test compliance, and evaluates security parameters.",
          intelligenceTier: "gemini-3.5-flash",
          inputs: ["React Frontend Code", "Express Controller Code", "Integration Tests Suite"],
          outputs: ["Coverage Reports", "Vulnerability Audit Logs", "Compilation Status"],
          tools: ["npx tsc compiler", "ESLint Analyzer", "OWASP Security Scanner"],
          systemInstruction: "You are an automated code inspector. You analyze TypeScript files for security bugs such as lack of input validation, SQL injection vectors, or unhandled promise rejections.",
          decisionLogic: "Examine request parameters against schema boundaries. Fail compilation if coverage drops below 85% or if lint errors exist.",
          costOptimization: "Execute shallow AST parsing rather than heavy LLM checks where possible. Use pro-level models only if vulnerability is suspected."
        },
        {
          id: "deployment_manager",
          name: "Release & DevOps Orchestrator",
          role: "Environment Sizing & Build Compilation",
          description: "Formulates final production assets, writes Dockerfiles, configures environment flags, and plans zero-downtime deployment rollouts.",
          intelligenceTier: "gemini-3.5-flash",
          inputs: ["Verified Source Code", "Compilation Status"],
          outputs: ["Docker Multi-stage Builds", "CI/CD Action Definitions", "Release Notes"],
          tools: ["Docker build kit", "GitHub Actions parser", "Kubernetes Yaml Validator"],
          systemInstruction: "You are a DevOps engineer specializing in cloud-native containerized microservices. Your work strictly emphasizes minimal final Image size utilizing scratch alpine-based configurations.",
          decisionLogic: "Confirm build artifacts are optimized and do not contain secret payloads inside container frames.",
          costOptimization: "Utilize pre-cached layers. Prompt with strict JSON outputs only to minimize network parse overhead."
        }
      ],
      gates: [
        {
          id: "gate_code_audit",
          name: "Quality & Security Gate",
          reviewerAgentId: "qa_reviewer",
          criteria: [
            "0 unresolved linter warnings are present.",
            "Test coverage is > 85% for all code paths.",
            "No OWASP critical high vulnerabilities detected."
          ],
          testAsserts: [
            "assert(expressApp.use(helmet) === true)",
            "assert(coverageRatio >= 0.85)"
          ],
          ifPassedTargetNodeId: "deployment_manager",
          ifFailedTargetNodeId: "code_dev",
          feedbackProtocol: "Compile full AST error stack. Highlight vulnerable line numbers. Wrap findings inside Markdown block with specific refactoring recommendations."
        }
      ],
      edges: [
        {
          id: "e1",
          sourceId: "sys_planner",
          targetId: "code_dev",
          type: "standard_route",
          label: "Synthesized Blueprint & Contract"
        },
        {
          id: "e2",
          sourceId: "code_dev",
          targetId: "gate_code_audit",
          type: "standard_route",
          label: "Code Review Submission"
        },
        {
          id: "e3",
          sourceId: "gate_code_audit",
          targetId: "deployment_manager",
          type: "validation_pass",
          label: "PASS: Clean Security & Syntax"
        },
        {
          id: "e4",
          sourceId: "gate_code_audit",
          targetId: "code_dev",
          type: "validation_fail",
          label: "FAIL: Loopback with Bug Remediation Report"
        }
      ],
      failureHandling: {
        maxRetryBudgets: 3,
        fallbackTriggerPolicy: "Escalate to Human Principal Tech Lead via Slack webhook.",
        alertingChannels: ["Slack Tech Alert room", "Opsgenie Priority 2 Channel"],
        circuitBreakerConditions: "Continuous 3 compilation failures without correction loop or code degradation."
      },
      optimization: {
        promptWrapping: "All developer prompts auto-wrap with strict static typing directives to minimize hallucinated API structures.",
        cachingStrategy: "Store structural OpenAPI contracts in System Prompts under deep caching models.",
        parallelizationOpportunity: "Frontend code scaffolding can run concurrently with backend schema database creations."
      },
      scalability: {
        concurrencyModel: "Asynchronous task queue using Redis BullMQ where agents pull tasks on separate isolated worker containers.",
        agentOrchestrationPattern: "LangGraph State-Graph with explicit nodes and routing transitions governed by programmatic state keys.",
        eventSubscriptionModel: "Event-driven updates on RabbitMQ queues with agents broadcasting task completion payloads."
      }
    }
  },
  {
    name: "Enterprise Financial Reporting & Audit",
    taskDescription: "Automate financial transaction ingestion, perform qualitative analysis on anomalies, run compliance audit checks, and generate board-ready reports.",
    system: {
      task: "Corporate Q2 Earnings Financial Audit & Disclosure",
      agents: [
        {
          id: "fin_ingest",
          name: "Data Ingestion Agent",
          role: "Ledger Parsing & Discrepancy Tracking",
          description: "Ingests structural transaction ledgers, parses multi-currency balances, and flags baseline mathematical discrepancies.",
          intelligenceTier: "gemini-3.5-flash",
          inputs: ["JSON Financial Ledger", "Q1 Closing Balances"],
          outputs: ["Normalized Balances Report", "Discrepancy Log"],
          tools: ["D3 Financial Pipeline", "Currency converter", "Ledger Integrity Checker"],
          systemInstruction: "You are an expert quantitative data parser. Your objective is raw precision in aligning incoming debits with corresponding credits down to 4 decimal places.",
          decisionLogic: "Examine if Debit equals Credit. Flag any balance variance exceeding 0.001%.",
          costOptimization: "Perform parsing via streaming JS arrays. Keep LLM calls reserved strictly for non-standard structured CSV exceptions."
        },
        {
          id: "quant_analyst",
          name: "Quantitative Auditor",
          role: "Qualitative Trend Analysis & Fraud Spotting",
          description: "Examines transaction flags, runs statistical anomaly detection (e.g. Benford's Law compliance), and categorizes financial risk markers.",
          intelligenceTier: "gemini-3.1-pro-preview",
          inputs: ["Normalized Balances Report", "Discrepancy Log"],
          outputs: ["Qualitative Risk Report", "Anomalous Entry Dossier"],
          tools: ["Statistical Model Engine", "Tax Rule Database"],
          systemInstruction: "You are a certified forensic financial auditor. You specialize in identifying transaction patterns that point to tax loopholes, structural accounting transfers, or corporate fraud.",
          decisionLogic: "Apply Benford's law compliance tests. Flag transaction chains involving offshore jurisdictions with tax-havens.",
          costOptimization: "Compress text balances before routing. Utilize structured prompts with strict evaluation arrays."
        },
        {
          id: "compliance_gate_agent",
          name: "Legal Compliance Analyst",
          role: "SEC & Tax Code Reviewer",
          description: "Audits anomalous entries, checks filings against active regulatory compliance guidelines (Sarbanes-Oxley, SEC Form 10-Q guidelines).",
          intelligenceTier: "gemini-3.1-pro-preview",
          inputs: ["Qualitative Risk Report", "Anomalous Entry Dossier"],
          outputs: ["Compliance Scorecard", "Legal Risk Summary"],
          tools: ["Regulatory Document Finder", "Tax Law Knowledge Graph"],
          systemInstruction: "You are an audit committee legal officer. You ensure financial statements stand up to intense regulatory and legal scrutiny. Be highly conservative.",
          decisionLogic: "Acknowledge material items whose value exceeds 1% of total revenue. Validate disclosure statements.",
          costOptimization: "Cache tax code documents in contextual storage. Minimize external retrieval requests."
        }
      ],
      gates: [
        {
          id: "gate_compliance",
          name: "Regulatory Audit Gate",
          reviewerAgentId: "compliance_gate_agent",
          criteria: [
            "All balance discrepancies are mathematically reconciled or explicitly categorized.",
            "Zero material violations of SOX (Sarbanes-Oxley) section 404 detected.",
            "All offshore transaction pathways are declared and annotated properly."
          ],
          testAsserts: [
            "assert(discrepancies.length === 0 || discrepancies.every(d => d.annotated))",
            "assert(soxComplianceStatus === 'COMPLIANT')"
          ],
          ifPassedTargetNodeId: "fin_ingest", // Re-routing complete
          ifFailedTargetNodeId: "quant_analyst", // Loop back
          feedbackProtocol: "Synthesize full compliance remediation memo. Detail the regulatory code violated and request specific explanation of corresponding ledger items."
        }
      ],
      edges: [
        {
          id: "ef1",
          sourceId: "fin_ingest",
          targetId: "quant_analyst",
          type: "standard_route",
          label: "Normalized ledger balances"
        },
        {
          id: "ef2",
          sourceId: "quant_analyst",
          targetId: "gate_compliance",
          type: "standard_route",
          label: "Risk logs & anomaly audit logs"
        },
        {
          id: "ef3",
          sourceId: "gate_compliance",
          targetId: "quant_analyst",
          type: "validation_fail",
          label: "FAIL: Re-eval Anomaly with compliance feed"
        }
      ],
      failureHandling: {
        maxRetryBudgets: 2,
        fallbackTriggerPolicy: "Lock the ledger and escalate immediately to Corporate Chief Financial Officer & General Counsel for special audit.",
        alertingChannels: ["SEC Legal Notification Webhook", "Internal Compliance SMS Alert"],
        circuitBreakerConditions: "Presence of suspected deliberate accounting discrepancies over $250,000 without trace audit trails."
      },
      optimization: {
        promptWrapping: "Quantitative system instructions enforce precision formats (e.g. balance sheet cells separated cleanly by tabs).",
        cachingStrategy: "Cache transaction ledger taxonomy in current run context.",
        parallelizationOpportunity: "Qualitative trend analysis can run concurrently with multi-currency tax audits."
      },
      scalability: {
        concurrencyModel: "Serverless partition handling where ledger files are segmented and processed on parallel Cloud Run functions.",
        agentOrchestrationPattern: "Hierarchical Supervisor (Lead Quantitative Auditor directs specialized sub-agents).",
        eventSubscriptionModel: "Cloud Pub/Sub topic subscription that fires when quarterly financial databases are finalized."
      }
    }
  },
  {
    name: "Marketing & Brand Voice Copy Engine",
    taskDescription: "Formulate creative marketing copy, verify SEO density, and audit against brand guidelines for consistent voice and legal marketing claims.",
    system: {
      task: "Global Product Launch Marketing Campaign Delivery",
      agents: [
        {
          id: "copywriter",
          name: "Creative UX Copywriter",
          role: "Creative Copy & Slogan Generation",
          description: "Generates high-converting marketing copy, catchy hero slogans, and engaging newsletter articles.",
          intelligenceTier: "gemini-3.5-flash",
          inputs: ["Product Spec Outline", "Target Audience Personas"],
          outputs: ["Draft Campaign Copy", "Alternative Slogans List"],
          tools: ["Synonym Finder", "Brand Persona Deck"],
          systemInstruction: "You are an imaginative, award-winning copywriter. Your goal is to write snappy, memorable, highly persuasive, and emotionally resonant copy. Use high-action verbs and avoid corporate buzzwords.",
          decisionLogic: "Ensure content uses active voice. Slogans should be under 8 words. Do not use generic empty hype.",
          costOptimization: "Prompt template incorporates maximum examples of high-converting text structures to direct the model swiftly."
        },
        {
          id: "seo_auditor",
          name: "SEO Engine Optimization Agent",
          role: "Keyword Optimization & Meta Data Injector",
          description: "Refines drafts with search keyword rankings, designs metadata, and estimates average search engine ranking density indices.",
          intelligenceTier: "gemini-3.5-flash",
          inputs: ["Draft Campaign Copy"],
          outputs: ["SEO Optimized Draft", "Meta Tags & Alt-text definitions"],
          tools: ["Keyword Search Index", "Readability Calculator"],
          systemInstruction: "You are an SEO wizard. You align incoming creative drafts with high-volume search parameters without sacrificing readable, elegant phrasing.",
          decisionLogic: "Target keyword density between 1.5% and 2.5%. Keep Flesch-Kincaid reading difficulty under grade 8.",
          costOptimization: "Provide clean arrays of keywords to inject directly as a list to reduce LLM token count."
        },
        {
          id: "brand_voice_auditor",
          name: "Chief Brand Director",
          role: "Tone Auditing & Compliance Guard",
          description: "Checks draft copies against strict brand values (e.g. inclusivity, modern tone) and legal/trademark compliance rules.",
          intelligenceTier: "gemini-3.1-pro-preview",
          inputs: ["SEO Optimized Draft"],
          outputs: ["Compliance Scorecard", "Remediation feedback directive"],
          tools: ["Brand Style Guidelines", "Trademark Database Finder"],
          systemInstruction: "You are a brand director and legal guardian. You reject copy that sounds clinical, overly generic, or uses registered phrases of competitors.",
          decisionLogic: "Assert that the tone is helpful and confident. Disallow passive voice. Ensure competitor trademark safety.",
          costOptimization: "Use cached stylebooks. Structure responses as tight checklist tables."
        }
      ],
      gates: [
        {
          id: "gate_brand_voice",
          name: "Brand Compliance Gate",
          reviewerAgentId: "brand_voice_auditor",
          criteria: [
            "Keywords integrated naturally without awkward keyword stuffing.",
            "Brand voice sounds confident, modern, and helpful rather than pushy.",
            "Zero competitor trademark phrases or unsafe legal performance claims exist."
          ],
          testAsserts: [
            "assert(readabilityScore >= 70)",
            "assert(trademarkInfringementDetected === false)"
          ],
          ifPassedTargetNodeId: "seo_auditor", // Completed output pathways
          ifFailedTargetNodeId: "copywriter", // Re-scaffold Creative
          feedbackProtocol: "Highlight sentences with trademark risks or off-brand vocabulary. Provide 2-3 specific tone adjustments."
        }
      ],
      edges: [
        {
          id: "ec1",
          sourceId: "copywriter",
          targetId: "seo_auditor",
          type: "standard_route",
          label: "Snappy rough drafts & slogans"
        },
        {
          id: "ec2",
          sourceId: "seo_auditor",
          targetId: "gate_brand_voice",
          type: "standard_route",
          label: "SEO integrated campaign deliverables"
        },
        {
          id: "ec3",
          sourceId: "gate_brand_voice",
          targetId: "copywriter",
          type: "validation_fail",
          label: "FAIL: Tone Remediation Memo"
        }
      ],
      failureHandling: {
        maxRetryBudgets: 4,
        fallbackTriggerPolicy: "Escalate to Human Creative Director to write copy with AI as assistant.",
        alertingChannels: ["Slack Content Channel", "Asana Board Notification"],
        circuitBreakerConditions: "Creative block - 4 consecutive failed tone reviews where copy degrades."
      },
      optimization: {
        promptWrapping: "Enforce writing slogans inside structured JSON fields to avoid conversational chit-chat.",
        cachingStrategy: "Style guides and target buyer persona sets cached on model context layer.",
        parallelizationOpportunity: "SEO keyword analysis of target directories runs concurrently with creative brainstorming."
      },
      scalability: {
        concurrencyModel: "Event driven processing via serverless worker loops launching text tasks in parallel micro-workers.",
        agentOrchestrationPattern: "Graph-structured flow with independent nodes triggering on file arrivals in shared folders.",
        eventSubscriptionModel: "Webhooks from CMS (e.g. Contentful) when draft campaigns enter 'Ready for Review' statuses."
      }
    }
  },
  {
    name: "System Features Lifecycle",
    taskDescription: "Scaffold complete system features, design state DB schemas, generate REST contracts, enforce security rules, and generate development roadmaps & production deployment plans.",
    system: {
      task: "Core Backend System & Deployment Infrastructure Scaffolding",
      agents: [
        {
          id: "sys_features",
          name: "System Features Analyst",
          role: "Feature Scopes & Scope Requirements",
          description: "Decomposes primitive feature descriptions and system requirements into high-fidelity functional scope documents and atomic feature designs.",
          intelligenceTier: "gemini-3.5-flash",
          inputs: ["Raw System Requirements", "Functional Constraints"],
          outputs: ["System Features Blueprint", "Core Functional Scopes"],
          tools: ["Product Scope Documenter", "Requirement Traceability Matrix", "Functional Spec Compiler"],
          systemInstruction: "You are a Principal Product & System Scoping Analyst. You map raw, ambiguous system desires into formal, granular feature outlines with strict boundaries.",
          decisionLogic: "Validate scope completeness. Keep all requirements fully traceable to standard endpoints.",
          costOptimization: "Enforce strict bullet lists. Eliminate verbose introductory text to minimize token overhead."
        },
        {
          id: "db_designer",
          name: "Database Design Architect",
          role: "Relational Index & DB Schema Layout",
          description: "Generates secure database schemas (Postgres DDL / Firestore structures), entity relationship matrices, primary/foreign associations, and compound indexes.",
          intelligenceTier: "gemini-3.1-pro-preview",
          inputs: ["System Features Blueprint", "Core Functional Scopes"],
          outputs: ["PostgreSQL Schema DDLs", "Entity Relation Mapping Matrix"],
          tools: ["Relational Modeler", "Graphviz ER diagrammer", "PostgreSQL DDL Validator"],
          systemInstruction: "You are an elite database design architect. Your mandate is the creation of fully normalized, relational DDL configurations using secure constraints, UUIDv4 indexes, and strict hashing parameters.",
          decisionLogic: "Verify 3rd Normal Form compliance. Flag raw passwords; require high entropy hashing salt parameters.",
          costOptimization: "Compile direct DDL code outputs rather than descriptive plain-text explanations."
        },
        {
          id: "api_designer",
          name: "API Design Specialist",
          role: "REST Route & OpenAPI Contract Architect",
          description: "Drafts formal OpenAPI / Swagger contracts, detailing url endpoints, HTTP verbs, body schemas, secure response types, and rate limiters.",
          intelligenceTier: "gemini-3.5-flash",
          inputs: ["System Features Blueprint", "PostgreSQL Schema DDLs"],
          outputs: ["OpenAPI Swagger Specifications", "JWT Request body contracts"],
          tools: ["Swagger YAML Compiler", "Stoplight route modeler", "Express Endpoint Sandbox"],
          systemInstruction: "You are a Senior API contract developer. Always specify idempotent endpoints, strict content validation headers, and clear JSON standard responses (such as JSON-API format).",
          decisionLogic: "Verify existence of JWT bearer tokens on private routes and robust resource controls.",
          costOptimization: "Batch route definitions cleanly and omit lengthy conversational introductory paragraphs."
        },
        {
          id: "roadmap_coordinator",
          name: "Development Roadmap Planner",
          role: "Implementation Schedules & Milestone Checklists",
          description: "Translates technical schematics, DB schemas, and API specs into a logical, sequential development roadmap with milestones and dependencies.",
          intelligenceTier: "gemini-3.5-flash",
          inputs: ["OpenAPI Swagger Specifications", "PostgreSQL Schema DDLs"],
          outputs: ["Sprint Milestone Checklist", "Implementation Sequence Chart"],
          tools: ["Progress Board Modeler", "Epic Scheduler", "Priority Scaffolder"],
          systemInstruction: "You are a veteran technical program manager. You convert backend schemas and routes into sequential, optimized sprint roadmaps with explicit milestone metrics.",
          decisionLogic: "Optimize critical production pathways. Sequence database and security locks before API and UI scaffolding.",
          costOptimization: "Output brief and structured milestone cards. Compress lists using tab-separated format."
        },
        {
          id: "deployment_manager",
          name: "Deployment & DevOps Orchestrator",
          role: "Docker Compilation & CI/CD Deployment Design",
          description: "Composes minimal, secure production-grade Docker containers, deployment YAML manifests (Cloud Run/K8s), and CI/CD workflow files.",
          intelligenceTier: "gemini-3.5-flash",
          inputs: ["Sprint Milestone Checklist", "OpenAPI Swagger Specifications"],
          outputs: ["Deploy container Dockerfile", "CI/CD Deployment Manifest"],
          tools: ["Multi-stage Docker compiler", "Kubernetes Spec Linter", "Ansible/Terraform Draft Editor"],
          systemInstruction: "You are a Cloud Infrastructure Architect. Create non-privileged multi-stage docker setups utilizing lightweight alpine bases and secure environment injectors.",
          decisionLogic: "Assert zero secrets are embedded in static containers; use runtime injection hooks.",
          costOptimization: "Utilize lightweight base standards. Formulate declarative scripts cleanly."
        }
      ],
      gates: [
        {
          id: "gate_security_rules",
          name: "Security Rules & Privacy Gate",
          reviewerAgentId: "api_designer",
          criteria: [
            "DB Schemas must require minimum 12+ rounds of bcrypt protection.",
            "API routes must enforce JWT authentication and headers security.",
            "Database permissions or Firebase security rules must restrict resource access strictly."
          ],
          testAsserts: [
            "assert(schemas.users.password_hash.entropyLevel >= 12)",
            "assert(api.headers.contains('Authorization'))"
          ],
          ifPassedTargetNodeId: "roadmap_coordinator",
          ifFailedTargetNodeId: "db_designer",
          feedbackProtocol: "Generate a detailed Zero-Trust Security Audit report detailing table violations, missing authorization points, and rule vulnerabilities."
        }
      ],
      edges: [
        {
          id: "e_sys_db",
          sourceId: "sys_features",
          targetId: "db_designer",
          type: "standard_route",
          label: "System Features Schema Blueprint"
        },
        {
          id: "e_db_api",
          sourceId: "db_designer",
          targetId: "api_designer",
          type: "standard_route",
          label: "Database Schemas DDL"
        },
        {
          id: "e_api_gate",
          sourceId: "api_designer",
          targetId: "gate_security_rules",
          type: "standard_route",
          label: "API Specs & Rate Limiters"
        },
        {
          id: "e_gate_pass",
          sourceId: "gate_security_rules",
          targetId: "roadmap_coordinator",
          type: "validation_pass",
          label: "PASS: Secured API & DB Contracts"
        },
        {
          id: "e_gate_fail",
          sourceId: "gate_security_rules",
          targetId: "db_designer",
          type: "validation_fail",
          label: "FAIL: Remediation Feedback Loop"
        },
        {
          id: "e_map_deploy",
          sourceId: "roadmap_coordinator",
          targetId: "deployment_manager",
          type: "standard_route",
          label: "Sprint Milestones Roadmap"
        }
      ],
      failureHandling: {
        maxRetryBudgets: 3,
        fallbackTriggerPolicy: "Roll back system design draft & isolate spec blocks. Escalate to Security Officer.",
        alertingChannels: ["Security Slack Alerts", "DevOps Incident PagerDuty"],
        circuitBreakerConditions: "Consecutive gate failures where security criteria are unaddressed."
      },
      optimization: {
        promptWrapping: "All task schemas must enforce strict validation controls to eliminate empty code structures.",
        cachingStrategy: "Cache baseline DDL contracts on contextual prompt level.",
        parallelizationOpportunity: "API route scaffolding can run alongside initial milestones definition."
      },
      scalability: {
        concurrencyModel: "Distributed messaging queues supporting concurrent feature parsers.",
        agentOrchestrationPattern: "Complex State-graph orchestrated workflow.",
        eventSubscriptionModel: "Real-time subscriptions when scope requirements are approved."
      }
    }
  }
];

export const SAMPLE_SIMULATIONS: Record<string, { steps: any[] }> = {
  "Ultimate Project Blueprint Creator": {
    steps: [
      {
        nodeId: "requirements_agent",
        nodeName: "Requirements Agent (Project Analyzer)",
        nodeType: "agent",
        status: "success",
        message: "Decomposing input user idea: 'Build a 3D animation platform.' Analyzing system scope bounds and evaluating standard MVP sizing checklists...",
        inputReceived: "Build a 3D animation platform.",
        outputProduced: JSON.stringify({
          complexityScore: "89/100 (High-Complexity Product)",
          estimatedTime: "12 - 16 Weeks to MVP",
          teamRequirements: [
            "1 Lead Graphics Developer (Canvas & WebGL)",
            "1 Full-Stack Systems Engineer (WS & Caches)",
            "1 Cloud DevOps Architect (GPU Nodes)",
            "1 UX Interface Designer"
          ],
          features: [
            "Interactive Web-WebGL workspace viewport with render cache",
            "Timeline editor with keyframe interpolation mechanics",
            "Drag-and-drop support for glTF, OBJ spatial resources",
            "Batch GPU server-side video rendering queues"
          ]
        }, null, 2)
      },
      {
        nodeId: "systems_architect",
        nodeName: "Lead Systems Architect (Stack Recommender)",
        nodeType: "agent",
        status: "success",
        message: "Evaluating latency parameters and heavy binary-asset storage mechanics for 3D graphics model flows...",
        inputReceived: "Features List: Interactive Web-WebGL workspace, Timeline editor, glTF drag-and-drop, GPU rendering queues.",
        outputProduced: JSON.stringify({
          techStack: {
            frontend: "React with TypeScript, Three.js, React Three Fiber, Tailwind CSS, Zustand state",
            backend: "Node.js (Express), Socket.io (WebSocket synchronizer), BullMQ (batch queue coordinator)",
            database: "PostgreSQL (equipped with pgvector for geometry index lookups), Redis caching keys",
            hosting: "AWS ECS with NVIDIA GPU G4dn compute instances, AWS S3 asset buckets, Vercel SPA hosting"
          }
        }, null, 2)
      },
      {
        nodeId: "db_designer",
        nodeName: "Database Designer (Schema Modeler)",
        nodeType: "agent",
        status: "success",
        message: "Generating third-normal-form relational data dictionary with foreign cascade constraints...",
        inputReceived: "Target Technology: PostgreSQL. Selected structures: Projects, Assets, Keyframes, Subscriptions.",
        outputProduced: `CREATE TABLE WorkspaceProjects (
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
);`
      },
      {
        nodeId: "api_designer",
        nodeName: "API Designer (REST Specialist)",
        nodeType: "agent",
        status: "success",
        message: "Compiling CRUD endpoints and WebSocket payload specifications...",
        inputReceived: "PostgreSQL DDL Tables configuration.",
        outputProduced: `paths:
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
                projectId: { type: string, format: uuid }`
      },
      {
        nodeId: "gate_security_check",
        nodeName: "Zero-Trust Security & Data Privacy Gate",
        nodeType: "gate",
        status: "failed",
        message: "Scanning endpoint declarations against security checks checklist...",
        inputReceived: "API routing spec and database rules.",
        outputProduced: "Security Audit Status: FAILED",
        feedbackNote: "Security Rules Check failed:\n1. Cryptographic alert: WorkspaceProjects lacks credentials salting checks on workspace export passwords.\n2. API Vulnerability: POST /api/v1/renders endpoint lacks a rate-limiter, posing an extreme GPU cost consumption DDoS risk."
      },
      {
        nodeId: "db_designer",
        nodeName: "Database Designer (Schema Modeler)",
        nodeType: "agent",
        status: "success",
        message: "Adding bcrypt hashing protection schema requirements and configuring rate limit parameters...",
        inputReceived: "Auditor warning: lacks credentials salting, lacks rate limiting details.",
        outputProduced: `CREATE TABLE SecCredentials (
  cred_id UUID PRIMARY KEY,
  user_id UUID,
  bcrypt_hash_12_rounds VARCHAR(255) NOT NULL
);
-- Rate Limit: Max 10 GPU render jobs/hour compiled at security layer`
      },
      {
        nodeId: "gate_security_check",
        nodeName: "Zero-Trust Security & Data Privacy Gate",
        nodeType: "gate",
        status: "success",
        message: "Rechecking cryptographic work factors and input limiter rules...",
        inputReceived: "Revised table schema and rate limit boundaries.",
        outputProduced: "Security Audit Status: PASSED\nZero warnings found."
      },
      {
        nodeId: "roadmap_generator",
        nodeName: "Roadmap Generator (Milestone Scheduler)",
        nodeType: "agent",
        status: "success",
        message: "Configuring development velocity roadmaps and dependency milestones...",
        inputReceived: "Verified schemas & endpoints specifications.",
        outputProduced: JSON.stringify([
          { week: "Week 1", topic: "3D Spatial State Modeling: Three.js canvas setup, scene saving logic" },
          { week: "Week 2", topic: "Timeline mechanics: Keyframe creation, bezier path calculations" },
          { week: "Week 3", topic: "WebSocket broker: Real-time user cursor sync and lock sharing" },
          { week: "Week 4", topic: "GPU render workers: Dockerizing render processes, AWS queue setups, load verification" }
        ], null, 2)
      },
      {
        nodeId: "final_blueprint",
        nodeName: "Final Blueprint (Production Assembler)",
        nodeType: "agent",
        status: "success",
        message: "Aggregating full technical specifications, estimating pricing tables, and plotting UI layout components...",
        inputReceived: "Sprint schedule and verified tech stack.",
        outputProduced: JSON.stringify({
          costEstimates: {
            developmentCost: "₹25,00,000–₹50,00,000 ($30,000–$60,000)",
            monthlyServerCost: "₹35,000–₹1,20,000 ($400–$1,500) (High-end AWS G4dn GPU units included)"
          },
          uiScreens: [
            "Studio Workspace 3D Canvas Editor screen (ThreeJS, Material Library, Keyframe Slider)",
            "Project Dashboard manager (glTF file explorer, billing overview, usage graphs)",
            "GPU Render Jobs queue panel (active renders status list, historical MP4 downloads)"
          ],
          downloadableBlueprint: {
            fileFormat: "JSON_SCHEMA v4.1",
            projectName: "RenderForge3D",
            buildVersion: "2026.a",
            generatedAt: "2026-06-04T06:49:23Z"
          }
        }, null, 2)
      }
    ]
  },
  "Full-Stack Feature Development": {
    steps: [
      {
        nodeId: "sys_planner",
        nodeName: "Lead Systems Architect",
        nodeType: "agent",
        status: "processing",
        message: "Decomposing user request: 'Verify secure authentication and password encryption schemas.' Generating contract designs...",
        inputReceived: "User request to design and implement secure JWT authentication with password hashing using modern guidelines.",
        outputProduced: "REST API Endpoint Contract:\n- POST /api/auth/register\n- POST /api/auth/login\nDatabase Schema: Users table (id UUIDv4, email critical unique, passwordHash varchar, createdAt timestamp).\nSecurity requirement: bcrypt password stretching logic with 12 salt rounds."
      },
      {
        nodeId: "code_dev",
        nodeName: "Senior Software Engineer",
        nodeType: "agent",
        status: "processing",
        message: "Reading technical spec model. Writing React client layout and custom Express router endpoints with validation guards...",
        inputReceived: "OpenAPI endpoints and Database specs.",
        outputProduced: "Express: 'const router = express.Router(); router.post(\"/register\", (req, res) => { const salt = bcrypt.genSaltSync(11); ... });' React: 'export default function LoginForm() { const [email, setEmail] = useState(\"\"); ... }' Test: 'it(\"should issue JWT on correct pwd logins...\")'"
      },
      {
        nodeId: "gate_code_audit",
        nodeName: "Quality & Security Gate",
        nodeType: "gate",
        status: "failed",
        message: "Running static analysis codes and coverage scans. Checking security policies...",
        inputReceived: "React code, Express router, and test suite.",
        outputProduced: "Test execution reports.",
        feedbackNote: "Code Verification Check failed:\n1. Cryptographic warning: Password hashing salt rounds set to 11. Security spec explicitly required a minimum of 12 rounds for strong entropy.\n2. Express: Unwrapped potential throwing error if DB network connection is down, causing unhandled server crash."
      },
      {
        nodeId: "code_dev",
        nodeName: "Senior Software Engineer",
        nodeType: "agent",
        status: "processing",
        message: "Remediating code blocks based on QA feedback: Upgrading cryptographic parameters and wrapping database routines inside try/catch...",
        inputReceived: "Code review remediation guidelines: salt rounds 11 -> 12, wrap DB calls in try/catch block.",
        outputProduced: "Express Update: router.post('/register', async (req, res) => { try { const salt = await bcrypt.genSalt(12); ... } catch (err) { res.status(500).json({ error: 'Database transaction failed safely' }) } });"
      },
      {
        nodeId: "gate_code_audit",
        nodeName: "Quality & Security Gate",
        nodeType: "gate",
        status: "success",
        message: "Running AST audit verification suite. Recheck compilation and test coverages...",
        inputReceived: "Revised Express controller and updated registration suite.",
        outputProduced: "Compilation status: SUCCESS\nOWASP security scan: 0 critical vulnerabilities\nLint reports: 0 warnings\nCoverage score: 89.4% (PASS)"
      },
      {
        nodeId: "deployment_manager",
        nodeName: "Release & DevOps Orchestrator",
        nodeType: "agent",
        status: "success",
        message: "Packaging build assets. Creating multi-stage Docker configurations. Writing release notes.",
        inputReceived: "Verified compiler build specs.",
        outputProduced: "Docker Blueprint:\nFROM node:22-alpine AS build ...\nFROM node:22-alpine-slim AS run ...\nCI/CD Configuration: .github/workflows/deploy.yml generated.\nDeployment sequence finalized: Canary rollout initiated (10% traffic routing validation)."
      }
    ]
  },
  "Enterprise Financial Reporting & Audit": {
    steps: [
      {
        nodeId: "fin_ingest",
        nodeName: "Data Ingestion Agent",
        nodeType: "agent",
        status: "success",
        message: "Parsing incoming ledger transaction dataset. Standardizing field types...",
        inputReceived: "Q2 corporate ledger transaction CSV and balancing files.",
        outputProduced: "Parsed Debits: $1,420,500.00\nParsed Credits: $1,420,500.00\nBalance Variance: 0.0000% (Mathematical Integrity: Perfect)."
      },
      {
        nodeId: "quant_analyst",
        nodeName: "Quantitative Auditor",
        nodeType: "agent",
        status: "success",
        message: "Running statistical models on debits/credits. Checking Benford distribution values...",
        inputReceived: "Normalized balances ledger report.",
        outputProduced: "Anomaly Detection System Report:\n- 1 entry of $124,500 categorized as 'offshore asset transfer' from subsidiary to tax-haven entity.\n- Benford compliance rating: 91.2% (Standard variation bounds)."
      },
      {
        nodeId: "gate_compliance",
        nodeName: "Regulatory Audit Gate",
        nodeType: "gate",
        status: "failed",
        message: "Evaluating corporate filings against SEC Form 10-Q guidelines and legal requirements...",
        inputReceived: "Qualitative reports and flagged anomalies.",
        outputProduced: "Legal assessment notes.",
        feedbackNote: "Compliance Check failed:\n1. Sarbanes-Oxley 404 alert: Subsidiary transaction to offshore tax-haven ($124,500) lacks corresponding management authorization signature and certified commercial invoice document, posing legal reporting liabilities."
      },
      {
        nodeId: "quant_analyst",
        nodeName: "Quantitative Auditor",
        nodeType: "agent",
        status: "success",
        message: "Retrieving corresponding invoice and management sign-off metadata from archived folders. Appending certified paperwork...",
        inputReceived: "Remediation feed tracking missing signatures and invoices.",
        outputProduced: "Document Dossier: Appended Board Authorization resolution code #AUTH-4091 and verified digital invoice #INV-9941. Anomaly classified and compliant."
      },
      {
        nodeId: "gate_compliance",
        nodeName: "Regulatory Audit Gate",
        nodeType: "gate",
        status: "success",
        message: "Verifying regulatory checklists against certified documentation logs...",
        inputReceived: "Updated Anomaly Dossier with matching invoice and signatures.",
        outputProduced: "Regulatory Compliance rating: 100% compliant.\nLedger flagged as: SEC audits ready."
      }
    ]
  },
  "Marketing & Brand Voice Copy Engine": {
    steps: [
      {
        nodeId: "copywriter",
        nodeName: "Creative UX Copywriter",
        nodeType: "agent",
        status: "success",
        message: "Brainstorming creative slogans. Crafting emotional UX messaging...",
        inputReceived: "Product specifications for a new eco-friendly water bottle. Tone instructions: bold, minimalist, optimistic.",
        outputProduced: "Main Slogans:\n1. 'Sip cleaner, respect nature. The zero-plastic bottle.'\n2. 'Pure path to hydration. 100% compostable.'\nNewsletter Draft: 'Meet EarthBottle, the dynamic flask engineered to return completely to nature...'"
      },
      {
        nodeId: "seo_auditor",
        nodeName: "SEO Engine Optimization Agent",
        nodeType: "agent",
        status: "success",
        message: "Integrating high-competition search terms and computing copy readability indices...",
        inputReceived: "Draft Creative copywriting slogans.",
        outputProduced: "SEO Campaign Copy: 'Introducing EarthBottle, the best eco-friendly reusable water bottle for active hikers. Engineered to provide plastic-free hydration...'\nKeyword density: 'eco-friendly water bottle' is 2.1%. Readability score: Grade 6.7 (PASS)."
      },
      {
        nodeId: "gate_brand_voice",
        nodeName: "Brand Compliance Gate",
        nodeType: "gate",
        status: "failed",
        message: "Scanning draft for brand voice matching and competitor trade registries...",
        inputReceived: "SEO integrated campaign deliverables.",
        outputProduced: "Compliance Scorecard.",
        feedbackNote: "Brand compliance warning:\n1. Copy contains phrase 'the best eco-friendly reusable water bottle', which violates our fair-marketing brand policy. We avoid superlative absolute claims ('the best') to stay authentic and avert product-liability warnings.\n2. Phrasing sounds slightly clinical in SEO paragraphs."
      },
      {
        nodeId: "copywriter",
        nodeName: "Creative UX Copywriter",
        nodeType: "agent",
        status: "success",
        message: "Refining copy to sound conversational and swapping absolute superlatives back with human assertions...",
        inputReceived: "Compliance feedback memo: remove superlative absolute claims.",
        outputProduced: "Snappy Revision: 'EarthBottle. Inspired by nature, built for the trails. Your partner in single-use plastic-free hydration.' (Zero brand warnings, high conversational energy)."
      },
      {
        nodeId: "gate_brand_voice",
        nodeName: "Brand Compliance Gate",
        nodeType: "gate",
        status: "success",
        message: "Examinating updated drafts...",
        inputReceived: "Snappy Revision Copy.",
        outputProduced: "Brand compliance rating: Approved.\nTrademark safety: 100% compliant."
      }
    ]
  },
  "System Features Lifecycle": {
    steps: [
      {
        nodeId: "sys_features",
        nodeName: "System Features Analyst",
        nodeType: "agent",
        status: "success",
        message: "Decomposing input requirements: 'Verify secure registration, secure session tokens, and database encryption.' Extracting requirements into structured feature scopes.",
        inputReceived: "Scaffold a secure authentication controller, database storage tables, and Docker cloud deployment.",
        outputProduced: "System Features Blueprint:\n- Requirement 1: Database credentials hashing logic (Bcrypt, 12 salt rounds).\n- Requirement 2: REST routes mapping users registration and token generation.\n- Requirement 3: Multi-stage slim Docker runtime workspace compilation."
      },
      {
        nodeId: "db_designer",
        nodeName: "Database Design Architect",
        nodeType: "agent",
        status: "success",
        message: "Generating schema tables under SQLite/Postgres. Designing secondary key linkages and security password criteria...",
        inputReceived: "System Features Blueprint outlining data field requirements.",
        outputProduced: "DDL Matrix:\nCREATE TABLE SystemUsers (\n  user_id UUID PRIMARY KEY,\n  email VARCHAR(255) UNIQUE NOT NULL,\n  credentials_hash VARCHAR(512) NOT NULL\n);\nNote: Preliminary hashing parameters generated using dynamic parameters of 10-salt rounds (baseline verification)."
      },
      {
        nodeId: "api_designer",
        nodeName: "API Design Specialist",
        nodeType: "agent",
        status: "success",
        message: "Compiling REST endpoints. Injecting request validation schemas and authentication checks...",
        inputReceived: "Database table mappings and System Features Blueprint.",
        outputProduced: "REST API OpenAPI Specifications:\n- POST /api/v1/users/register (Requires body: email, password)\n- POST /api/v1/users/login (Returns JWT token)\nSecurity authorization headers required on all downstream queries."
      },
      {
        nodeId: "gate_security_rules",
        nodeName: "Security Rules & Privacy Gate",
        nodeType: "gate",
        status: "failed",
        message: "Analyzing credentials encryption policies and route validation schemes against Zero-Trust compliance checklist...",
        inputReceived: "OpenAPI API specifications and PostgreSQL schemas.",
        outputProduced: "Audit Report Compiled.",
        feedbackNote: "Security Rules audit failed:\n1. Encryption weakness: Table 'SystemUsers' password salt rounds defined as 10. The security protocol explicitly requires a minimum of 12 for strong work-factor entropy.\n2. API Spec vulnerability: POST /api/v1/users/register lacks request volume rate limiter rules, exposing endpoints to DDoS."
      },
      {
        nodeId: "db_designer",
        nodeName: "Database Design Architect",
        nodeType: "agent",
        status: "success",
        message: "Processing Auditor feedback logs. Upgrading crypt-stretching salt factor from 10 to 12. Appending table indexes.",
        inputReceived: "Zero-Trust Security Auditor feedback note",
        outputProduced: "Revised DDL Configuration:\n- Updated Password salt work factor to: 12\n- Index added on SystemUsers(email) for rapid lookup.\n- Embedded rate limiters on API schemas."
      },
      {
        nodeId: "gate_security_rules",
        nodeName: "Security Rules & Privacy Gate",
        nodeType: "gate",
        status: "success",
        message: "Rechecking revised relational rules and API volume policies...",
        inputReceived: "Updated schemas and expanded endpoint contracts.",
        outputProduced: "Security audit status: APPROVED.\nPasswords entropy levels conform to standard secure practices. Zero warnings found."
      },
      {
        nodeId: "roadmap_coordinator",
        nodeName: "Development Roadmap Planner",
        nodeType: "agent",
        status: "success",
        message: "Formulating dependency diagrams. Packaging technical specifications into modular Sprint deliverables...",
        inputReceived: "Approved schemas and API endpoint contracts.",
        outputProduced: "Roadmap Milestones:\n- Sprint 1 (Base State): Connect relational schemas with UUIDv4 constraints.\n- Sprint 2 (Routing Context): Register routes, input validators and JWT verification modules.\n- Sprint 3 (Lockdown): Add rate limits and compliance rule testing."
      },
      {
        nodeId: "deployment_manager",
        nodeName: "Deployment & DevOps Orchestrator",
        nodeType: "agent",
        status: "success",
        message: "Authoring slim multi-stage Docker configurations. Writing release action guidelines...",
        inputReceived: "Sprint roadmap milestone definitions and secure API endpoints.",
        outputProduced: "Container Dockerfile:\nFROM node:22-alpine AS build\nWORK dir /app ...\nFROM node:22-alpine-slim AS run\nUSER node\nEXPOSE 3000\nDeployment pipeline active: GKE Deployment spec compiled with rolling updates."
      }
    ]
  }
};
