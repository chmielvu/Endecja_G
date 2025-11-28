import { GoogleGenAI } from "@google/genai";
import { Node, Edge, ChatMessage } from "../types";
import { SYSTEM_PROMPT_DMOWSKI } from "../constants";

// Ideally, this key comes from a secure backend or user input in a settings modal.
// For this demo, we assume it's available in env.
const API_KEY = process.env.API_KEY || ''; 

// We handle the case where the key is missing gracefully in the UI.

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: API_KEY });
    }
  }

  isConfigured(): boolean {
    return !!this.ai;
  }

  async chatWithDmowski(history: ChatMessage[], newMessage: string): Promise<string> {
    if (!this.ai) throw new Error("API Key not configured");

    const model = 'gemini-2.5-flash';
    
    // Convert history to Gemini format if needed, or just send last few messages for context window management
    // For simple stateless/low-state calls we can use generateContent with system instruction
    // But keeping chat state is better.
    
    // We will construct a prompt with history for the stateless call or use chats.create if persistent
    // Let's use `generateContent` with the full context for simplicity and control.
    
    const context = history.map(h => `${h.role === 'user' ? 'Interlokutor' : 'Roman Dmowski'}: ${h.content}`).join('\n');
    const fullPrompt = `${SYSTEM_PROMPT_DMOWSKI}\n\nHistoria rozmowy:\n${context}\n\nInterlokutor: ${newMessage}\nRoman Dmowski:`;

    const response = await this.ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    return response.text || "...";
  }

  async analyzeGraphAndExpand(
    currentNodes: Node[], 
    currentEdges: Edge[], 
    additionalContext: string
  ): Promise<{ nodes: any[], edges: any[] }> {
    if (!this.ai) throw new Error("API Key not configured");

    const model = 'gemini-3-pro-preview';
    
    const graphContext = JSON.stringify({
      nodes: (currentNodes || []).map(n => ({ id: n.id, label: n.label, description: n.description })),
      edges: (currentEdges || []).map(e => ({ 
        source: typeof e.source === 'object' ? e.source.id : e.source, 
        target: typeof e.target === 'object' ? e.target.id : e.target,
        label: e.label 
      }))
    });

    const prompt = `
      Analyse the attached Endecja knowledge graph and any uploaded texts.
      Context from files: ${additionalContext}
      
      Suggest 5-12 historically accurate new nodes and edges (1918-1939 period) that are missing or would enrich the graph.
      Focus on connections to existing nodes.
      
      Existing Graph: ${graphContext}
      
      Return ONLY valid JSON with this structure:
      {
        "nodes": [{ "id": "snake_case_id", "label": "Label", "type": "person|organization|event|concept", "description": "...", "importance": 0.5-1.0 }],
        "edges": [{ "source": "id_1", "target": "id_2", "label": "relationship" }]
      }
      Do not wrap in markdown code blocks. Just the JSON.
    `;

    // We can use thinkingBudget for complex reasoning if we want
    const response = await this.ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // @ts-ignore - thinkingConfig types might be in flux, safer to omit if not 100% sure of SDK version match, 
        // but prompt asked for it. 
        thinkingConfig: { thinkingBudget: 16000 }, 
      }
    });

    try {
      const text = response.text || "{}";
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      return {
        nodes: Array.isArray(parsed?.nodes) ? parsed.nodes : [],
        edges: Array.isArray(parsed?.edges) ? parsed.edges : []
      };
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      return { nodes: [], edges: [] };
    }
  }
}

export const geminiService = new GeminiService();