import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client using the Vite environment variable
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn("VITE_GEMINI_API_KEY is not set in the environment variables. Smart Discovery will not work.");
}

export const genAI = new GoogleGenerativeAI(apiKey || 'missing-key');
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
