
import type { Profile, TavilyResult } from '../types';
import { TAVILY_API_KEY } from '../config';

interface TavilyApiResponse {
    results: {
        title: string;
        url: string;
        content: string;
        raw_content?: string;
    }[];
}

const tavilySearch = async (query: string): Promise<TavilyResult[]> => {
    if (!TAVILY_API_KEY) {
        console.error("Tavily API key is not configured as an environment variable (TAVILY_API_KEY).");
        throw new Error("Tavily API key is missing.");
    }
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: TAVILY_API_KEY,
                query: query,
                search_depth: "advanced",
                include_raw_content: true,
                max_results: 3,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Tavily API Error:", errorData);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data: TavilyApiResponse = await response.json();
        return data.results || [];

    } catch (error) {
        console.error("Error fetching from Tavily:", error);
        throw error;
    }
}

export const fetchNewsUpdates = async (profile: Profile): Promise<TavilyResult[]> => {
    const query = `latest farming news in ${profile.state}, India for ${profile.crops.join(', ')} farmers 2025`;
    return tavilySearch(query);
};

export const crawlAgriWebsite = async (profile: Profile): Promise<TavilyResult[]> => {
    const query = `site:agriwelfare.gov.in/en/Major relevant schemes for ${profile.crops.join(', ')} farmers in ${profile.state}`;
    return tavilySearch(query);
};
