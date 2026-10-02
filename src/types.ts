export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Insane';

export interface OpenPort {
  port: number;
  service: string;
  version: string;
  purpose: string;
}

export interface TopologyNode {
  id: string;
  label: string;
  type: 'attacker' | 'gateway' | 'target' | 'internal';
  role: string;
}

export interface TopologyLink {
  from: string;
  to: string;
  proto: string;
  desc: string;
}

export interface ScenarioTopology {
  nodes: TopologyNode[];
  links: TopologyLink[];
}

export interface GradualHint {
  id: string;
  level: 1 | 2 | 3; // 1: Empujón conceptual (sutil), 2: Pista táctica (herramienta/área), 3: Vector dirigido (técnica exacta)
  title: string;
  category: 'recon' | 'foothold' | 'privesc';
  text: string;
}

export interface MitreTechnique {
  id: string; // e.g. "T1190"
  name: string; // e.g. "Exploit Public-Facing Application"
  tactic: string; // e.g. "Initial Access"
  tacticId: string; // e.g. "TA0001"
  url: string; // e.g. "https://attack.mitre.org/techniques/T1190/"
  description: string;
}

export interface OwaspCategory {
  code: string; // e.g. "A03:2021"
  name: string; // e.g. "Injection"
  url: string; // e.g. "https://owasp.org/Top10/A03_2021-Injection/"
  description: string;
}

export interface CweMapping {
  id: string; // e.g. "CWE-94"
  name: string; // e.g. "Improper Control of Generation of Code ('Code Injection')"
  url: string;
}

export interface SecurityFrameworks {
  mitre: MitreTechnique[];
  owasp: OwaspCategory[];
  cwe?: CweMapping[];
}

export type CVSSSeverity = 'None' | 'Low' | 'Medium' | 'High' | 'Critical';

export interface CVSSVector {
  av: 'N' | 'A' | 'L' | 'P'; // Attack Vector: Network, Adjacent, Local, Physical
  ac: 'L' | 'H'; // Attack Complexity: Low, High
  pr: 'N' | 'L' | 'H'; // Privileges Required: None, Low, High
  ui: 'N' | 'R'; // User Interaction: None, Required
  s: 'U' | 'C'; // Scope: Unchanged, Changed
  c: 'N' | 'L' | 'H'; // Confidentiality: None, Low, High
  i: 'N' | 'L' | 'H'; // Integrity: None, Low, High
  a: 'N' | 'L' | 'H'; // Availability: None, Low, High
}

export interface CVSSScoreResult {
  score: number;
  severity: CVSSSeverity;
  vectorString: string;
  exploitability: number;
  impact: number;
}

export interface CTFScenario {
  codename: string;
  themeName: string;
  genre?: 'scifi' | 'fantasy' | 'horror' | 'cyberpunk' | 'tv_series' | 'custom';
  difficulty: DifficultyLevel;
  vector: string;
  secondaryVector: string;
  targetOS: string;
  ip: string;
  story: string;
  userFlag: string;
  rootFlag: string;
  userFlagPath: string;
  rootFlagPath: string;
  openPorts: OpenPort[];
  topology: ScenarioTopology;
  provisionScript: string;
  dockerfile: string;
  dockerCompose: string;
  pythonScript: string;
  walkthrough: string;
  hints: GradualHint[];
  machineArtUrl?: string;
  frameworks?: SecurityFrameworks;
  cvss?: Partial<CVSSVector>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export type ChatRole = 'mentor' | 'provisioner' | 'auditor' | 'hint_crafter';

export type GeminiChatModel = 'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite';
