const express = require("express")
const readlineSync = require("readline-sync");
const { GoogleGenAI } = require("@google/genai");

const History = [];
// Configure the client
const ai = new GoogleGenAI({
  apiKey: "AIzaSyAmLivRa2ImX9jirHjdAYCchUs9QLlPJyo",
});
function sum({ num1, num2 }) {
  return num1 + num2;
}

function prime({ num }) {
  if (num <= 1) return false;

  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) {
      return false;
    }
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

const sumDeclaration = {
  name: "sum",
  description: "get the sum of 2 number",
  parameters: {
    type: "OBJECT",
    properties: {
      num1: {
        type: "NUMBER",
        description: "it will be first number for addition ex: 12",
      },
      num2: {
        type: "NUMBER",
        description: "It will be the second number of addtion ex: 30",
      },
    },
    required: ["num1", "num2"],
  },
};
const primeDeclaration = {
  name: "prime",
  description: "get the number is prime or not ",
  parameters: {
    type: "OBJECT",
    properties: {
      num: {
        type: "NUMBER",
        description: "it will be the number to find its is prime or not ex: 7",
      },
    },
    required: ["num"],
  },
};
const cryptoDeclaration = {
  name: "getCryptoPrice",
  description: "Get the current price of any Crypto currencey like bitcoin",
  parameters: {
    type: "OBJECT",
    properties: {
      coin: {
        type: "STRING",
        description: "it will be the crpto currencey name,like bitcoin",
      },
    },
    required: ["coin"],
  },
};

const availableTools = {
  sum: sum,
  prime: prime,
  getCryptoPrice: getCryptoPrice,
};

async function runAgent(userProblem) {
  History.push({
    role: "user",
    parts: [{ text: userProblem }],
  });

  while (true) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: History,
      // Generation config with function declaration
      config: {
        systemInstruction: `You are an AI agent ,You have access of 3 avaliable tools to find sum of 2 number , get crpto price of any currency and find a number is prime or not 
        
         use these tools wenever required to confirm user query.
         if user ask general question you can answer it directly if you don't need help of these three tools
        `,
        tools: [
          {
            functionDeclarations: [
              sumDeclaration,
              primeDeclaration,
              cryptoDeclaration,
            ],
          },
        ],
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      console.log(response.functionCalls[0]);
      const { name, args } = response.functionCalls[0];

      // if (name == "sum") {
      //   sum(args);
      // } else if (name == "prime") {
      //   prime(args);}

      const funnCalll = availableTools[name];
      const result = await funnCalll(args);

      const functionResponsePart = {
        name: name,
        response: {
          result: result,
        },
      };

      // model
      History.push({
        role: "model",
        parts: [
          {
            functionCall: response.functionCalls[0],
          },
        ],
      });
      // result ko history me
      History.push({
        role: "user",
        parts: [
          {
            functionResponse: functionResponsePart,
          },
        ],
      });
    } else {
      History.push({
        role: "model",
        parts: [{ text: response.text }],
      });
      console.log(response.text);
      break;
    }
  }
}

async function main(params) {
  const userProblem = readlineSync.question("Ask me anything--> ");

  await runAgent(userProblem);
  main();
}
main();


