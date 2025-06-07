import { GoogleGenAI } from "@google/genai";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const readlineSync = require('readline-sync');

const ai = new GoogleGenAI({ apiKey: "AIzaSyC2CqAYJKJzGsJ7v2iwQEr53dLGysYfEtw" });

const History = [];

async function Chatting(userProblem) {
  History.push({
    role: 'user',
    parts: [{ text: userProblem }]
  });

  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: History
  });

  const response = await result.response;
  const text = await response.text();

  History.push({
    role: 'model',
    parts: [{ text }]
  });

  console.log("\nAI:", text);
}

async function main() {
  const userProblem = readlineSync.question("Ask me anything --> ");
  if (userProblem.toLowerCase() === "exit") {
    console.log("Goodbye!");
    return;
  }
  await Chatting(userProblem);
  await main(); // recursive, but safe because we added exit
}

main();
