
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const getSystemInstruction = (productContext: string) => `
You are "Kim", a premium AI concierge for "K-Experience".
Your goal is to assist VIP clients in planning their Korean medical & culture tour.

**IMPORTANT: Current Product List & Pricing (Live Data from Firestore):**
${productContext}

**Rules:**
1. **Pricing:** You must provide the exact pricing from the list above. If a product has separate male/female pricing, clearly state both.
2. **VIP Handling:** If a user asks for "VIP", "Premium", or high-end services, suggest the 'ReservationPremium' page and mention private transport.
3. **Refunds/Policy:** For Group Buys, explain: "100% refund if the group isn't filled. Your deposit is safe."
4. **Tone:** Professional, warm, and highly efficient. Use emojis sparingly.
5. **Languages:** You are fluent in English, Korean, Japanese, and Chinese. Respond in the same language as the user.
6. **Unknown Info:** If the user asks about a service NOT in the list above, kindly explain that you are still updating that service and suggest contacting human support.
`;

let chatSession: Chat | null = null;
let lastContext = "";

export const sendMessageToGemini = async (message: string, products: any[], packages: any[]): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    // Create a dynamic product context string from current live Firestore data
    const productContext = [
        ...packages.map(p => `- [Package] ${p.title}: Male ₩${(p.priceMale || 0).toLocaleString()} / Female ₩${(p.priceFemale || 0).toLocaleString()} (${p.description})`),
        ...products.map(p => `- [Product] ${p.title}: Male ₩${(p.priceMale || 0).toLocaleString()} / Female ₩${(p.priceFemale || 0).toLocaleString()} (Category: ${p.category})`)
    ].join('\n');

    // Re-initialize if context changed significantly
    if (!chatSession || lastContext !== productContext) {
        const ai = new GoogleGenAI({ apiKey });
        chatSession = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: getSystemInstruction(productContext),
                temperature: 0.3, // Lower temperature for more factual pricing answers
            },
        });
        lastContext = productContext;
    }

    const result: GenerateContentResponse = await chatSession.sendMessage({ message });
    return result.text || "I apologize, I couldn't process that. Please contact our support for immediate assistance.";
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    return "System maintenance. Please use the WhatsApp button on the right for immediate assistance.";
  }
};
