import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";
import { db } from "./script.js"; // Ensure `db` is exported in script.js

let apiKey = null;
let genAI = null;
let model = null;

// 🔥 Get API key from Firestore
async function getApiKey() {
    try {
        console.log("Fetching API key from Firestore...");
        let snapshot = await getDoc(doc(db, "apikey", "googlegenai"));
        if (!snapshot.exists()) {
            console.error("API key not found in Firestore.");
            return;
        }
        apiKey = snapshot.data().key;
        console.log("API Key Retrieved:", apiKey);

        // Initialize Google AI Model
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } catch (error) {
        console.error("Error retrieving API key:", error);
    }
}

// 🔍 Debugging Firestore CORS Issues
async function testFirestoreConnection() {
    try {
        let response = await fetch("https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents/apikey/googlegenai");
        let data = await response.json();
        console.log("Firestore Connection Test:", data);
    } catch (error) {
        console.error("Firestore API blocked by CORS:", error);
    }
}
testFirestoreConnection();

async function askChatBot(request) {
    if (!model) {
        await getApiKey();
    }
    try {
        console.log("Sending request to AI:", request);
        let response = await model.generateContent(request);
        console.log("Full AI Response:", JSON.stringify(response, null, 2));

        let messageText = response?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "Error: AI response format incorrect.";
        console.log("Extracted AI Message:", messageText);
        return messageText;
    } catch (error) {
        console.error("Error communicating with AI:", error);
        return "Error: Unable to generate response.";
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    appendMessage("Hello! If you need help with creating events, type 'help'.");
    await getApiKey(); // Load API Key on Page Load
});

document.getElementById("send-btn").addEventListener("click", async () => {
    let input = document.getElementById("chat-input").value.trim().toLowerCase();
    if (input) {
        let response = await askChatBot(input);
        appendMessage(response);
    } else {
        appendMessage("Please enter a prompt.");
    }
});
