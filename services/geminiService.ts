
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Gemini Searchを使用して機材の詳細（画像URL、販売ページURL）を取得する
 */
export const fetchGearMetadata = async (gearName: string) => {
  const ai = getAIClient();
  // プロンプトを極限までシンプルかつ命令的に。
  const prompt = `音楽機材: "${gearName}" の正確な情報を検索してください。
  
必須項目:
1. IMAGE_URL: 背景が白く、機材全体が写っている高画質な商品画像の直リンクURL。
2. STORE_URL: 日本で購入可能な主要ストア(サウンドハウス, Amazon.co.jp) または Sweetwater の商品ページURL。

出力形式(必ずこの形式のみで出力してください):
IMAGE: [URL]
STORE: [URL]`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // 確実性を高める
      },
    });

    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("AI Search Error:", error);
    throw error;
  }
};

export const polishDescription = async (name: string, notes: string) => {
  const ai = getAIClient();
  const prompt = `以下の音楽機材のレビュー/紹介文を、プロフェッショナルで魅力的な日本語にリライトしてください。
機材名: ${name}
入力されたメモ: ${notes}

構成:
- 1文目: 機材の概要
- 2文目: 具体的な特徴やメリット
- 3文目: 総評

簡潔に、かつ情熱が伝わるトーンで作成してください。`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text;
};

export const chatWithGemini = async (message: string, history: any[] = []) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: history.length > 0 ? [...history, { role: 'user', parts: [{ text: message }] }] : message,
  });
  return { text: response.text };
};

export const generateImage = async (prompt: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "1:1" } },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64EncodeString = part.inlineData.data;
      return `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
    }
  }
  throw new Error("Failed to generate image.");
};

export const generateSpeech = async (text: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
