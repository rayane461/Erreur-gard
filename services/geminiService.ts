
import { GoogleGenAI, Type } from "@google/genai";
import { ScanMode } from "../types";

const MAX_CONTENT_CHARS = 15000;

/**
 * Utility for exponential backoff retries with faster initial response
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error?.status === 500 || error?.message?.includes('Rpc failed') || error?.status === 429)) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function auditScriptWithAI(fileName: string, content: string, mode: ScanMode) {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Select model based on requested professional level
    // Turbo and Standard use Flash for speed. Super Pro uses Pro for deep logic.
    const modelName = mode === ScanMode.SUPER_PRO ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    // Config optimization: Turbo mode disables 'thinking' to stay under 1s latency
    const config: any = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          concerns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                description: { type: Type.STRING },
                threatLevel: { type: Type.STRING },
                snippet: { type: Type.STRING }
              },
              required: ["type", "description", "threatLevel", "snippet"]
            }
          },
          summary: { type: Type.STRING }
        },
        required: ["concerns", "summary"]
      }
    };

    if (mode === ScanMode.TURBO) {
      config.thinkingConfig = { thinkingBudget: 0 };
    }

    const systemFocus = mode === ScanMode.SUPER_PRO 
      ? "Execute an ELITE forensic audit. Hunt for advanced logic-based backdoors, variable shadowing, hidden global hijacking (_G), and nested ciphers. Analyze the LUA logic flow for 'sleeper' malicious code."
      : "Scan for common FiveM ciphers, Blum panels, and unauthorized HTTP backdoors.";

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        config: config,
        contents: `[MODE: ${mode}] ${systemFocus}
        Target File: "${fileName}"
        
        Content Snippet:
        ${content.substring(0, MAX_CONTENT_CHARS)}
        `,
      });
      
      const text = response.text || '{"concerns": [], "summary": "Clear."}';
      return JSON.parse(text);
    } catch (error) {
      console.error("AI Forensic Error:", error);
      return { concerns: [], summary: "AI bypass: Heuristic engine active." };
    }
  });
}

export async function getAIExpertAnalysis(fileName: string, snippet: string): Promise<string> {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        config: { thinkingConfig: { thinkingBudget: 0 } },
        contents: `Instant Forensic Analysis: "${fileName}"
        \`\`\`lua
        ${snippet.substring(0, 2500)}
        \`\`\`
        Analyze for malicious persistence or hidden framework backdoors.`,
      });
      return response.text || "Report unavailable.";
    } catch (error) {
      return "Expert layer unreachable.";
    }
  });
}

export async function deepCleanCode(fileName: string, content: string, issuesFound: string, mode: ScanMode): Promise<string> {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `SECURITY STRIPPER [MODE: ${mode}]
        File: ${fileName}
        Report: ${issuesFound}

        PROTOCOL:
        - NUKE all ciphers and backdoors.
        - Fix corrupted LUA syntax caused by obfuscators.
        - Ensure critical logic remains. 
        - RETURN CLEAN LUA CODE ONLY. NO MARKDOWN.

        Code:
        ${content.substring(0, 20000)}
        `,
      });
      return response.text?.trim() || content;
    } catch (error) {
      return `-- [AUTO-REPAIR FAILED] --\n${content}`;
    }
  });
}
