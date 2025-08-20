
export interface Profile {
  version: number;
  name: string;
  phone: string;
  state: string;
  location: {
    city: string;
    lat: number;
    lng: number;
  };
  crops: string[];
  language: string;
}

export interface WeatherData {
    temp: number;
    condition: 'sunny' | 'rainy' | 'cloudy';
    icon: React.ReactNode;
}

export interface Tip {
    id: number;
    text: string;
}

export interface TavilyResult {
    title: string;
    url: string;
    content: string;
    raw_content?: string;
}

export interface NewsUpdate {
  title: string;
  url: string;
  summary: string;
  rank?: number;
}

export interface SchemeUpdate {
  title: string;
  summary: string;
  url: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
