import os
import asyncio
import requests
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv
from langchain_tavily import TavilySearch
from fastapi import FastAPI,HTTPException
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel
import uuid

load_dotenv()

#---------------llm initialization-----------
llm=ChatGroq(model="llama3-8b-8192",api_key=os.getenv("GROQ_API_KEY"))


#----------this will store MemorySaver per thread_id------------
memory_store={}

mcp=FastMCP("FarmAssistant")


#------System Promtps-------
SYSTEM_PROMPT = """You are a helpful farm assistant AI. You have access to the following tools:
                1. get_weather(city): Get weather forecasts for a city.
                2. disease_prediction(img): Predict crop diseases from an image.
                3. general_queries(query): Get information from trusted sources.

                Guidelines:
                - Always use the tools to answer questions about weather, crop diseases, or general farming queries.
                -If the only gives information about crops, use weather tools, general queries tool to find him all the results about his crop in a personalzed way, for genreal queries tool give him about latest schemes,some latest updated just personalzed for the user .
                -Give personalized responses based on the user's crops and location.
                -Sometimes user will ask things that dont require tools. Answer those directly.
                - Format your final answer in **Markdown** with clear sections and bullet points.
                - When using general_queries, summarize the results in readable form, along with titles, snippets, and links, these are important to add along with, make sure to add links.
                - If the question cannot be answered using your tools, respond: "I don't have enough information to answer this."
                -Dont say anything about the tools to the user, just use them.
                - Respond in the language of the user, but tool usage remains in English.
                - Keep answers concise and helpful.
                """




#-------APi Keys from env variables-----------
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
TAVILY_API_KEY= os.getenv("TAVILY_API_KEY")

tavily=TavilySearch(api_key=TAVILY_API_KEY,max_results=3,include_images=False)



#----------formatting functions----------
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


##------mcp tools------
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


#--------Memory management------
app=FastAPI(title="Farm Assistant API")

class ChatRequest(BaseModel):
    query:str
    thread_id:str =None 
    city:str = None
    crops:list[str] = None

def get_user_memory(thread_id: str) -> MemorySaver:
    """
    Get or create a MemorySaver instance for the given thread_id.
    """
    if thread_id not in memory_store:
        memory_store[thread_id] = MemorySaver()
    return memory_store[thread_id]


#---------Api end points--------

@app.post("/chat")
async def chat_endpoint(request:ChatRequest):
    if not request.thread_id:
        request.thread_id = str(uuid.uuid4())
        
    memory = get_user_memory(request.thread_id)
    
    client = MultiServerMCPClient(
        {
            "FarmAssistant":{
                "url":"https://mcp-server-agentic.onrender.com/mcp",
                "transport":"streamable_http"
            }
        }
    )
    
    tools= await client.get_tools()
    agent = create_react_agent(
        llm,
        tools,
        checkpointer=memory
    )
    
    config={
        "configurable":{
            "thread_id":request.thread_id,
        }
    }
    
    # messages=[SYSTEM_PROMPT,{"role":"user","content":request.query}]
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": request.query}
    ]
    
    response= await agent.ainvoke(
        {"messages": messages},
        config=config,
    )
    return {
        "thread_id":request.thread_id,
        "messages":messages,
        "response": response["messages"][-1].content
    }
    
# app.mount("/mcp", mcp)

if __name__ == "__main__":
    mcp.run(transport="streamable-http", host="127.0.0.1", port=8080, path="/mcp")

