/**
 * AI Job Displacement Attribution Model v2
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * EDGE CASES AND FACTORS ADDRESSED
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 1. TEMPORAL FACTORS
 *    - Company founding ≠ product launch (OpenAI founded 2015, ChatGPT Nov 2022)
 *    - AI Era started Nov 2022 (ChatGPT launch)
 *    - Time to enterprise adoption (typically 6-12 months after launch)
 *    - Companies can't displace jobs before they have products
 * 
 * 2. OPERATIONAL STATUS
 *    - Cruise: Operations suspended Oct 2023 (reduced to 20% effectiveness)
 *    - Inflection AI: Team acquired by Microsoft March 2024 (reduced)
 *    - Stability AI: Financial troubles, layoffs (reduced to 50%)
 *    - Safe Superintelligence: No product yet (0% effectiveness)
 *    - Pre-revenue companies: Minimal actual displacement
 * 
 * 3. PRODUCT vs RESEARCH
 *    - Some companies are still in R&D with no deployed product
 *    - Pilot deployments vs production scale
 *    - Enterprise customers vs consumer users
 * 
 * 4. DISPLACEMENT TYPE
 *    - Direct Replacement: AI directly does human job (Cursor, Sierra, Harvey)
 *    - Augmentation: Makes humans faster but doesn't eliminate roles (Gong, Miro)
 *    - Infrastructure: Enables others to build AI (Databricks, Scale AI)
 * 
 * 5. ENTERPRISE vs CONSUMER
 *    - Enterprise AI has larger displacement impact per deployment
 *    - Consumer AI (Character.ai) has minimal job displacement
 * 
 * 6. MARKET PENETRATION
 *    - Actual adoption rate matters more than valuation
 *    - We estimate penetration based on: funding stage, press coverage, known customers
 * 
 * 7. COMPETITIVE OVERLAP
 *    - Companies in same category share the displacement pool
 *    - OpenAI and Anthropic compete - attribution is split, not additive
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * FORMULA
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Raw Score = 
 *   Category_Allocation
 *   × Market_Share_In_Category (log-scaled valuation)
 *   × Deployment_Maturity (0-1 based on product age & status)
 *   × Displacement_Type (direct=1.0, augment=0.5, infra=0.3)
 *   × Operational_Factor (0-1 based on current status)
 *   × Enterprise_Factor (enterprise=1.0, prosumer=0.6, consumer=0.2)
 * 
 * Then normalize so all companies sum to total displacement.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const AI_ERA_START = new Date('2022-11-30'); // ChatGPT launch
const CURRENT_DATE = new Date('2026-02-01');
const MONTHS_SINCE_AI_ERA = Math.floor((CURRENT_DATE - AI_ERA_START) / (1000 * 60 * 60 * 24 * 30));

// ============================================================================
// CATEGORY DEFINITIONS - Based on BLS/McKinsey AI exposure research
// ============================================================================

const DISPLACEMENT_CATEGORIES = {
  foundation_models: {
    name: "Foundation Models",
    allocation: 0.22, // Powers everything else
    jobs_affected: ["Software developers", "Content creators", "Analysts"]
  },
  coding: {
    name: "AI Coding Tools",
    allocation: 0.20, // Software is highly exposed
    jobs_affected: ["Software engineers", "QA testers", "DevOps"]
  },
  customer_service: {
    name: "Customer Service AI",
    allocation: 0.18, // Large low-skill workforce
    jobs_affected: ["Support agents", "Call center reps", "Chat support"]
  },
  administrative: {
    name: "Administrative AI",
    allocation: 0.12,
    jobs_affected: ["Paralegals", "Data entry", "Admin assistants"]
  },
  autonomous: {
    name: "Autonomous Systems",
    allocation: 0.10,
    jobs_affected: ["Drivers", "Warehouse workers", "Delivery"]
  },
  creative: {
    name: "Creative AI",
    allocation: 0.08,
    jobs_affected: ["Writers", "Designers", "Video editors", "Voice actors"]
  },
  sales_marketing: {
    name: "Sales & Marketing AI",
    allocation: 0.06,
    jobs_affected: ["SDRs", "Marketing analysts", "Lead gen"]
  },
  analytics: {
    name: "Data & Analytics AI",
    allocation: 0.03,
    jobs_affected: ["Data analysts", "BI developers", "Researchers"]
  },
  healthcare: {
    name: "Healthcare AI",
    allocation: 0.01, // Heavily regulated, slow adoption
    jobs_affected: ["Medical scribes", "Coders", "Transcriptionists"]
  }
};

// Verify allocations sum to 1
const totalAllocation = Object.values(DISPLACEMENT_CATEGORIES).reduce((sum, c) => sum + c.allocation, 0);
console.assert(Math.abs(totalAllocation - 1.0) < 0.01, `Category allocations sum to ${totalAllocation}, expected 1.0`);

// ============================================================================
// COMPANY DATA WITH ALL FACTORS
// ============================================================================

const US_AI_COMPANIES = [
  // ═══════════════════════════════════════════════════════════════════════════
  // FOUNDATION MODELS (22% of total displacement)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "OpenAI",
    valuation: 500,
    category: "foundation_models",
    industry: "Foundation Models / LLM",
    founded: 2015,
    productLaunch: new Date('2022-11-30'), // ChatGPT
    displacementType: "infrastructure", // API used by others
    operationalStatus: 1.0, // Fully operational
    enterpriseLevel: "enterprise", // Enterprise focus
    notes: "ChatGPT, GPT-4 API - enables downstream displacement"
  },
  {
    name: "Anthropic",
    valuation: 183,
    category: "foundation_models",
    industry: "Foundation Models / LLM",
    founded: 2021,
    productLaunch: new Date('2023-03-14'), // Claude launch
    displacementType: "infrastructure",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "Claude - enterprise AI assistant API"
  },
  {
    name: "xAI",
    valuation: 50,
    category: "foundation_models",
    industry: "Foundation Models / LLM",
    founded: 2023,
    productLaunch: new Date('2023-11-04'), // Grok launch
    displacementType: "infrastructure",
    operationalStatus: 1.0,
    enterpriseLevel: "prosumer", // X integration, less enterprise
    notes: "Grok - integrated with X/Twitter"
  },
  {
    name: "Cohere",
    valuation: 7,
    category: "foundation_models",
    industry: "Enterprise LLM",
    founded: 2019,
    productLaunch: new Date('2022-01-01'), // Earlier than ChatGPT
    displacementType: "infrastructure",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "Enterprise-focused LLM provider"
  },
  {
    name: "AI21 Labs",
    valuation: 1.4,
    category: "foundation_models",
    industry: "Enterprise LLM",
    founded: 2017,
    productLaunch: new Date('2021-08-01'), // Jurassic-1
    displacementType: "infrastructure",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "Jurassic models, WordTune"
  },
  {
    name: "Inflection AI",
    valuation: 4,
    category: "foundation_models",
    industry: "Conversational AI",
    founded: 2022,
    productLaunch: new Date('2023-05-02'), // Pi launch
    displacementType: "infrastructure",
    operationalStatus: 0.2, // Team acquired by Microsoft March 2024
    enterpriseLevel: "consumer",
    notes: "Pi assistant - team largely moved to Microsoft"
  },
  {
    name: "Character.ai",
    valuation: 1,
    category: "foundation_models",
    industry: "Entertainment AI",
    founded: 2021,
    productLaunch: new Date('2022-09-16'),
    displacementType: "augmentation", // Entertainment, not replacing jobs
    operationalStatus: 0.8, // Google deal, team changes
    enterpriseLevel: "consumer", // Pure consumer
    notes: "AI characters for entertainment - minimal job displacement"
  },
  {
    name: "Perplexity",
    valuation: 20,
    category: "foundation_models",
    industry: "AI Search",
    founded: 2022,
    productLaunch: new Date('2022-12-07'),
    displacementType: "direct", // Replaces research tasks
    operationalStatus: 1.0,
    enterpriseLevel: "prosumer",
    notes: "AI-powered search - replaces research work"
  },
  {
    name: "You.com",
    valuation: 2,
    category: "foundation_models",
    industry: "AI Search",
    founded: 2020,
    productLaunch: new Date('2022-07-01'),
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "prosumer",
    notes: "AI search engine"
  },
  {
    name: "Safe Superintelligence",
    valuation: 32,
    category: "foundation_models",
    industry: "AI Research",
    founded: 2024,
    productLaunch: null, // NO PRODUCT YET
    displacementType: "infrastructure",
    operationalStatus: 0.0, // No product = no displacement
    enterpriseLevel: "enterprise",
    notes: "Research company, no product launched yet"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AI CODING TOOLS (20% of total displacement)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Anysphere (Cursor)",
    valuation: 29.3,
    category: "coding",
    industry: "AI Coding Assistant",
    founded: 2022,
    productLaunch: new Date('2023-03-01'), // Cursor launch
    displacementType: "direct", // Directly reduces dev needs
    operationalStatus: 1.0,
    enterpriseLevel: "prosumer", // Developer tool
    notes: "AI-first code editor - directly reduces developer headcount"
  },
  {
    name: "Cognition (Devin)",
    valuation: 10,
    category: "coding",
    industry: "AI Software Engineer",
    founded: 2023,
    productLaunch: new Date('2024-03-12'), // Devin announcement
    displacementType: "direct",
    operationalStatus: 0.7, // Limited availability
    enterpriseLevel: "enterprise",
    notes: "Autonomous AI software engineer - limited rollout"
  },
  {
    name: "Replit",
    valuation: 3,
    category: "coding",
    industry: "AI Development Platform",
    founded: 2016,
    productLaunch: new Date('2023-04-25'), // Ghostwriter AI
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "prosumer",
    notes: "AI-assisted coding platform"
  },
  {
    name: "Poolside",
    valuation: 3,
    category: "coding",
    industry: "AI Code Generation",
    founded: 2023,
    productLaunch: new Date('2024-06-01'), // Limited release
    displacementType: "direct",
    operationalStatus: 0.5, // Early stage
    enterpriseLevel: "enterprise",
    notes: "Code generation models - early enterprise pilots"
  },
  {
    name: "Sourcegraph (Cody)",
    valuation: 2.6,
    category: "coding",
    industry: "AI Code Intelligence",
    founded: 2013,
    productLaunch: new Date('2023-06-14'), // Cody launch
    displacementType: "augmentation", // Assists rather than replaces
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "Cody AI assistant for code understanding"
  },
  {
    name: "Tabnine",
    valuation: 1,
    category: "coding",
    industry: "AI Code Completion",
    founded: 2013,
    productLaunch: new Date('2019-01-01'), // Pre-ChatGPT
    displacementType: "augmentation",
    operationalStatus: 1.0,
    enterpriseLevel: "prosumer",
    notes: "AI code completion - productivity tool"
  },
  {
    name: "Vercel",
    valuation: 9,
    category: "coding",
    industry: "AI Dev Platform",
    founded: 2015,
    productLaunch: new Date('2023-05-01'), // v0 and AI features
    displacementType: "augmentation",
    operationalStatus: 1.0,
    enterpriseLevel: "prosumer",
    notes: "v0 AI frontend generation"
  },
  {
    name: "Supabase",
    valuation: 5,
    category: "coding",
    industry: "AI Backend Platform",
    founded: 2020,
    productLaunch: new Date('2023-08-01'), // AI features
    displacementType: "augmentation",
    operationalStatus: 1.0,
    enterpriseLevel: "prosumer",
    notes: "AI-assisted backend development"
  },
  {
    name: "Hugging Face",
    valuation: 5,
    category: "coding",
    industry: "AI/ML Platform",
    founded: 2016,
    productLaunch: new Date('2019-01-01'),
    displacementType: "infrastructure",
    operationalStatus: 1.0,
    enterpriseLevel: "prosumer",
    notes: "Model hub and deployment platform"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CUSTOMER SERVICE AI (18% of total displacement)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Sierra",
    valuation: 10,
    category: "customer_service",
    industry: "AI Customer Service",
    founded: 2023,
    productLaunch: new Date('2024-02-13'), // Public launch
    displacementType: "direct", // Replaces support agents
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI agents fully replacing human support"
  },
  {
    name: "Talkdesk",
    valuation: 10,
    category: "customer_service",
    industry: "AI Contact Center",
    founded: 2011,
    productLaunch: new Date('2022-01-01'), // AI features added
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI-powered contact center platform"
  },
  {
    name: "Decagon",
    valuation: 2,
    category: "customer_service",
    industry: "AI Customer Support",
    founded: 2023,
    productLaunch: new Date('2024-01-01'),
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI support agents for enterprises"
  },
  {
    name: "Cresta",
    valuation: 2,
    category: "customer_service",
    industry: "AI Contact Center",
    founded: 2017,
    productLaunch: new Date('2020-01-01'),
    displacementType: "augmentation", // Coaches humans, less direct
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI coaching for contact centers"
  },
  {
    name: "Ada",
    valuation: 1.2,
    category: "customer_service",
    industry: "AI Customer Service",
    founded: 2016,
    productLaunch: new Date('2017-01-01'),
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI chatbots replacing support staff"
  },
  {
    name: "Dialpad",
    valuation: 2.2,
    category: "customer_service",
    industry: "AI Communications",
    founded: 2011,
    productLaunch: new Date('2021-01-01'),
    displacementType: "augmentation",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI-powered business communications"
  },
  {
    name: "ASAPP",
    valuation: 2,
    category: "customer_service",
    industry: "AI Customer Service",
    founded: 2014,
    productLaunch: new Date('2018-01-01'),
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI for contact centers"
  },
  {
    name: "Uniphore",
    valuation: 3,
    category: "customer_service",
    industry: "Conversational AI",
    founded: 2008,
    productLaunch: new Date('2020-01-01'),
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "Conversational AI platform"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTONOMOUS SYSTEMS (10% of total displacement)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Waymo",
    valuation: 45,
    category: "autonomous",
    industry: "Autonomous Vehicles",
    founded: 2009,
    productLaunch: new Date('2020-10-01'), // Public service launch
    displacementType: "direct", // Replaces drivers
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "Self-driving taxis - Phoenix, SF, LA"
  },
  {
    name: "Cruise",
    valuation: 30,
    category: "autonomous",
    industry: "Autonomous Vehicles",
    founded: 2013,
    productLaunch: new Date('2022-06-01'),
    displacementType: "direct",
    operationalStatus: 0.2, // OPERATIONS SUSPENDED Oct 2023
    enterpriseLevel: "enterprise",
    notes: "Operations suspended after accident Oct 2023"
  },
  {
    name: "Figure",
    valuation: 39,
    category: "autonomous",
    industry: "Humanoid Robotics",
    founded: 2022,
    productLaunch: new Date('2024-01-18'), // Figure 01 demo
    displacementType: "direct",
    operationalStatus: 0.4, // Pilots only, not mass deployed
    enterpriseLevel: "enterprise",
    notes: "Humanoid robots - BMW pilot only, not mass deployed"
  },
  {
    name: "Nuro",
    valuation: 6,
    category: "autonomous",
    industry: "Autonomous Delivery",
    founded: 2016,
    productLaunch: new Date('2020-01-01'),
    displacementType: "direct",
    operationalStatus: 0.6, // Limited cities
    enterpriseLevel: "enterprise",
    notes: "Autonomous delivery - limited deployment"
  },
  {
    name: "Skydio",
    valuation: 2.2,
    category: "autonomous",
    industry: "Autonomous Drones",
    founded: 2014,
    productLaunch: new Date('2018-02-01'),
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI-powered drones - inspection, defense"
  },
  {
    name: "Applied Intuition",
    valuation: 15,
    category: "autonomous",
    industry: "AV Software",
    founded: 2017,
    productLaunch: new Date('2018-01-01'),
    displacementType: "infrastructure", // Enables AV development
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "Simulation platform for AVs - doesn't directly displace"
  },
  {
    name: "Physical Intelligence",
    valuation: 2.8,
    category: "autonomous",
    industry: "AI Robotics",
    founded: 2024,
    productLaunch: null, // NO PRODUCT YET
    displacementType: "direct",
    operationalStatus: 0.0, // No product
    enterpriseLevel: "enterprise",
    notes: "Robot foundation models - still in R&D"
  },
  {
    name: "Skild AI",
    valuation: 5,
    category: "autonomous",
    industry: "AI Robotics",
    founded: 2023,
    productLaunch: new Date('2024-07-01'), // Limited
    displacementType: "infrastructure",
    operationalStatus: 0.3, // Early stage
    enterpriseLevel: "enterprise",
    notes: "Foundation models for robotics - early pilots"
  },
  {
    name: "Dexterity",
    valuation: 2,
    category: "autonomous",
    industry: "Warehouse Robotics",
    founded: 2017,
    productLaunch: new Date('2022-01-01'),
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "Warehouse robots - deployed at scale"
  },
  {
    name: "Nimble Robotics",
    valuation: 1,
    category: "autonomous",
    industry: "Warehouse Robotics",
    founded: 2017,
    productLaunch: new Date('2021-01-01'),
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "Warehouse fulfillment robots"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATIVE AI (8% of total displacement)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "ElevenLabs",
    valuation: 6.6,
    category: "creative",
    industry: "AI Voice Synthesis",
    founded: 2022,
    productLaunch: new Date('2023-01-23'),
    displacementType: "direct", // Replaces voice actors
    operationalStatus: 1.0,
    enterpriseLevel: "prosumer",
    notes: "Voice cloning - directly replaces voice actors"
  },
  {
    name: "Runway",
    valuation: 3,
    category: "creative",
    industry: "AI Video Generation",
    founded: 2018,
    productLaunch: new Date('2023-02-06'), // Gen-1
    displacementType: "direct", // Replaces video editors
    operationalStatus: 1.0,
    enterpriseLevel: "prosumer",
    notes: "AI video generation - replaces video production"
  },
  {
    name: "Stability AI",
    valuation: 1,
    category: "creative",
    industry: "AI Image Generation",
    founded: 2019,
    productLaunch: new Date('2022-08-22'), // Stable Diffusion
    displacementType: "direct", // Replaces illustrators
    operationalStatus: 0.5, // Financial troubles, layoffs
    enterpriseLevel: "prosumer",
    notes: "Stable Diffusion - financial troubles reduced impact"
  },
  {
    name: "Jasper",
    valuation: 2,
    category: "creative",
    industry: "AI Content Writing",
    founded: 2021,
    productLaunch: new Date('2021-01-01'),
    displacementType: "direct", // Replaces copywriters
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI copywriting for marketing"
  },
  {
    name: "Suno",
    valuation: 2.45,
    category: "creative",
    industry: "AI Music Generation",
    founded: 2022,
    productLaunch: new Date('2023-09-20'),
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "consumer", // Consumer music creation
    notes: "AI music creation - consumer focused"
  },
  {
    name: "Synthesia",
    valuation: 4,
    category: "creative",
    industry: "AI Video Avatars",
    founded: 2017,
    productLaunch: new Date('2020-01-01'),
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI video avatars - replaces video production"
  },
  {
    name: "Gamma",
    valuation: 2.1,
    category: "creative",
    industry: "AI Presentations",
    founded: 2020,
    productLaunch: new Date('2022-08-01'),
    displacementType: "augmentation", // Assists presentation creation
    operationalStatus: 1.0,
    enterpriseLevel: "prosumer",
    notes: "AI-generated presentations"
  },
  {
    name: "Canva",
    valuation: 42,
    category: "creative",
    industry: "Design Platform + AI",
    founded: 2013,
    productLaunch: new Date('2023-03-23'), // Magic Studio
    displacementType: "augmentation", // AI is feature, not core
    operationalStatus: 1.0,
    enterpriseLevel: "prosumer",
    notes: "Magic Studio AI features - augments designers"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMINISTRATIVE AI (12% of total displacement)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Harvey",
    valuation: 8,
    category: "administrative",
    industry: "AI Legal",
    founded: 2022,
    productLaunch: new Date('2023-02-21'),
    displacementType: "direct", // Replaces paralegal work
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI for lawyers - replaces paralegals, research"
  },
  {
    name: "EvenUp",
    valuation: 2,
    category: "administrative",
    industry: "AI Legal",
    founded: 2019,
    productLaunch: new Date('2020-01-01'),
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI legal document automation"
  },
  {
    name: "Ironclad",
    valuation: 3.2,
    category: "administrative",
    industry: "AI Contract Management",
    founded: 2014,
    productLaunch: new Date('2023-03-01'), // AI features
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI contract lifecycle management"
  },
  {
    name: "Automation Anywhere",
    valuation: 7,
    category: "administrative",
    industry: "RPA / Automation",
    founded: 2003,
    productLaunch: new Date('2019-01-01'), // AI-enhanced
    displacementType: "direct", // Directly automates tasks
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "Robotic process automation"
  },
  {
    name: "Glean",
    valuation: 7,
    category: "administrative",
    industry: "Enterprise AI Search",
    founded: 2019,
    productLaunch: new Date('2021-10-01'),
    displacementType: "augmentation", // Helps find info, doesn't replace
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI workplace search - productivity tool"
  },
  {
    name: "Clio",
    valuation: 3,
    category: "administrative",
    industry: "Legal Tech + AI",
    founded: 2008,
    productLaunch: new Date('2023-06-01'), // AI features
    displacementType: "augmentation",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "Legal practice management with AI"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SALES & MARKETING AI (6% of total displacement)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Gong",
    valuation: 7.25,
    category: "sales_marketing",
    industry: "AI Sales Intelligence",
    founded: 2015,
    productLaunch: new Date('2016-01-01'),
    displacementType: "augmentation", // Helps sales, doesn't replace
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI sales analytics - augments reps"
  },
  {
    name: "6sense",
    valuation: 5.2,
    category: "sales_marketing",
    industry: "AI Sales/Marketing",
    founded: 2013,
    productLaunch: new Date('2017-01-01'),
    displacementType: "augmentation",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI-powered ABM platform"
  },
  {
    name: "Outreach",
    valuation: 4.4,
    category: "sales_marketing",
    industry: "AI Sales Engagement",
    founded: 2014,
    productLaunch: new Date('2015-01-01'),
    displacementType: "direct", // Automates SDR tasks
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI sales engagement - reduces SDR needs"
  },
  {
    name: "Highspot",
    valuation: 4,
    category: "sales_marketing",
    industry: "AI Sales Enablement",
    founded: 2012,
    productLaunch: new Date('2020-01-01'),
    displacementType: "augmentation",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI sales enablement"
  },
  {
    name: "Clari",
    valuation: 3,
    category: "sales_marketing",
    industry: "AI Revenue Platform",
    founded: 2013,
    productLaunch: new Date('2014-01-01'),
    displacementType: "augmentation",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI revenue intelligence"
  },
  {
    name: "Attentive",
    valuation: 7,
    category: "sales_marketing",
    industry: "AI Marketing",
    founded: 2016,
    productLaunch: new Date('2017-01-01'),
    displacementType: "direct", // Automates marketing
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI-powered SMS marketing"
  },
  {
    name: "Clay",
    valuation: 3,
    category: "sales_marketing",
    industry: "AI Data Enrichment",
    founded: 2017,
    productLaunch: new Date('2023-01-01'),
    displacementType: "direct", // Automates research
    operationalStatus: 1.0,
    enterpriseLevel: "prosumer",
    notes: "AI data enrichment for sales"
  },
  {
    name: "Apollo.io",
    valuation: 2,
    category: "sales_marketing",
    industry: "AI Sales Intelligence",
    founded: 2015,
    productLaunch: new Date('2020-01-01'),
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "prosumer",
    notes: "AI-powered sales platform"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA & ANALYTICS AI (3% of total displacement)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Databricks",
    valuation: 100,
    category: "analytics",
    industry: "AI/ML Data Platform",
    founded: 2013,
    productLaunch: new Date('2015-01-01'),
    displacementType: "infrastructure", // Enables analytics
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "Data lakehouse platform - enables AI development"
  },
  {
    name: "Scale AI",
    valuation: 29,
    category: "analytics",
    industry: "AI Data Infrastructure",
    founded: 2016,
    productLaunch: new Date('2016-01-01'),
    displacementType: "infrastructure",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI training data - enables model development"
  },
  {
    name: "AlphaSense",
    valuation: 4,
    category: "analytics",
    industry: "AI Market Research",
    founded: 2008,
    productLaunch: new Date('2020-01-01'),
    displacementType: "direct", // Replaces research analysts
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI-powered market intelligence"
  },
  {
    name: "ThoughtSpot",
    valuation: 4.2,
    category: "analytics",
    industry: "AI Analytics",
    founded: 2012,
    productLaunch: new Date('2014-01-01'),
    displacementType: "augmentation",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI-powered analytics"
  },
  {
    name: "Dataiku",
    valuation: 4,
    category: "analytics",
    industry: "AI/ML Platform",
    founded: 2013,
    productLaunch: new Date('2014-01-01'),
    displacementType: "augmentation",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "Enterprise AI platform"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALTHCARE AI (1% of total displacement - heavily regulated)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Abridge",
    valuation: 5,
    category: "healthcare",
    industry: "AI Medical Scribe",
    founded: 2018,
    productLaunch: new Date('2022-01-01'),
    displacementType: "direct", // Replaces medical scribes
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI medical documentation - replaces scribes"
  },
  {
    name: "Hippocratic AI",
    valuation: 4,
    category: "healthcare",
    industry: "AI Healthcare",
    founded: 2023,
    productLaunch: new Date('2024-05-01'), // Limited pilots
    displacementType: "direct",
    operationalStatus: 0.5, // Regulated, slow rollout
    enterpriseLevel: "enterprise",
    notes: "AI healthcare agents - limited deployment"
  },
  {
    name: "Ambience Healthcare",
    valuation: 1,
    category: "healthcare",
    industry: "AI Medical Scribe",
    founded: 2020,
    productLaunch: new Date('2023-01-01'),
    displacementType: "direct",
    operationalStatus: 1.0,
    enterpriseLevel: "enterprise",
    notes: "AI clinical documentation"
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL US AI COMPANIES (from unicorn list)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Data & Analytics
  { name: "VAST Data", valuation: 9.1, category: "analytics", industry: "AI Data Storage", founded: 2016, productLaunch: new Date('2019-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI-optimized data storage" },
  { name: "ClickHouse", valuation: 6, category: "analytics", industry: "AI Database", founded: 2021, productLaunch: new Date('2021-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Real-time analytics database" },
  { name: "Dataminr", valuation: 4.1, category: "analytics", industry: "AI Intelligence", founded: 2009, productLaunch: new Date('2012-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI-powered real-time alerts" },
  { name: "Cohesity", valuation: 7, category: "analytics", industry: "AI Data Management", founded: 2013, productLaunch: new Date('2019-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI data management platform" },
  { name: "H2O.ai", valuation: 2, category: "analytics", industry: "AI/ML Platform", founded: 2012, productLaunch: new Date('2014-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AutoML platform" },
  { name: "Anaconda", valuation: 2, category: "analytics", industry: "Data Science Platform", founded: 2012, productLaunch: new Date('2015-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "prosumer", notes: "Python data science distribution" },
  { name: "Placer.ai", valuation: 2, category: "analytics", industry: "AI Location Analytics", founded: 2016, productLaunch: new Date('2019-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Location intelligence platform" },
  { name: "Alation", valuation: 2, category: "analytics", industry: "AI Data Catalog", founded: 2012, productLaunch: new Date('2018-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Data catalog platform" },
  { name: "Neo4j", valuation: 2, category: "analytics", industry: "Graph Database + AI", founded: 2007, productLaunch: new Date('2020-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Graph database with AI features" },
  { name: "DataStax", valuation: 2, category: "analytics", industry: "AI Database", founded: 2010, productLaunch: new Date('2020-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Vector database for AI" },
  { name: "WEKA", valuation: 2, category: "analytics", industry: "AI Data Storage", founded: 2013, productLaunch: new Date('2019-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "High-performance data platform" },
  { name: "LogicMonitor", valuation: 2, category: "analytics", industry: "AI Monitoring", founded: 2007, productLaunch: new Date('2018-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI infrastructure monitoring" },
  { name: "HighRadius", valuation: 3.1, category: "analytics", industry: "AI Finance Analytics", founded: 2006, productLaunch: new Date('2019-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI-powered treasury management" },
  { name: "Collibra", valuation: 5.25, category: "analytics", industry: "AI Data Governance", founded: 2008, productLaunch: new Date('2019-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Data intelligence platform" },
  
  // AI Security
  { name: "Cyera", valuation: 6, category: "analytics", industry: "AI Data Security", founded: 2021, productLaunch: new Date('2022-06-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI-powered data security" },
  { name: "Abnormal AI", valuation: 5, category: "analytics", industry: "AI Email Security", founded: 2018, productLaunch: new Date('2020-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI email threat detection" },
  { name: "Socure", valuation: 5, category: "analytics", industry: "AI Identity", founded: 2012, productLaunch: new Date('2018-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI identity verification" },
  { name: "OneTrust", valuation: 5, category: "administrative", industry: "AI Privacy", founded: 2016, productLaunch: new Date('2019-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI privacy management" },
  { name: "Exabeam", valuation: 2, category: "analytics", industry: "AI Security Analytics", founded: 2013, productLaunch: new Date('2017-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI security operations" },
  { name: "Vectra AI", valuation: 1, category: "analytics", industry: "AI Threat Detection", founded: 2011, productLaunch: new Date('2015-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI threat detection and response" },
  { name: "Cyberhaven", valuation: 1, category: "analytics", industry: "AI Data Security", founded: 2014, productLaunch: new Date('2022-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Data detection and response" },
  { name: "Halcyon", valuation: 1, category: "analytics", industry: "AI Ransomware", founded: 2021, productLaunch: new Date('2023-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Anti-ransomware platform" },
  { name: "BigID", valuation: 1.25, category: "analytics", industry: "AI Data Discovery", founded: 2016, productLaunch: new Date('2019-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Data intelligence and privacy" },
  { name: "Salt Security", valuation: 1.4, category: "analytics", industry: "AI API Security", founded: 2015, productLaunch: new Date('2020-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "API security platform" },
  { name: "Aura", valuation: 2.5, category: "analytics", industry: "AI Identity Protection", founded: 2017, productLaunch: new Date('2020-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "consumer", notes: "Consumer identity protection" },
  
  // Healthcare AI (additional)
  { name: "OpenEvidence", valuation: 6, category: "healthcare", industry: "AI Clinical", founded: 2021, productLaunch: new Date('2023-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI clinical decision support" },
  { name: "Commure", valuation: 6, category: "healthcare", industry: "AI Healthcare Platform", founded: 2017, productLaunch: new Date('2022-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Healthcare operating system" },
  { name: "Innovaccer", valuation: 3.45, category: "healthcare", industry: "AI Healthcare Data", founded: 2014, productLaunch: new Date('2020-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Healthcare data platform" },
  { name: "Spring Health", valuation: 3.3, category: "healthcare", industry: "AI Mental Health", founded: 2016, productLaunch: new Date('2021-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI-powered mental health" },
  { name: "Sword Health", valuation: 4, category: "healthcare", industry: "AI Physical Therapy", founded: 2015, productLaunch: new Date('2020-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI physical therapy platform" },
  { name: "Viz", valuation: 1, category: "healthcare", industry: "AI Medical Imaging", founded: 2016, productLaunch: new Date('2020-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI stroke detection" },
  { name: "ConcertAI", valuation: 2, category: "healthcare", industry: "AI Oncology", founded: 2018, productLaunch: new Date('2021-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI oncology research" },
  { name: "Clarify Health Solutions", valuation: 1, category: "healthcare", industry: "AI Healthcare Analytics", founded: 2015, productLaunch: new Date('2020-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Healthcare analytics" },
  { name: "Immunai", valuation: 1, category: "healthcare", industry: "AI Drug Discovery", founded: 2018, productLaunch: new Date('2021-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI immunology platform" },
  { name: "Formation Bio", valuation: 1, category: "healthcare", industry: "AI Drug Development", founded: 2013, productLaunch: new Date('2021-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI drug development" },
  { name: "Insilico Medicine", valuation: 1, category: "healthcare", industry: "AI Drug Discovery", founded: 2014, productLaunch: new Date('2019-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI-powered drug discovery" },
  { name: "Xaira Therapeutics", valuation: 2.15, category: "healthcare", industry: "AI Drug Discovery", founded: 2023, productLaunch: new Date('2024-04-01'), displacementType: "augmentation", operationalStatus: 0.5, enterpriseLevel: "enterprise", notes: "AI drug discovery - early stage" },
  { name: "Lila Sciences", valuation: 1.23, category: "healthcare", industry: "AI Drug Discovery", founded: 2023, productLaunch: new Date('2024-06-01'), displacementType: "augmentation", operationalStatus: 0.5, enterpriseLevel: "enterprise", notes: "AI drug discovery" },
  
  // AI Infrastructure & Chips
  { name: "Cerebras Systems", valuation: 8, category: "foundation_models", industry: "AI Chips", founded: 2016, productLaunch: new Date('2019-08-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Wafer-scale AI chips" },
  { name: "Groq", valuation: 7, category: "foundation_models", industry: "AI Chips", founded: 2016, productLaunch: new Date('2022-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "LPU inference chips" },
  { name: "SambaNova", valuation: 5, category: "foundation_models", industry: "AI Chips", founded: 2017, productLaunch: new Date('2020-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI computing platform" },
  { name: "Lightmatter", valuation: 4.4, category: "foundation_models", industry: "Photonic AI Chips", founded: 2017, productLaunch: new Date('2023-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Photonic AI accelerators" },
  { name: "Lambda", valuation: 3, category: "foundation_models", industry: "AI Cloud", founded: 2012, productLaunch: new Date('2020-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "GPU cloud for AI" },
  { name: "Celestial AI", valuation: 3, category: "foundation_models", industry: "Photonic AI", founded: 2020, productLaunch: new Date('2023-06-01'), displacementType: "infrastructure", operationalStatus: 0.8, enterpriseLevel: "enterprise", notes: "Photonic fabric for AI" },
  { name: "Together AI", valuation: 3.3, category: "foundation_models", industry: "AI Cloud", founded: 2022, productLaunch: new Date('2023-06-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Open source AI cloud" },
  { name: "Vultr", valuation: 4, category: "foundation_models", industry: "AI Cloud", founded: 2014, productLaunch: new Date('2021-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Cloud computing for AI" },
  { name: "Crusoe Energy Systems", valuation: 10, category: "foundation_models", industry: "AI Infrastructure", founded: 2018, productLaunch: new Date('2021-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Clean energy AI compute" },
  { name: "SandboxAQ", valuation: 6, category: "foundation_models", industry: "AI/Quantum", founded: 2016, productLaunch: new Date('2022-03-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI and quantum computing" },
  { name: "Modular", valuation: 2, category: "coding", industry: "AI Infrastructure", founded: 2022, productLaunch: new Date('2024-05-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "prosumer", notes: "Mojo programming language" },
  { name: "Anyscale", valuation: 1, category: "coding", industry: "AI Infrastructure", founded: 2019, productLaunch: new Date('2021-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Ray distributed computing" },
  { name: "Fireworks AI", valuation: 4, category: "foundation_models", industry: "AI Inference", founded: 2022, productLaunch: new Date('2023-07-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Fast AI inference" },
  { name: "Baseten", valuation: 2.15, category: "coding", industry: "AI Infrastructure", founded: 2019, productLaunch: new Date('2022-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "ML model deployment" },
  { name: "Redpanda Data", valuation: 1, category: "analytics", industry: "Data Streaming", founded: 2019, productLaunch: new Date('2021-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Kafka-compatible streaming" },
  { name: "Kong", valuation: 2, category: "coding", industry: "API Platform", founded: 2017, productLaunch: new Date('2020-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "API gateway with AI" },
  { name: "DataDirect Networks", valuation: 5, category: "analytics", industry: "AI Storage", founded: 1998, productLaunch: new Date('2019-01-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI data storage" },
  
  // HR & Recruiting AI
  { name: "Mercor", valuation: 10, category: "administrative", industry: "AI Recruiting", founded: 2023, productLaunch: new Date('2024-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI-powered recruiting platform" },
  { name: "Eightfold AI", valuation: 2, category: "administrative", industry: "AI Talent Platform", founded: 2016, productLaunch: new Date('2019-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI talent intelligence" },
  { name: "Turing", valuation: 2.2, category: "administrative", industry: "AI Talent Platform", founded: 2018, productLaunch: new Date('2020-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI developer matching" },
  { name: "BetterUp", valuation: 5, category: "administrative", industry: "AI Coaching", founded: 2013, productLaunch: new Date('2020-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI-powered coaching" },
  { name: "Checkr", valuation: 5, category: "administrative", industry: "AI Background Check", founded: 2014, productLaunch: new Date('2018-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI background screening" },
  { name: "SeekOut", valuation: 1.2, category: "administrative", industry: "AI Recruiting", founded: 2016, productLaunch: new Date('2019-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI talent search" },
  
  // Defense AI
  { name: "Anduril Industries", valuation: 31, category: "autonomous", industry: "AI Defense", founded: 2017, productLaunch: new Date('2019-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Defense AI and autonomous systems" },
  { name: "Shield AI", valuation: 5.3, category: "autonomous", industry: "AI Defense", founded: 2015, productLaunch: new Date('2019-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Autonomous defense systems" },
  { name: "Saronic", valuation: 4, category: "autonomous", industry: "Autonomous Naval", founded: 2022, productLaunch: new Date('2023-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Autonomous naval vessels" },
  { name: "Rebellion Defense", valuation: 1.15, category: "autonomous", industry: "AI Defense", founded: 2019, productLaunch: new Date('2021-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI defense software" },
  { name: "Govini", valuation: 1, category: "analytics", industry: "AI Defense Analytics", founded: 2011, productLaunch: new Date('2020-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Defense decision analytics" },
  
  // Enterprise AI (additional)
  { name: "Superhuman (Grammarly)", valuation: 13, category: "creative", industry: "AI Writing", founded: 2009, productLaunch: new Date('2019-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "prosumer", notes: "AI writing assistant" },
  { name: "Tricentis", valuation: 5, category: "coding", industry: "AI Testing", founded: 2007, productLaunch: new Date('2018-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI software testing" },
  { name: "OutSystems", valuation: 4.3, category: "coding", industry: "Low-Code AI", founded: 2001, productLaunch: new Date('2019-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Low-code platform with AI" },
  { name: "Vanta", valuation: 4.15, category: "administrative", industry: "AI Compliance", founded: 2018, productLaunch: new Date('2020-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI security compliance" },
  { name: "o9 Solutions", valuation: 4, category: "analytics", industry: "AI Supply Chain", founded: 2009, productLaunch: new Date('2018-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI supply chain planning" },
  { name: "Icertis", valuation: 5, category: "administrative", industry: "AI Contract Management", founded: 2009, productLaunch: new Date('2020-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI contract management" },
  { name: "Sisense", valuation: 1.1, category: "analytics", industry: "AI Analytics", founded: 2004, productLaunch: new Date('2018-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Embedded analytics" },
  { name: "Interos", valuation: 1, category: "analytics", industry: "AI Supply Chain", founded: 2005, productLaunch: new Date('2020-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Supply chain risk management" },
  { name: "Amperity", valuation: 1, category: "sales_marketing", industry: "AI Customer Data", founded: 2016, productLaunch: new Date('2019-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Customer data platform" },
  { name: "Augury", valuation: 1, category: "analytics", industry: "AI Industrial IoT", founded: 2011, productLaunch: new Date('2019-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Machine health monitoring" },
  { name: "Motive", valuation: 3, category: "autonomous", industry: "AI Fleet Management", founded: 2013, productLaunch: new Date('2019-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Fleet and driver management" },
  { name: "MaintainX", valuation: 3, category: "administrative", industry: "AI Maintenance", founded: 2018, productLaunch: new Date('2021-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI maintenance management" },
  { name: "GrubMarket", valuation: 4, category: "analytics", industry: "AI Food Supply", founded: 2014, productLaunch: new Date('2020-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI food supply chain" },
  { name: "Tekion", valuation: 4, category: "analytics", industry: "AI Automotive Retail", founded: 2016, productLaunch: new Date('2020-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI automotive dealership" },
  { name: "EliseAI", valuation: 2.2, category: "customer_service", industry: "AI Real Estate", founded: 2017, productLaunch: new Date('2021-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI leasing assistant" },
  { name: "Liquid AI", valuation: 2, category: "foundation_models", industry: "AI Research", founded: 2023, productLaunch: new Date('2024-08-01'), displacementType: "infrastructure", operationalStatus: 0.7, enterpriseLevel: "enterprise", notes: "Liquid neural networks" },
  { name: "World Labs", valuation: 1, category: "foundation_models", industry: "AI 3D/Spatial", founded: 2024, productLaunch: new Date('2025-01-01'), displacementType: "infrastructure", operationalStatus: 0.3, enterpriseLevel: "enterprise", notes: "Spatial AI - early stage" },
  { name: "Distyl AI", valuation: 2, category: "administrative", industry: "AI Enterprise", founded: 2022, productLaunch: new Date('2024-06-01'), displacementType: "direct", operationalStatus: 0.7, enterpriseLevel: "enterprise", notes: "Enterprise AI agents" },
  { name: "Invisible Technologies", valuation: 2, category: "administrative", industry: "AI Operations", founded: 2015, productLaunch: new Date('2020-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI operations platform" },
  { name: "Redesign Health", valuation: 2, category: "healthcare", industry: "AI Health Ventures", founded: 2018, productLaunch: new Date('2020-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Healthcare company builder" },
  { name: "Mashgin", valuation: 2, category: "autonomous", industry: "AI Checkout", founded: 2014, productLaunch: new Date('2020-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI self-checkout" },
  { name: "Zeta", valuation: 2, category: "sales_marketing", industry: "AI Marketing", founded: 2015, productLaunch: new Date('2019-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI marketing cloud" },
  { name: "Morning Consult", valuation: 1, category: "analytics", industry: "AI Research", founded: 2014, productLaunch: new Date('2020-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI-powered polling" },
  { name: "DriveWealth", valuation: 3, category: "analytics", industry: "AI Fintech", founded: 2012, productLaunch: new Date('2019-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI trading infrastructure" },
  { name: "Vise", valuation: 1, category: "analytics", industry: "AI Wealth Management", founded: 2016, productLaunch: new Date('2020-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI portfolio management" },
  { name: "Scribe", valuation: 1.3, category: "administrative", industry: "AI Documentation", founded: 2019, productLaunch: new Date('2022-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "prosumer", notes: "AI process documentation" },
  { name: "Speak", valuation: 1, category: "creative", industry: "AI Language Learning", founded: 2017, productLaunch: new Date('2021-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "consumer", notes: "AI language tutor" },
  { name: "Gecko Robotics", valuation: 1.25, category: "autonomous", industry: "AI Inspection", founded: 2013, productLaunch: new Date('2020-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Robot industrial inspection" },
  { name: "Ayar Labs", valuation: 1, category: "foundation_models", industry: "AI Optical", founded: 2015, productLaunch: new Date('2023-01-01'), displacementType: "infrastructure", operationalStatus: 0.8, enterpriseLevel: "enterprise", notes: "Optical I/O for AI chips" },
  { name: "Eve", valuation: 1, category: "analytics", industry: "AI Process Mining", founded: 2020, productLaunch: new Date('2023-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Process intelligence" },
  { name: "Vantaca", valuation: 1, category: "administrative", industry: "AI Property Management", founded: 2016, productLaunch: new Date('2021-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "HOA management platform" },
  { name: "FourKites", valuation: 1, category: "analytics", industry: "AI Supply Chain", founded: 2014, productLaunch: new Date('2019-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Supply chain visibility" },
  { name: "KoBold Metals", valuation: 3, category: "analytics", industry: "AI Mining", founded: 2018, productLaunch: new Date('2021-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI mineral exploration" },
  { name: "Lendbuzz", valuation: 1, category: "analytics", industry: "AI Lending", founded: 2015, productLaunch: new Date('2019-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI auto lending" },
  { name: "Metropolis", valuation: 5, category: "autonomous", industry: "AI Parking", founded: 2017, productLaunch: new Date('2020-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI parking technology" },
  { name: "Opentrons", valuation: 2, category: "autonomous", industry: "Lab Robotics", founded: 2014, productLaunch: new Date('2019-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Lab automation robots" },
  { name: "Standard Cognition", valuation: 1, category: "autonomous", industry: "AI Retail Checkout", founded: 2017, productLaunch: new Date('2020-01-01'), displacementType: "direct", operationalStatus: 0.6, enterpriseLevel: "enterprise", notes: "Autonomous checkout" },
  { name: "Tractable", valuation: 1, category: "analytics", industry: "AI Insurance", founded: 2014, productLaunch: new Date('2019-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI claims assessment" },
  { name: "Decart", valuation: 3.21, category: "foundation_models", industry: "AI Simulation", founded: 2023, productLaunch: new Date('2024-10-01'), displacementType: "infrastructure", operationalStatus: 0.5, enterpriseLevel: "enterprise", notes: "World model AI" },
  { name: "Reflection.Ai", valuation: 8, category: "foundation_models", industry: "AI Agents", founded: 2024, productLaunch: new Date('2024-09-01'), displacementType: "direct", operationalStatus: 0.6, enterpriseLevel: "enterprise", notes: "AI agent platform" },
  { name: "Genspark AI", valuation: 1.25, category: "foundation_models", industry: "AI Search", founded: 2022, productLaunch: new Date('2024-06-01'), displacementType: "direct", operationalStatus: 0.8, enterpriseLevel: "prosumer", notes: "AI search engine" },
  { name: "Periodic Labs", valuation: 1, category: "analytics", industry: "AI Materials", founded: 2025, productLaunch: null, displacementType: "infrastructure", operationalStatus: 0.0, enterpriseLevel: "enterprise", notes: "AI materials discovery - no product yet" },
  
  // Sales & Marketing (additional)
  { name: "Pendo", valuation: 3, category: "sales_marketing", industry: "AI Product Analytics", founded: 2013, productLaunch: new Date('2020-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Product experience platform" },
  { name: "Iterable", valuation: 2, category: "sales_marketing", industry: "AI Marketing", founded: 2013, productLaunch: new Date('2019-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI marketing automation" },
  { name: "Bluecore", valuation: 1, category: "sales_marketing", industry: "AI Retail Marketing", founded: 2013, productLaunch: new Date('2018-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI retail personalization" },
  { name: "People.ai", valuation: 1.1, category: "sales_marketing", industry: "AI Sales", founded: 2016, productLaunch: new Date('2018-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Revenue intelligence" },
  
  // Coding tools (additional)
  { name: "LangChain", valuation: 1.1, category: "coding", industry: "AI Framework", founded: 2022, productLaunch: new Date('2022-10-01'), displacementType: "infrastructure", operationalStatus: 1.0, enterpriseLevel: "prosumer", notes: "LLM application framework" },
  { name: "Miro", valuation: 18, category: "creative", industry: "AI Collaboration", founded: 2011, productLaunch: new Date('2023-06-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Visual collaboration with AI" },
  
  // Creative AI (additional)
  { name: "Verbit", valuation: 2, category: "creative", industry: "AI Transcription", founded: 2017, productLaunch: new Date('2019-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI transcription service" },
  { name: "Hive", valuation: 2, category: "creative", industry: "AI Content Moderation", founded: 2013, productLaunch: new Date('2020-01-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "AI content moderation" },
  { name: "Typeface", valuation: 1, category: "creative", industry: "AI Content Generation", founded: 2022, productLaunch: new Date('2023-02-01'), displacementType: "direct", operationalStatus: 1.0, enterpriseLevel: "enterprise", notes: "Enterprise AI content" },
  { name: "Lucid Software", valuation: 3, category: "creative", industry: "AI Design Tools", founded: 2010, productLaunch: new Date('2022-01-01'), displacementType: "augmentation", operationalStatus: 1.0, enterpriseLevel: "prosumer", notes: "Visual collaboration platform" },
];

// ============================================================================
// DISPLACEMENT CALCULATION ENGINE v2
// ============================================================================

// Type multipliers
const DISPLACEMENT_TYPE_MULT = {
  direct: 1.0,        // Directly replaces workers
  augmentation: 0.4,  // Makes workers more productive
  infrastructure: 0.25 // Enables others to build AI
};

// Enterprise level multipliers
const ENTERPRISE_MULT = {
  enterprise: 1.0,    // Enterprise sales = large deployments
  prosumer: 0.6,      // Individual professionals
  consumer: 0.15      // Consumer apps = minimal job impact
};

function calculateDeploymentMaturity(company) {
  // No product = no displacement
  if (!company.productLaunch) {
    return 0;
  }
  
  const productLaunch = new Date(company.productLaunch);
  
  // Product launched after current date = no displacement yet
  if (productLaunch > CURRENT_DATE) {
    return 0;
  }
  
  // Months since launch
  const monthsSinceLaunch = Math.floor((CURRENT_DATE - productLaunch) / (1000 * 60 * 60 * 24 * 30));
  
  // If launched before AI era, only count from AI era (Nov 2022)
  // because pre-ChatGPT AI had much lower adoption
  const effectiveMonths = productLaunch < AI_ERA_START 
    ? Math.min(monthsSinceLaunch, MONTHS_SINCE_AI_ERA)
    : monthsSinceLaunch;
  
  // Adoption curve: 6 months to ramp, peaks at 24 months
  // 0-6 months: 0.2 to 0.5
  // 6-12 months: 0.5 to 0.75
  // 12-24 months: 0.75 to 1.0
  // 24+ months: 1.0
  
  if (effectiveMonths <= 6) {
    return 0.2 + (effectiveMonths / 6) * 0.3;
  } else if (effectiveMonths <= 12) {
    return 0.5 + ((effectiveMonths - 6) / 6) * 0.25;
  } else if (effectiveMonths <= 24) {
    return 0.75 + ((effectiveMonths - 12) / 12) * 0.25;
  } else {
    return 1.0;
  }
}

function calculateDisplacementScores(companies, totalDisplacement) {
  // Step 1: Group companies by category
  const byCategory = {};
  for (const cat of Object.keys(DISPLACEMENT_CATEGORIES)) {
    byCategory[cat] = companies.filter(c => c.category === cat);
  }
  
  // Step 2: Calculate raw scores for each company
  const scored = companies.map(company => {
    const category = DISPLACEMENT_CATEGORIES[company.category];
    if (!category) {
      console.warn(`Unknown category: ${company.category} for ${company.name}`);
      return null;
    }
    
    // Factor 1: Category allocation (what % of total displacement this category represents)
    const categoryAllocation = category.allocation;
    
    // Factor 2: Market share within category (based on valuation, log-scaled)
    const categoryCompanies = byCategory[company.category];
    const categoryTotalVal = categoryCompanies.reduce((sum, c) => sum + Math.log10(c.valuation + 1), 0);
    const companyVal = Math.log10(company.valuation + 1);
    const marketShare = categoryTotalVal > 0 ? companyVal / categoryTotalVal : 0;
    
    // Factor 3: Deployment maturity (based on product launch and time)
    const deploymentMaturity = calculateDeploymentMaturity(company);
    
    // Factor 4: Displacement type (direct, augmentation, infrastructure)
    const displacementTypeMult = DISPLACEMENT_TYPE_MULT[company.displacementType] || 0.5;
    
    // Factor 5: Operational status (is company fully operational?)
    const operationalFactor = company.operationalStatus || 1.0;
    
    // Factor 6: Enterprise level (enterprise vs consumer)
    const enterpriseFactor = ENTERPRISE_MULT[company.enterpriseLevel] || 0.6;
    
    // Raw score = all factors multiplied
    const rawScore = 
      categoryAllocation 
      * marketShare 
      * deploymentMaturity 
      * displacementTypeMult 
      * operationalFactor 
      * enterpriseFactor;
    
    return {
      ...company,
      factors: {
        categoryAllocation,
        marketShare,
        deploymentMaturity,
        displacementTypeMult,
        operationalFactor,
        enterpriseFactor
      },
      rawScore
    };
  }).filter(Boolean);
  
  // Step 3: Normalize so all scores sum to totalDisplacement
  const totalRaw = scored.reduce((sum, c) => sum + c.rawScore, 0);
  
  const normalized = scored.map(company => {
    const percentage = totalRaw > 0 ? company.rawScore / totalRaw : 0;
    const displacement = Math.round(totalDisplacement * percentage);
    
    return {
      name: company.name,
      industry: company.industry,
      category: company.category,
      valuation: company.valuation,
      displacement,
      percentage: (percentage * 100).toFixed(2),
      factors: {
        category: (company.factors.categoryAllocation * 100).toFixed(0) + '% pool',
        marketShare: (company.factors.marketShare * 100).toFixed(1) + '%',
        maturity: (company.factors.deploymentMaturity * 100).toFixed(0) + '%',
        type: company.displacementType,
        operational: (company.factors.operationalFactor * 100).toFixed(0) + '%',
        market: company.enterpriseLevel
      },
      rawFactors: company.factors,
      notes: company.notes
    };
  });
  
  // Step 4: Sort by displacement (highest first)
  normalized.sort((a, b) => b.displacement - a.displacement);
  
  // Step 5: Add rank
  return normalized.map((company, index) => ({
    rank: index + 1,
    ...company
  }));
}

// Verify total adds up
function verifyTotal(results, expectedTotal) {
  const actualTotal = results.reduce((sum, c) => sum + c.displacement, 0);
  const diff = Math.abs(actualTotal - expectedTotal);
  console.log(`Total verification: Expected ${expectedTotal.toLocaleString()}, Got ${actualTotal.toLocaleString()} (diff: ${diff})`);
  return diff < 100;
}

// Export
window.AI_COMPANIES = US_AI_COMPANIES;
window.DISPLACEMENT_CATEGORIES = DISPLACEMENT_CATEGORIES;
window.calculateDisplacementScores = calculateDisplacementScores;
window.verifyTotal = verifyTotal;
