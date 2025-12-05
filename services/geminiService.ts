import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TypeSettings, FontFamily, DEFAULT_SETTINGS } from "../types";

// We only need a subset of settings to be AI controllable to avoid chaos
const generateSettingsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    fontFamily: { type: Type.STRING, enum: Object.values(FontFamily) },
    fontSize: { type: Type.NUMBER },
    letterSpacing: { type: Type.NUMBER },
    lineHeight: { type: Type.NUMBER },
    rotation: { type: Type.NUMBER },
    skewX: { type: Type.NUMBER },
    skewY: { type: Type.NUMBER },
    morphRadius: { type: Type.NUMBER },
    morphOperator: { type: Type.STRING, enum: ['dilate', 'erode'] },
    distortionX: { type: Type.NUMBER },
    distortionY: { type: Type.NUMBER },
    distortionStrength: { type: Type.NUMBER },
    noiseType: { type: Type.STRING, enum: ['turbulence', 'fractalNoise'] },
    blurStdDev: { type: Type.NUMBER },
    contrast: { type: Type.NUMBER },
    textureMode: { type: Type.STRING, enum: ['solid', 'chrome', 'glass', 'neon'] },
    numMetaballs: { type: Type.NUMBER },
    metaballSpread: { type: Type.NUMBER },
    metaballSpeed: { type: Type.NUMBER },
    fillColor: { type: Type.STRING },
    strokeColor: { type: Type.STRING },
    strokeWidth: { type: Type.NUMBER },
    showFill: { type: Type.BOOLEAN },
    showStroke: { type: Type.BOOLEAN },
    backgroundColor: { type: Type.STRING },
  },
  required: ['fontFamily', 'distortionStrength', 'blurStdDev', 'contrast'],
};

export const generateStyleFromPrompt = async (prompt: string, currentSettings: TypeSettings): Promise<Partial<TypeSettings>> => {
  if (!process.env.API_KEY) {
    console.error("API Key missing");
    return {};
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a creative coder specializing in generative typography. 
      Translate the following user description into a configuration object for an abstract type generator.
      
      The user wants: "${prompt}"

      Parameter constraints:
      - fontSize: 40 to 200
      - distortionX/Y: 0.001 (smooth) to 0.5 (chaos)
      - distortionStrength: 0 to 200
      - blurStdDev: 0 to 20
      - contrast: 1 to 50 (Higher contrast + blur creates "gooey" liquid effects)
      - textureMode: 'solid' (default), 'chrome' (metallic/shiny), 'glass' (transparent/refractive), 'neon' (glowing)
      - morphRadius: 0 to 10
      - numMetaballs: 0 to 15 (Use for "blobs", "bubbles", "floating", "lava", "goo")
      - metaballSpread: 10 (tight) to 100 (loose)
      - metaballSpeed: 0 (static) to 1 (fast flow)
      - Colors should match the vibe.

      Return ONLY the JSON object matching the schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: generateSettingsSchema,
        temperature: 0.7, // Allow some creativity
      }
    });

    const result = response.text;
    if (!result) return {};
    
    const parsed = JSON.parse(result);
    return parsed;
  } catch (error) {
    console.error("Gemini generation failed", error);
    return {};
  }
};