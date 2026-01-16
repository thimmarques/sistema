
import { GoogleGenAI, Type } from "@google/genai";
import { Message } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Advanced Legal Chatbot with multi-turn history support.
 */
export const legalChat = async (history: Message[], userInput: string) => {
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));
  
  contents.push({
    role: 'user',
    parts: [{ text: userInput }]
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents,
    config: {
      systemInstruction: `Você é um Assistente Jurídico de Elite para o escritório LexAI. 
      Sua função é auxiliar advogados com pesquisas, redação de peças, e análise de processos.
      Seja profissional, técnico e conciso. Sempre mencione que as informações devem ser revisadas por um advogado humano.`
    }
  });

  return response.text;
};

/**
 * Legal Research with Search Grounding.
 */
export const researchCaseLaw = async (query: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Pesquise jurisprudência e notícias recentes sobre: ${query}. Foque no cenário jurídico brasileiro.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

/**
 * Analyzes legal emails or documents to extract case information.
 * Added to fix error in GmailAnalysis.tsx.
 */
export const analyzeCourtEmail = async (body: string, from: string, fileData?: { data: string, mimeType: string }) => {
  const parts: any[] = [{ text: `Analise este e-mail jurídico de ${from}:\n\n${body}` }];
  
  if (fileData) {
    parts.push({
      inlineData: {
        data: fileData.data,
        mimeType: fileData.mimeType,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          caseNumber: {
            type: Type.STRING,
            description: 'Número do processo formatado.',
          },
          date: {
            type: Type.STRING,
            description: 'Data do prazo ou audiência no formato YYYY-MM-DD.',
          },
          description: {
            type: Type.STRING,
            description: 'Resumo conciso da movimentação.',
          },
          movementType: {
            type: Type.STRING,
            description: 'Tipo de evento: Audiência, Prazo ou Notificação.',
          },
        },
        required: ['caseNumber', 'date', 'description', 'movementType'],
      },
    },
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response as JSON", e);
    return {};
  }
};

/**
 * Generates a legal draft based on an analysis result.
 * Added to fix error in GmailAnalysis.tsx.
 */
export const generateLegalDraft = async (analysis: any) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Com base na seguinte movimentação processual: ${JSON.stringify(analysis)}, gere uma minuta profissional de petição ou manifestação jurídica em português brasileiro.`,
    config: {
      systemInstruction: "Você é um especialista em redação jurídica brasileira. Seu tom é formal, técnico e preciso."
    }
  });

  return response.text;
};
