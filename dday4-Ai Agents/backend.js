const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { GoogleGenAI } = require("@google/genai");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 👉 Serve frontend.html automatically
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend.html"));
});

const History = [];
const ai = new GoogleGenAI({
  apiKey: "AIzaSyAmLivRa2ImX9jirHjdAYCchUs9QLlPJyo", // 🔑 replace with your Gemini API key
});

// ------- tools -------
function sum({ num1, num2 }) {
  return num1 + num2;
}
function prime({ num }) {
  if (num <= 1) return false;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
}
async function getCryptoPrice({ coin }) {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coin}`
  );
  const data = await response.json();
  return data;
}
async function getWeather({ location }) {
  const response = await fetch(
    `http://api.weatherapi.com/v1/current.json?key=91329175890d436dbdf61714252008&q=${location}&aqi=no`
  );
  const data = await response.json();
  return data;
}
async function getGithubProfile({ profile }) {
  const response = await fetch(`https://api.github.com/users/${profile}`);
  if (!response.ok) {
    return { error: "Profile not found" };
  }
  const data = await response.json();
  return {
    name: data.name || "N/A",
    bio: data.bio || "N/A",
    followers: data.followers,
    following: data.following,
    public_repos: data.public_repos,
    twitter: data.twitter_username || "N/A",
    profile_url: data.html_url,
  };
}

const availableTools = {
  sum,
  prime,
  getCryptoPrice,
  getWeather,
  getGithubProfile,
};

// ------- run agent -------
async function runAgent(userProblem) {
  History.push({ role: "user", parts: [{ text: userProblem }] });

  while (true) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: History,
      config: {
        systemInstruction: `You are an AI agent.  
You have access to 5 tools:  
1. Find sum of 2 numbers.  
2. Check if a number is prime.  
3. Get the crypto price of any currency.  
4. Fetch the weather of any location.  
5. Check if a GitHub profile exists.  

Rules:  
- Use these tools whenever required to confirm or fetch information.  
- If the user asks about **arrays, strings, linked lists, stacks, queues, trees, graphs, searching, sorting, recursion, dynamic programming, hashing, two pointers, sliding window, or any other DSA/coding concepts**, you must explain directly in **simple, clear, and easy-to-understand words**.  
- You should also help with **coding explanations, examples, pseudocode, and step-by-step breakdowns** when needed.  
- If the user asks for **study tips, coding strategies, or interview guidance**, provide practical and easy advice.  
- Always keep answers beginner-friendly (like teaching a kid), but give depth if the user asks for more advanced detail.  
- Never refuse general DSA, arrays, or concept-related queries; always explain directly without tools.  
`,

        tools: [
          {
            functionDeclarations: [
              {
                name: "sum",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    num1: { type: "NUMBER" },
                    num2: { type: "NUMBER" },
                  },
                  required: ["num1", "num2"],
                },
              },
              {
                name: "prime",
                parameters: {
                  type: "OBJECT",
                  properties: { num: { type: "NUMBER" } },
                  required: ["num"],
                },
              },
              {
                name: "getCryptoPrice",
                parameters: {
                  type: "OBJECT",
                  properties: { coin: { type: "STRING" } },
                  required: ["coin"],
                },
              },
              {
                name: "getWeather",
                parameters: {
                  type: "OBJECT",
                  properties: { location: { type: "STRING" } },
                  required: ["location"],
                },
              },
              {
                name: "getGithubProfile",
                description: "Get GitHub profile information for any user",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    profile: { type: "STRING", description: "GitHub username" },
                  },
                  required: ["profile"],
                },
              },
            ],
          },
        ],
      },
    });

 // Check if model wants to call a tool
    if (response.functionCalls && response.functionCalls.length > 0) {
      const { name, args } = response.functionCalls[0];

      if (availableTools[name]) {
        // Call the tool if it exists
        const result = await availableTools[name](args);

        // Add tool response to history
        History.push({ role: "model", parts: [{ functionCall: response.functionCalls[0] }] });
        History.push({ role: "user", parts: [{ functionResponse: { name, response: { result } } }] });

        // Return the result to frontend
        return result;
      } else {
        // Tool not recognized → fallback to model text
        History.push({ role: "model", parts: [{ text: response.text }] });
        return response.text;
      }
    } else {
      // No tool call → normal answer
      History.push({ role: "model", parts: [{ text: response.text }] });
      return response.text;
    }
  }
}

// ------- API endpoint -------
app.post("/ask", async (req, res) => {
  const { question } = req.body;
  const answer = await runAgent(question);
  res.json({ answer });
});

// ------- start server -------
app.listen(5000, () => console.log(" Server running "));
