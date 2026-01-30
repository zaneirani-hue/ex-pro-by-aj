
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PRODUCT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'The official name of the product' },
    brand: { type: Type.STRING, description: 'The brand or manufacturer' },
    category: { type: Type.STRING, enum: ['food', 'daily', 'other'], description: 'Category of the item' },
    description: { type: Type.STRING, description: 'Brief description of the product' },
    expiryDays: { type: Type.NUMBER, description: 'Estimated typical shelf life in days from today' },
  },
  required: ['name', 'brand', 'category', 'description'],
};

export const analyzeProductImage = async (base64Image: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: `Extract product metadata from this image. Focus on barcodes or labels. 
            Identify: name, brand, category, and a short description. 
            Crucially, if it's food, estimate remaining shelf life in days. 
            Return JSON format only.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: PRODUCT_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI resonance");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};
