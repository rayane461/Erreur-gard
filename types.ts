
export enum ThreatLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ScanMode {
  TURBO = 'TURBO',
  STANDARD = 'STANDARD',
  SUPER_PRO = 'SUPER_PRO'
}

export interface SecurityIssue {
  id: string;
  type: 'CIPHER' | 'BACKDOOR' | 'BLUM_PANEL' | 'SUSPICIOUS_HTTP' | 'OBFUSCATION' | 'SLEEPER_THREAT';
  description: string;
  line: number;
  codeSnippet: string;
  threatLevel: ThreatLevel;
  suggestion: string;
}

export interface AnalysisResult {
  fileName: string;
  content: string;
  cleanedContent: string;
  issues: SecurityIssue[];
  isSafe: boolean;
  score: number;
  mode: ScanMode;
  aiExplanation?: string;
}

export interface FileData {
  name: string;
  content: string;
  size: number;
}
