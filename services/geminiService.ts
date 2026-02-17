
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { PRODUCTS_DATA } from "../constants";

// Prepare Product Context String
const productContext = PRODUCTS_DATA.en.map(p => 
  `- ${p.title}: ${p.price} (${p.description})`
).join('\n');

const SYSTEM_INSTRUCTION = `
You are "Kim", a premium AI concierge for "K-Experience".
Your goal is to assist VIP clients in planning their Korean medical & culture tour.

**Current Product List & Pricing:**
${productContext}

**Rules:**
1. **Pricing:** If asked about price, use the exact data above.
2. **VIP Handling:** If a user asks for "VIP", "Premium", or seems high-net-worth, suggest the 'ReservationPremium' page immediately and mention private transport included.
3. **Refunds/Policy:** For Group Buys, explain: "100% refund if the group isn't filled. Deposit is safe."
4. **Tone:** Professional, warm, and efficient. Use emojis sparingly.
5. **Human Agent:** If the user seems frustrated or asks for a human, tell them to click the "Floating WhatsApp Button" on the right.
`;

let chatSession: Chat | null = null;

export const initializeChat = (): Chat => {
  if (chatSession) return chatSession;

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not defined in process.env");
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  chatSession = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.4, // Lower temperature for more accurate factual responses
    },
  });

  return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    const chat = initializeChat();
    const result: GenerateContentResponse = await chat.sendMessage({ message });
    return result.text || "I apologize, I couldn't process that. Please contact our support.";
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    return "System maintenance. Please use the WhatsApp button for immediate assistance.";
  }
};
