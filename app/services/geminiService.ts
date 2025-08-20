
import { GoogleGenAI, Type } from '@google/genai';
import type { Profile, WeatherData } from '../types';
import { LANGUAGES } from '../constants';
import { GEMINI_API_KEY } from '../config';

if (!GEMINI_API_KEY) {
    console.error("Gemini API Key is not configured in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Safely parses a JSON string, attempting to clean it if it's wrapped in markdown code fences.
 * @param jsonString The raw string from the API.
 * @returns The parsed JSON object.
 * @throws An error if the JSON is invalid even after cleaning.
 */
const safeJsonParse = (jsonString: string) => {
    try {
        // First, try to parse it directly.
        return JSON.parse(jsonString);
    } catch (e) {
        // If it fails, it might be wrapped in markdown code fences.
        const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            try {
                // If we found a markdown block, try parsing its content.
                return JSON.parse(match[1]);
            } catch (innerError) {
                // If even that fails, log the cleaned string and the error.
                console.error("Failed to parse cleaned JSON:", innerError);
                console.error("Cleaned JSON string was:", match[1]);
                throw new Error("Invalid JSON format even after cleaning.");
            }
        }
        // If no markdown block was found and it still failed, log and re-throw.
        console.error("Failed to parse JSON:", e);
        console.error("Original JSON string was:", jsonString);
        throw new Error("Invalid JSON format from API.");
    }
};


export const getTipsFromGemini = async (profile: Profile, weather: WeatherData): Promise<string[]> => {
  if (!GEMINI_API_KEY) return ["Error: API Key is not configured.", "Please contact support.", ""];
  try {
    const languageName = LANGUAGES.find(lang => lang.code === profile.language)?.name || 'English';
    const prompt = `I am a farmer in ${profile.location.city}, ${profile.state}, India. I grow ${profile.crops.join(', ')}. The current weather is ${weather.condition} with a temperature of ${weather.temp}°C. Give me exactly 3 short, actionable, and distinct farming tips based on this information. Each tip should be a single sentence. The tips must be in the ${languageName} language.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: 'A list of exactly 3 farming tips.'
            }
          }
        }
      }
    });

    const jsonText = response.text.trim();
    const result = safeJsonParse(jsonText);
    
    if (result.tips && Array.isArray(result.tips) && result.tips.length > 0) {
      return result.tips.slice(0, 3);
    }
    
    return ["Could not generate tips at this time.", "Please try again later.", "Check your connection."];

  } catch (error) {
    console.error("Error fetching tips from Gemini:", error);
    return ["Error: Could not fetch tips.", "Please check your connection and configuration.", "This feature may be temporarily unavailable."];
  }
};

export const getDiseaseAdviceFromGemini = async (profile: Profile, diseasePrediction: string): Promise<string> => {
  if (!GEMINI_API_KEY) throw new Error("API Key is not configured.");
  try {
    const languageName = LANGUAGES.find(lang => lang.code === profile.language)?.name || 'English';
    const prompt = `I am a farmer in ${profile.state}, India, and I grow ${profile.crops.join(', ')}. A plant has been diagnosed with "${diseasePrediction}". 
    
    Please provide a concise, actionable guide on how to manage this disease. 
    The guide should be easy for a farmer to understand.
    Include the following sections if relevant:
    1.  **Symptoms:** Briefly describe the key symptoms to confirm the diagnosis.
    2.  **Management/Prevention:** Provide practical steps for managing the spread and preventing future outbreaks. Include both organic and chemical options if applicable and available in India.
    3.  **Disclaimer:** Add a short disclaimer advising to consult a local agricultural expert.
    
    The entire response must be in the ${languageName} language. The response should be formatted with markdown for clarity.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text;

  } catch (error) {
    console.error("Error fetching disease advice from Gemini:", error);
    throw new Error("Could not fetch advice from AI assistant.");
  }
};


export const getChatResponseStream = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], newMessage: string, profile: Profile) => {
    if (!GEMINI_API_KEY) throw new Error("API Key is not configured.");
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are Krishi Sahayak, an AI assistant for Indian farmers. The user's profile is: Name: ${profile.name}, State: ${profile.state}, Crops: ${profile.crops.join(', ')}. Keep your answers concise, relevant to farming in India, and easy to understand.`,
        },
        history,
    });
    
    return chat.sendMessageStream({ message: newMessage });
};
