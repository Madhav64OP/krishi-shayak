import type { Profile, SchemeUpdate, NewsUpdate, TavilyResult } from '../types';
import { LANGUAGES } from '../constants';
import { AGENTIC_API_ENDPOINT } from '../config';

/**
 * Parses a markdown string from the agentic API into structured news and schemes.
 * It's designed to be robust and handle various response structures.
 * @param markdown - The raw markdown string from the API response.
 * @returns An object containing arrays of news and schemes.
 */
const parseAgenticResponse = (markdown: string): { news: NewsUpdate[], schemes: SchemeUpdate[] } => {
    const news: NewsUpdate[] = [];
    const schemes: SchemeUpdate[] = [];

    // Split the content by the main headers to process sections independently.
    const sections = markdown.split(/(Government Schemes:|News and Updates:)/i);
    
    let currentSection: 'schemes' | 'news' | null = null;
    
    for (const part of sections) {
        if (/Government Schemes:/i.test(part)) {
            currentSection = 'schemes';
            continue;
        }
        if (/News and Updates:/i.test(part)) {
            currentSection = 'news';
            continue;
        }

        if (!currentSection || !part.trim()) continue;

        const processItem = (itemText: string) => {
            const item = itemText.trim();
            const parts = item.split(/:\s/);
            if (parts.length < 2) return null;

            let title = parts.shift()!.trim().replace(/^\*|\*$/g, '').trim();
            let summary = parts.join(': ').trim();
            let url = '#';

            // Extract URL from (URL: https://...) format
            const urlMatch = summary.match(/\(URL:\s*(https?:\/\/[^\)]+)\)/);
            if (urlMatch) {
                url = urlMatch[1].trim();
                // Remove the URL part from the summary
                summary = summary.replace(urlMatch[0], '').trim();
            }

            // Clean up other common artifacts from the summary
            summary = summary.replace(/\[Source:.*?\]/g, '').replace(/\(Relevance:.*?\)/g, '').trim();

            return { title, summary, url };
        };

        if (currentSection === 'schemes') {
            const schemeItems = part.trim().split(/\n\s*\*/).filter(s => s.trim());
            schemeItems.forEach(itemText => {
                const scheme = processItem(itemText);
                if (scheme) schemes.push(scheme);
            });
        } else if (currentSection === 'news') {
            // Use a positive lookahead in the split regex to keep the "Rank X:*" delimiter
            const newsItems = part.trim().split(/(?=Rank \d+:\*)/).filter(s => s.trim());
            newsItems.forEach(itemText => {
                const rankMatch = itemText.match(/^Rank (\d+):\*/);
                const rank = rankMatch ? parseInt(rankMatch[1], 10) : undefined;
                
                // Remove the rank part from the string before processing it further
                const content = itemText.replace(/^Rank \d+:\*/, '').trim();
                const newsItem = processItem(content);

                if (newsItem) {
                    news.push({ ...newsItem, rank });
                }
            });
        }
    }

    return { news, schemes };
};


/**
 * A generic helper to call the agentic AI API endpoint.
 * @param profile The user's profile.
 * @param query The specific query to send to the AI.
 * @returns A promise that resolves to the markdown response string.
 */
const callAgenticAPI = async (profile: Profile, query: string): Promise<string> => {
    const requestBody = {
        query: query,
        thread_id: `krishi-sahayak-${profile.phone}-${Date.now()}`, // More specific thread_id
        city: profile.location.city,
        crops: profile.crops,
    };

    try {
        const response = await fetch(AGENTIC_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Agentic AI API Error:", errorData);
            throw new Error(`API request failed with status ${response.status}: ${errorData}`);
        }

        const data = await response.json();
        
        if (data.response && typeof data.response === 'string') {
            return data.response;
        } else {
            console.error("Invalid response format from Agentic AI API", data);
            throw new Error("Received invalid data from Agentic AI API");
        }

    } catch (error) {
        console.error("Error fetching from Agentic AI API:", error);
        throw error;
    }
};

/**
 * Fetches and summarizes news updates by sending a specific prompt to the agentic API.
 */
export const summarizeNewsWithGroq = async (profile: Profile, _results?: TavilyResult[]): Promise<NewsUpdate[]> => {
    const languageName = LANGUAGES.find(lang => lang.code === profile.language)?.name || 'English';
    const query = `I am a farmer from ${profile.location.city}, ${profile.state}, and I grow ${profile.crops.join(', ')}. 
Please provide the latest agriculture-related news updates relevant to my profile and region. 
The response should be in ${languageName}.

Strict Formatting Instructions:
- Start with the header exactly: "News and Updates:"
- Each news item must be listed in the format:
  Rank X:* <TITLE>: <SUMMARY> (URL: <VALID_HTTPS_URL>)
- The "Rank" must start at 1 and increment by relevance.
- The TITLE should be concise (max 12 words).
- The SUMMARY should be 1–2 sentences only.
- The URL must always be a valid https:// link. If no reliable link exists, write "URL: https://na.gov.in". 
- Do NOT include extra notes, markdown links, or sources in brackets. 
- Example:
  Rank 1:* Crop Prices Rise: Government reports higher MSP for wheat. (URL: https://agrinews.gov.in)`;

    
    const markdownResponse = await callAgenticAPI(profile, query);
    const { news } = parseAgenticResponse(markdownResponse);
    return news;
};

/**
 * Fetches and processes government schemes by sending a specific prompt to the agentic API.
 */
export const processAllSchemesWithGroq = async (profile: Profile, _results?: TavilyResult[]): Promise<SchemeUpdate[]> => {
    const languageName = LANGUAGES.find(lang => lang.code === profile.language)?.name || 'English';
    const query = `I am a farmer from ${profile.location.city}, ${profile.state}, and I grow ${profile.crops.join(', ')}. 
Please provide government schemes suitable for me. 
The response should be in ${languageName}.

Strict Formatting Instructions:
- Start with the header exactly: "Government Schemes:"
- Each scheme must be listed in the format:
  * <TITLE>: <SUMMARY> (URL: <VALID_HTTPS_URL>)
- TITLE should be concise (max 10 words).
- SUMMARY should be 1–2 sentences only.
- The URL must always be a valid https:// link. If no official link exists, write "URL: https://na.gov.in".
- Do NOT include markdown links like [text](url). Use plain (URL: ...).
- Example:
  * PM-KISAN Yojana: Provides direct income support to small farmers. (URL: https://pmkisan.gov.in)`;

    const markdownResponse = await callAgenticAPI(profile, query);
    const { schemes } = parseAgenticResponse(markdownResponse);
    return schemes;
};
