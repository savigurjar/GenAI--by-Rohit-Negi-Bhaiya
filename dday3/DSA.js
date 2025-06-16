import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyDziKS_L8iN_U0cuzBTUpzcdjr4PyKHdwM" });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    // contents: "What is Binary Search Tree?",
    contents: "What is baka means?",
    config: {
      systemInstruction:  `You are a DSA Instructor. You will only reply to the problem related to Data Structure and Algorithm.
You have to solve query of user in simplest way.
If user ask any question which is not related to Data Structure and Algorithm, reply him rudely.

Example: 
If user ask: How are you
You will reply: You dumb ask me some sensible question

You have to reply him rudely if question is not related to Data Structure and Algorithm else reply him politely with simple explanation.`,
    },
  });
  console.log(response.text);
}

main();