from mcp.server.fastmcp import FastMCP
import os
from dotenv import load_dotenv
from langchain_tavily import TavilySearch
from duckduckgo_search import DDGS

import requests
import asyncio

mcp=FastMCP("FarmAssistant")

load_dotenv()

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
TAVILY_API_KEY= os.getenv("TAVILY_API_KEY")

tavily=TavilySearch(api_key=TAVILY_API_KEY,max_results=3,include_images=False)

#formatting functions
def format_weather(data, days=3):
    city = data["location"]["name"]
    forecast_text = f"Weather forecast for {city}:\n"
    
    for day in data["forecast"]["forecastday"][:days]:
        date = day["date"]
        condition = day["day"]["condition"]["text"]
        avg_temp = day["day"]["avgtemp_c"]
        min_temp = day["day"]["mintemp_c"]
        max_temp = day["day"]["maxtemp_c"]
        rain_chance = day["day"].get("daily_chance_of_rain", "N/A")
        
        forecast_text += (
            f"- {date}: {condition}, Avg Temp: {avg_temp}°C "
            f"(Min: {min_temp}°C, Max: {max_temp}°C), Rain chance: {rain_chance}%\n"
        )
    
    return forecast_text

def format_tavily_response(response: dict, top_n: int = 3) -> str:


    results = response.get("results", [])
    if not results:
        return "No results found."

    formatted = f"Top {min(top_n, len(results))} results for your query:\n\n"

    for i, r in enumerate(results[:top_n]):
        title = r.get("title", "No title")
        content = r.get("content", "No summary available")
        url = r.get("url", "")
        
        # Optional: truncate content for readability
        snippet = content[:300] + "..." if len(content) > 300 else content
        
        formatted += f"{i+1}. {title}\n   - Summary: {snippet}\n   - Link: {url}\n\n"

    return formatted

##mcp tools

@mcp.tool()
async def get_weather(city: str) -> str:
    """
    Get the current weather details for a given city in english language.

    Args:
        city (str): The city name as a plain string (e.g. "Bhatinda").
    """
    #api logic
    response = requests.get(f"http://api.weatherapi.com/v1/forecast.json?key={WEATHER_API_KEY}&q={city}&days=7&aqi=yes&alerts=yes")
    
    data = response.json()
    
    return format_weather(data)

@mcp.tool()
async def disease_prediction(img: str) -> str:
    """
    Predict diseases in crops based on an image.
    
    Args:
        img (str): Base64 encoded image string of the crop leaf.
    """
    # Placeholder for actual disease prediction logic
    # Here we would typically call a machine learning model or an API
    return "Disease prediction is not implemented yet."

@mcp.tool()
async def general_queries(query: str) -> list:
    """
    Answer general queries related to agriculture and farming.
    Returns top 3 results as a readable string.
    """
    
    results=await tavily.ainvoke(query)
    return format_tavily_response(results)
    

# async def test_all_tools():
#     """
#     A simple async function to test the general_queries.
#     """
#     print("--- Testing general_queries ---")
#     query = "latest agricultural news in India"
#     results = await general_queries(query)
#     print(results)
#     print("-----------------------------------")

# if __name__ == "__main__":
#     # import asyncio
#     # asyncio.run(test_all_tools())
#     mcp.run(transport="streamable-http")
app = mcp.streamable_http_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server_mcp:app", host="0.0.0.0", port=8000, reload=True)
