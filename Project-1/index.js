const express = require("express");
const app = express();
const { GoogleGenAI } = require("@google/genai");
const readlineSync = require("readline-sync");
const fetch = require("node-fetch");

require("dotenv").config();

app.use(express.json());

const History = [];
const ai = new GoogleGenAI({
  apiKey: process.env.GENAI,
});

const calculate = ({ num1, num2, operation }) => {
  switch (operation) {
    case "add":
      return num1 + num2;
    case "subtract":
      return num1 - num2;
    case "multiply":
      return num1 * num2;
    case "divide":
      return num2 !== 0 ? num1 / num2 : "Error: divided by zero";
    default:
      return "Invalid Operation";
  }
};
const getCryptoPrice = async ({ coin }) => {
  const response = await fetch(`${process.env.CRYPTO_BASE}${coin}`);
  const data = await response.json();
  return data;
};

const getWeather = async ({ location }) => {
  const response = await fetch(
    `${process.env.WEATHERAPI_BASE}&q=${location}&aqi=no`
  );
  const data = await response.json();
  return data;
};

const getNews = async ({ query }) => {
  const response = await fetch(
    `${process.env.NEWSAPI_BASE}?q=${query}&sortBy=popularity&apiKey=${process.env.NEWSAPI_KEY}`
  );
  const data = await response.json();
  return data;
};

const getDefinition = async ({ word }) => {
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/${lang}/${word}`
  );
  const data = await res.json();

  if (data.title) return `No definition found for "${word}".`;

  return data[0].meanings[0].definitions[0].definition;
};

const getJoke = async ({ category }) => {
  const res = await fetch(`https://v2.jokeapi.dev/joke/${category}`);
  const data = await res.json();

  if (data.error) {
    return `No jokes found for "${category}". Try another category.`;
  }
  return data;
};

const calculateDeclaration = {
  name: "calculate",
  description: "perform arithmetic operation on 2 numbers",
  parameters: {
    type: "OBJECT",
    properties: {
      num1: { type: "NUMBRR", description: "first number" },
      num2: { type: "NUMBER", description: "second number" },
      operation: {
        type: "STRING",
        description: "operation to perform (add , subtract,multiply,divide)",
      },
    },
    required: ["num1", "num2", "operation"],
  },
};
const getWeatherDeclaration = {
  name: "getWeather",
  description: "get the current weather of any location",
  parameters: {
    type: "OBJECT",
    properties: {
      location: {
        type: "STRING",
        description: "It will be location name like ex: Delhi",
      },
    },
    required: ["location"],
  },
};
const getCryptoDeclaration = {
  name: "getCryptoPrice",
  description: "get the current price of any crypto currency in doller",
  parameters: {
    type: "OBJECT",
    properties: {
      coin: {
        type: "STRING",
        description: "it will be the crypto currency name like ex. bitcoin",
      },
    },
    required: ["coin"],
  },
};
const getNewsDeclaration = {
  name: "getNews",
  description: "get the latest news articles based on a search term",
  parameters: {
    type: "OBJECT",
    properties: {
      query: {
        type: "STRING",
        description:
          "The search keyword like Apple, Election,NewJobs,currentnews and may more",
      },
    },
    required: ["query"],
  },
};
const getDefinitionDeclaration = {
  name: "getDefinition",
  description: "get the dictionary definition of given word ",
  parameters: {
    type: "OBJECT",
    properties: {
      word: {
        type: "STRING",
        description:
          "The English or in other language word to loop up ,eg. hello",
      },
    },
    required: ["word"],
  },
};
const getJokeDeclaration = {
  name: "getJoke",
  description: "get a random joke from jokeapi",
  parameters: {
    type: "OBJECT",
    properties: {
      category: {
        type: "STRING",

        description:
          "The joke category (Programming, Misc, Pun, Spooky, Christmas, Any)",
      },
    },
    required: ["category"],
  },
};

const availableTools = {
  calculate: calculate,
  getCryptoPrice: getCryptoPrice,
  getWeather: getWeather,
  getNews: getNews,
  getDefinition: getDefinition,
  getJoke: getJoke,
};

async function runAgent(userProblem) {
  History.push({
    role: "user",
    parts: [{ text: userProblem }],
  });
  while (true) {
    // Send request with function declarations
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: History,
      config: {
        systemInstruction: `You are an AI agent ,You have access of 3 avaliable tools to find calculation of 2 number based on given operation, get crpto price of any currency and get current weather of any location
        
         use these tools wenever required to confirm user query.
         if user ask general question you can answer it directly if you don't need help of these three tools
        `,
        tools: [
          {
            functionDeclarations: [
              calculateDeclaration,
              getCryptoDeclaration,
              getWeatherDeclaration,
              getNewsDeclaration,
              getDefinitionDeclaration,
              getJokeDeclaration,
            ],
          },
        ],
      },
    });

    // Check for function calls in the response
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
async function main() {
  const userProblem = readlineSync.question("Ask me anything--->  ");
  await runAgent(userProblem);
  main();
}
main();
