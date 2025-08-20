import React from 'react';
import { Sun, Cloud, CloudRain } from 'lucide-react';
import type { WeatherData } from '../types';
import { WEATHER_API_KEY } from '../config';

export const getWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  if (!WEATHER_API_KEY) {
    console.error("WeatherAPI key is not configured in environment variables.");
    // Return a fallback so the UI doesn't completely break
    return {
      temp: 23,
      condition: 'sunny',
      icon: React.createElement(Sun, { className: "w-16 h-16 text-accent" }),
    };
  }
  
  try {
    const city = `${lat},${lon}`;
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${city}&aqi=yes`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const data = await response.json();

    const conditionText = data.current.condition.text.toLowerCase();
    
    let condition: 'sunny' | 'rainy' | 'cloudy' = 'sunny';
    let iconElement = React.createElement(Sun, { className: "w-16 h-16 text-accent" });

    if (conditionText.includes("cloud") || conditionText.includes("overcast") || conditionText.includes("mist") || conditionText.includes("fog")) {
      condition = 'cloudy';
      iconElement = React.createElement(Cloud, { className: "w-16 h-16 text-text-secondary" });
    } else if (conditionText.includes("rain") || conditionText.includes("drizzle") || conditionText.includes("sleet")) {
      condition = 'rainy';
      iconElement = React.createElement(CloudRain, { className: "w-16 h-16 text-sky" });
    }
    
    return {
      temp: Math.round(data.current.temp_c), // Celsius
      condition: condition,
      icon: iconElement,
    };
  } catch (error) {
    console.error("Error fetching weather:", error);

    // fallback (sunny)
    return {
      temp: 23,
      condition: "sunny",
      icon: React.createElement(Sun, { className: "w-16 h-16 text-accent" }),
    };
  }
};
