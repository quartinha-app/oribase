
import { GoogleGenAI } from "@google/genai";

// Use a safe initialization pattern
const apiKey = process.env.API_KEY || 'dummy_key_for_build';

// Only clean up the crash, request actual calls to check for validity later
const ai = new GoogleGenAI({ apiKey });

export const getDiagnosticInsights = async (profile: string, data: any) => {
  try {
    if (apiKey === 'dummy_key_for_build') {
      console.warn('Gemini API Key is missing. Skipping AI generation.');
      return "Insight automático indisponível (Chave API não configurada).";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Com base nos dados de um diagnóstico de terreiro de perfil ${profile}: ${JSON.stringify(data)}, forneça 3 dicas práticas de gestão e fortalecimento institucional em português.`,
      config: {
        systemInstruction: "Você é um especialista em patrimônio cultural afro-brasileiro e gestão de organizações sem fins lucrativos.",
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Não foi possível gerar insights automáticos no momento. Por favor, revise os dados manualmente.";
  }
};
