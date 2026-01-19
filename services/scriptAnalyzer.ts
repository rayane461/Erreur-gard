
import { AnalysisResult, SecurityIssue, ThreatLevel, ScanMode } from '../types';
import { deepCleanCode, auditScriptWithAI } from './geminiService';

const THREAT_PATTERNS = [
  // Ciphers & Obfuscation
  { regex: /\\x[0-9a-fA-F]{2}/g, type: 'CIPHER' as const, description: 'Hex-Encoded Payload (Cipher).', threatLevel: ThreatLevel.CRITICAL },
  { regex: /\\[0-9]{3}/g, type: 'CIPHER' as const, description: 'ASCII Decimal Obfuscation.', threatLevel: ThreatLevel.CRITICAL },
  { regex: /string\.char\s*\(\s*[0-9,\s]+\s*\)/gi, type: 'CIPHER' as const, description: 'Character Array Reconstruction.', threatLevel: ThreatLevel.HIGH },
  
  // Backdoors & Remote Execution
  { regex: /PerformHttpRequest\s*\(\s*["'](https?:\/\/[^"']+)["']/gi, type: 'BACKDOOR' as const, description: 'External Data Exfiltration.', threatLevel: ThreatLevel.HIGH },
  { regex: /load\s*\(\s*(?:string\.reverse|base64|["']|\\)/gi, type: 'BACKDOOR' as const, description: 'Unsafe Dynamic Execution.', threatLevel: ThreatLevel.CRITICAL },
  { regex: /assert\s*\(\s*load\s*\(/gi, type: 'BACKDOOR' as const, description: 'Asserted Code Injection.', threatLevel: ThreatLevel.CRITICAL },
  
  // Malicious Panels (Blum, Enigma, etc.)
  { regex: /blum.*panel|enigma.*panel|cipher.*check|anti.*cheat.*bypass|admin.*menu.*secret/gi, type: 'BLUM_PANEL' as const, description: 'Malicious Framework Signature.', threatLevel: ThreatLevel.CRITICAL },
  { regex: /["']\s*(?:[A-Za-z0-9+/]{40,})\s*["']/g, type: 'OBFUSCATION' as const, description: 'Large Base64/Encrypted String.', threatLevel: ThreatLevel.HIGH },
  
  // Super Pro - Sleeper Logic & Environment Hijacking
  { regex: /_G\[['"][\w\d]+['"]\]\s*=\s*(?:load|PerformHttpRequest|assert|setmetatable)/gi, type: 'OBFUSCATION' as const, description: 'Global Table Hijacking.', threatLevel: ThreatLevel.HIGH },
  { regex: /debug\.getregistry/gi, type: 'SLEEPER_THREAT' as const, description: 'LUA Registry Access (Forensic Red Flag).', threatLevel: ThreatLevel.CRITICAL },
  { regex: /os\.(?:execute|remove|rename|exit|getenv)/gi, type: 'BACKDOOR' as const, description: 'System API Intrusion.', threatLevel: ThreatLevel.CRITICAL }
];

export const analyzeScript = async (fileName: string, content: string, mode: ScanMode = ScanMode.STANDARD): Promise<AnalysisResult> => {
  const issues: SecurityIssue[] = [];
  let cleanedContent = content;
  
  // 1. Parallel Hardware Heuristics
  THREAT_PATTERNS.forEach((pattern) => {
    let match;
    pattern.regex.lastIndex = 0;
    while ((match = pattern.regex.exec(content)) !== null) {
      issues.push({
        id: 'H-' + Math.random().toString(36).substring(2, 9),
        type: pattern.type,
        description: pattern.description,
        line: content.substring(0, match.index).split('\n').length,
        codeSnippet: match[0],
        threatLevel: pattern.threatLevel,
        suggestion: 'Matched known malicious signature in forensic DB.'
      });
    }
  });

  // 2. High-Speed AI Forensic Layer
  let aiExplanation = "";
  try {
    const aiAudit = await auditScriptWithAI(fileName, content, mode);
    aiExplanation = aiAudit.summary;

    if (aiAudit?.concerns) {
      aiAudit.concerns.forEach((concern: any) => {
        // Prevent duplicates
        if (!issues.some(i => i.codeSnippet === concern.snippet)) {
          issues.push({
            id: 'AI-' + Math.random().toString(36).substring(2, 9),
            type: concern.type?.toUpperCase() as any || 'BACKDOOR',
            description: `[AI FORWARD] ${concern.description}`,
            line: 0,
            codeSnippet: concern.snippet,
            threatLevel: concern.threatLevel as ThreatLevel || ThreatLevel.HIGH,
            suggestion: `AI Forensic Insight.`
          });
        }
      });
    }
  } catch (err) {
    aiExplanation = "AI analysis skipped for high-velocity scan.";
  }

  // 3. Neural Content Reconstruction
  const criticalIssues = issues.filter(i => i.threatLevel === ThreatLevel.CRITICAL);
  if (criticalIssues.length > 0) {
    try {
      const summary = criticalIssues.slice(0, 5).map(i => i.description).join(', ');
      cleanedContent = await deepCleanCode(fileName, content, summary, mode);
    } catch (err) {
      cleanedContent = `-- [CLEANING BYPASS] --\n${content}`;
    }
  }

  const score = Math.max(0, 100 - (issues.length * 15));

  return {
    fileName,
    content,
    cleanedContent,
    issues: issues.sort((a, b) => b.threatLevel === ThreatLevel.CRITICAL ? 1 : -1),
    isSafe: issues.length === 0,
    score,
    mode,
    aiExplanation
  };
};
