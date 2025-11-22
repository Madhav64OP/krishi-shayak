import { AGENTIC_API_ENDPOINT } from '../config';
import type { Profile } from '../types';

export const sendMessageToAgent = async (
  profile: Profile, 
  message: string, 
  threadId: string | null
) => {
  try {
    // Ensure we hit the correct endpoint. 
    // If AGENTIC_API_ENDPOINT ends in '/chat', use it directly.
    // If it is just the base URL, append '/chat'.
    const url = AGENTIC_API_ENDPOINT.endsWith('/chat') 
      ? AGENTIC_API_ENDPOINT 
      : `${AGENTIC_API_ENDPOINT}/chat`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: message,
        thread_id: threadId, // Pass thread_id to maintain conversation memory
        city: profile.location.city,
        crops: profile.crops
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data; // Returns { response: "...", thread_id: "..." }
  } catch (error) {
    console.error("Agent Error:", error);
    throw error;
  }
};