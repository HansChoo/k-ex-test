import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are "Kim", a friendly and knowledgeable AI concierge for "K-Experience", a premium Korean travel agency. 
Your goal is to help users find tours, plan their trip to Korea, and understand Korean culture.
- Keep answers concise, friendly, and enthusiastic.
- Use emojis occasionally.
- Suggest specific tours if the user asks about activities (mention Palace tours, K-Pop classes, Food tours).
- If asked about pricing, give general estimates based on standard travel rates in Korea (e.g., $10 for a meal, $50-$100 for day tours).
- Do not make up fake booking links; tell them to click the "Book Now" buttons on the site.
`;

let chatSession: Chat | null = null;

export const initializeChat = (): Chat => {
  if (chatSession) return chatSession;

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not defined in process.env");
    // Fallback for development if needed, or handle error gracefully in UI
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Using gemini-3-flash-preview for fast, responsive chat
  chatSession = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    const chat = initializeChat();
    const result: GenerateContentResponse = await chat.sendMessage({ message });
    return result.text || "I'm sorry, I couldn't process that. Could you try asking again?";
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    return "I'm having trouble connecting to the server right now. Please try again later.";
  }
};