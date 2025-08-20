// ==========================================================================================
// API KEY & ENDPOINT CONFIGURATION
// ==========================================================================================
// This file centralizes all external service configurations.
// Values are sourced from environment variables, making the app secure and deployable.
// For Vite, environment variables exposed to the client must be prefixed with `VITE_`.
// ==========================================================================================

// --- Gemini API ---
// Used for generative AI features like tips, advice, and the chat assistant.
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --- Weather API ---
// Used to fetch current weather data for the user's location.
export const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API;

// --- Tavily API ---
// Used for web searches.
export const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

// --- Agentic AI API (Custom Backend for Groq) ---
// This is the backend service that provides summarized news and schemes.
export const AGENTIC_API_ENDPOINT = import.meta.env.VITE_AGENTIC_API_ENDPOINT || 'https://agentic-ai-api.onrender.com/chat';

// --- Plant Disease API ---
// The endpoint for the plant disease detection model.
export const DISEASE_API_ENDPOINT = import.meta.env.VITE_DISEASE_API_ENDPOINT || 'https://fastapi-disease.onrender.com/predict';
