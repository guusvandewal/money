import { GoogleGenAI, Type } from "@google/genai";
import { AssetData } from '../types';

const CHART_ANALYSIS_PROMPT = `
You are an expert financial data analyst. Your job is to digitize financial charts from images.
Extract the approximate data points (X-axis date/label and Y-axis value) from the provided chart image.
Also identify the asset name, current value, and generate a discrete performance table based on the trend visible or explicit table data in the image.
Return the data in a strictly structured JSON format.
`;

// Helper to convert file to base64
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper to extract JSON from text response
const parseJSONFromText = (text: string): any => {
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // 2. Try finding markdown JSON block
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) return JSON.parse(match[1]);
    
    // 3. Try finding raw object
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }
    throw new Error("Could not parse JSON response from model output");
  }
};

export const analyzeChartImage = async (file: File): Promise<AssetData> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey });
    const base64Data = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          {
            text: "Analyze this chart. Extract the title, a current value estimate, percentage change if visible (or calculate from last 2 points), a series of at least 20 data points representing the line, and a discrete performance table (yearly or period based)."
          }
        ]
      },
      config: {
        systemInstruction: CHART_ANALYSIS_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the asset or chart title" },
            currentValue: { type: Type.STRING, description: "Current value displayed or last value" },
            percentageChange: { type: Type.NUMBER, description: "Overall change percentage shown or calculated" },
            currency: { type: Type.STRING, description: "Currency symbol or unit, e.g. $, EUR, %" },
            data: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  value: { type: Type.NUMBER }
                }
              }
            },
            performance: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  period: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  formattedValue: { type: Type.STRING }
                }
              }
            }
          },
          required: ["name", "data", "performance"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const parsed = JSON.parse(text);
    
    return {
      id: 'custom-' + Date.now(),
      ...parsed
    };

  } catch (error) {
    console.error("Error analyzing chart:", error);
    throw error;
  }
};

export const fetchMarketData = async (assetName: string): Promise<AssetData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Fetch the latest live market data for "${assetName}". 
    
    I need a JSON object containing:
    1. "name": The full name of the asset (e.g., Gold Spot, Bitcoin USD).
    2. "currentValue": The current price formatted as a string (e.g., "2,340.50").
    3. "currency": The currency symbol (e.g. "$").
    4. "percentageChange": The 24-hour percentage change as a number (e.g., 1.25 or -0.5).
    5. "data": An array of approximately 30 data points representing the daily closing price for the last 30 days. Each point must have "date" (formatted as "MMM DD", e.g. "Oct 25") and "value" (number). Use the search results to approximate the trend accurately.
    6. "performance": An array of objects for discrete performance periods: "1M", "6M", "YTD", "1Y". Each object must have "period", "value" (percentage number), and "formattedValue" (string with % sign).

    Format the response as valid JSON. Do not use markdown formatting if possible, or enclose in \`\`\`json blocks.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");

    const parsed = parseJSONFromText(text);

    // Extract grounding sources
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => {
        if (chunk.web) {
          return { title: chunk.web.title, uri: chunk.web.uri };
        }
        return null;
      })
      .filter((s: any) => s !== null) || [];

    // Deduplicate sources based on URI
    const uniqueSources = Array.from(new Map(sources.map((s: any) => [s.uri, s])).values()) as any[];

    return {
      id: assetName.toLowerCase(),
      name: parsed.name || assetName,
      currentValue: parsed.currentValue || "0.00",
      percentageChange: parsed.percentageChange || 0,
      currency: parsed.currency || "@=€",
      data: parsed.data || [],
      performance: parsed.performance || [],
      sources: uniqueSources
    };

  } catch (error) {
    console.error(`Error fetching market data for ${assetName}:`, error);
    throw error;
  }
};