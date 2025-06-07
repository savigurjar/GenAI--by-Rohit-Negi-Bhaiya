
import { GoogleGenAI } from "@google/genai";
import readlineSync from "readline-sync";

const ai = new GoogleGenAI({ apiKey: "AIzaSyBLFDjOagIDXZn88SEaE1EmY4dv4lmRyhk" });



async function Chating() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    // contents: "Explain about BTS?",
    contents: [
        {
            role: 'user',
            parts:[{text:"hii,i am savi"}]
        },
        {
            role: 'model',
            parts:[{text:"Hi Savi! It's nice to meet you. How can I help you today?"}]
        },{
            role: 'user',
            parts:[{text:"I want to know about BTS?"}]
        }
    ],
  });
  console.log(response.text);
}

await main();