// src/services/gemini.ts

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiResponse {
  text: string;
  error?: string;
}

export const geminiService = {
  async chat(message: string): Promise<GeminiResponse> {
    try {
      const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates[0]?.content?.parts[0]?.text || 'No response';

      return { text };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return { 
        text: '', 
        error: error instanceof Error ? error.message : 'Failed to get response' 
      };
    }
  },

  async chatWithHistory(messages: GeminiMessage[]): Promise<GeminiResponse> {
    try {
      const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates[0]?.content?.parts[0]?.text || 'No response';

      return { text };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return { 
        text: '', 
        error: error instanceof Error ? error.message : 'Failed to get response' 
      };
    }
  }
};
