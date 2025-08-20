# KRISHI SAHAYAK

## 🌾 AI Agent for Modern Agriculture

### Team Ctrl+Shift+B

*Team Members:* Madhav Ahuja, Aditya Kore, Srikant Meel, Sameer Modi

-----

## 💡 Project Overview

*KRISHI SAHAYAK* is an integrated AI agentic platform designed to empower Indian farmers. Our solution aims to address the challenges faced by farmers by providing a unified, multilingual, and intuitive interface that combines essential agricultural information with real-time AI assistance. The platform simplifies access to government schemes, weather forecasts, market updates, and disease detection, all within a single application.

The core innovation lies in creating a unified, *agentic platform* that automates and streamlines critical agricultural tasks, eliminating the need for farmers to use multiple tools. For example, the AI can detect a plant disease from an image and then intelligently suggest an appointment with a specialist, thereby connecting information to action.

## 🌐 Project Links
You can Access Our app here

Click Here

[![https://krishi-shayak.vercel.app/#/welcome](https://img.shields.io/badge/Demo-Live-brightgreen?style=for-the-badge&logo=google-chrome)](https://your-deployed-url.com)


## 💻 Setup and Installation

The server for the agentic ai and diseasce classifier is deployed on render, we have deployed it so you dont have to worry about it.

For testing the Main Code
You Can Test the app code also


Make sure 

### Step 1
```bash
git clone https://github.com/Madhav64OP/krishi-shayak.git
```

### Step 2
```bash
 cd /app
```

### Step 3
```bash
 npm i
```

### Step 4
```bash
 npm run dev
```

### Step 5
Open the app in your browser on the localhost port shown in the terminal (e.g., http://localhost:3000).


### Step 6 Control Click on it

And then enjoy you app
### Now Enjoy Your Demo

## ✨ Features

  * *Multilingual Voice/Text Chat*: Real-time AI chat support fine-tuned for agriculture, available in Hindi, English, and other regional languages.
  * *Government Scheme Information*: Access to relevant and latest government schemes and policies.
  * *Real-time Weather Feedback*: Day-to-day weather forecasts to help with planting and harvesting decisions.
  * *Plant Disease Identification*: An AI-powered tool that predicts crop diseases from an image.
  * *Latest Market Information*: Updates on crop market prices and trends.
  * *Agentic Automation*: The AI can perform and automate tasks like scheduling appointments based on detected issues.

-----

## ⚙ Technical Stack

Our solution is built using a robust and modern stack designed for scalability and performance.

| Category | Technologies | Description |
| :--- | :--- | :--- |
| *Frontend* | React, Node.js | Provides a user-friendly interface with multi-language support. |
| *Backend* | FastAPI, Uvicorn | A lightweight and high-performance backend for handling API requests. |
| *Agent Orchestration* | *LangChain, **LangGraph* | LangChain provides the modular components, while LangGraph orchestrates a stateful, multi-step agent workflow. |
| *LLM Integration* | *LangChain-Groq* | Connects the application to Groq's LPU-powered models for extremely fast, low-latency responses. |
| *Tooling* | *LangChain-Tavily, **DuckDuckGo-Search, **MCP Server* | Gives the agent access to real-time web search and external tools like our weather and disease models. |
| *ML Models* | *Gemma, **LLaMA-3* (fine-tuned), *Deep Learning* (for disease detection) | The AI's intelligence is powered by fine-tuned large language models and a custom deep learning model. |
| *Utilities* | python-dotenv, typing-extensions, Ipython | Standard Python libraries for managing environment variables and development. |

-----


Follow these steps to set up and run the project locally.


## 🚀 Running the Agent

The core of the project is the AI agent. You can interact with it via the FastAPI endpoint. The following script shows a basic example of how the agent can be invoked.

-----

## 📈 Success Metrics

Our success will be measured by:

  * *Engagement Frequency*: The number of times farmers use key features.
  * *Accuracy of Disease Detection*: The performance of our AI model.
  * *Language Coverage*: The number of supported local languages.
  * *Economic Impact*: The positive effect on crop yield and selling price.

-----

## 📚 Datasets

The disease detection model was trained and evaluated using the following datasets:

  * [New Plant Diseases Dataset (Augmented)](https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset?select=New+Plant+Diseases+Dataset%28Augmented%29)
  * [20k Multi-class Crop Disease Images](https://www.kaggle.com/datasets/jawadali1045/20k-multi-class-crop-disease-images)
