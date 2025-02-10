import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";
import { getDoc, doc, collection, addDoc, updateDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";
import { db } from "./script.js"; // Ensure `db` is exported in script.js

let apiKey = null, genAI = null, model = null;

async function getApiKey() {
    let snapshot = await getDoc(doc(db, "apikey", "googlegenai"));
    if (!snapshot.exists()) {
        console.error("API key not found in Firestore.");
        return;
    }
    apiKey = snapshot.data().key;
    console.log("API Key Retrieved:", apiKey);
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

async function askChatBot(request) {
    if (!model) {
        await getApiKey();
    }
    try {
        console.log("Sending request to AI:", request);
        let response = await model.generateContent(request);
        console.log("Full AI Response:", JSON.stringify(response, null, 2));

        // Correct response extraction
        let messageText = response?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "Error: AI response format incorrect.";

        console.log("Extracted AI Message:", messageText);
        return messageText;
    } catch (error) {
        console.error("Error communicating with AI:", error);
        return "Error: Unable to generate response.";
    }
}

function parseEventDetails(input) {
    let match = input.match(/create an event called (.+?) at (\d{1,2}:\d{2}\s*[apm]*) on ([\w\s\d]+)/i);
    if (match) {
        return { name: match[1].trim(), time: `${match[3].trim()} ${match[2].trim()}` };
    }
    return null;
}

async function ruleChatBot(request) {
    request = request.toLowerCase();

    if (request === "help") {
        appendMessage("Here are some commands you can use:");
        appendMessage("- **Schedule an event:** 'schedule event called Meeting at 3:00 PM on Monday'");
        appendMessage("- **Edit an event:** 'edit event Meeting to Team Sync at 4:00 PM on Tuesday'");
        appendMessage("- **Delete an event:** 'delete event Team Sync'");
        return true;
    }

    if (request.startsWith("schedule event")) {
        let details = parseEventDetails(request);
        if (details) {
            await addEvent(details.name, details.time);
            appendMessage(`Event '${details.name}' scheduled for ${details.time}.`);
        } else {
            appendMessage("Could not understand the event details.");
        }
        return true;
    }

    if (request.startsWith("delete event")) {
        let eventName = request.replace("delete event", "").trim();
        if (eventName) {
            let deleted = await deleteEventByName(eventName);
            appendMessage(deleted ? `Event '${eventName}' has been deleted.` : `No event found named '${eventName}'.`);
        } else {
            appendMessage("Please specify an event to delete.");
        }
        return true;
    }

    if (request.startsWith("edit event")) {
        let match = request.match(/edit event (.+) to (.+) at (\d{1,2}:\d{2}\s*[apm]*) on ([\w\s\d]+)/i);
        if (match) {
            let oldName = match[1].trim();
            let newName = match[2].trim();
            let newTime = `${match[4]} ${match[3]}`;
            let updated = await editEventByName(oldName, newName, newTime);
            appendMessage(updated ? `Event '${oldName}' updated to '${newName}' at ${newTime}.` : `No event found named '${oldName}'.`);
        } else {
            appendMessage("Could not understand the edit request.");
        }
        return true;
    }
    return false;
}

async function addEvent(name, time) {
    try {
        await addDoc(collection(db, "events"), { name, time });
    } catch (error) {
        console.error("Error adding event:", error);
    }
}

async function deleteEventByName(name) {
    const querySnapshot = await getDocs(collection(db, "events"));
    for (let docSnap of querySnapshot.docs) {
        if (docSnap.data().name.toLowerCase() === name.toLowerCase()) {
            await deleteDoc(doc(db, "events", docSnap.id));
            return true;
        }
    }
    return false;
}

async function editEventByName(oldName, newName, newTime) {
    const querySnapshot = await getDocs(collection(db, "events"));
    for (let docSnap of querySnapshot.docs) {
        if (docSnap.data().name.toLowerCase() === oldName.toLowerCase()) {
            await updateDoc(doc(db, "events", docSnap.id), { name: newName, time: newTime });
            return true;
        }
    }
    return false;
}

function appendMessage(message) {
    let chatHistory = document.getElementById("chat-history");
    let messageDiv = document.createElement("div");
    messageDiv.textContent = message;
    messageDiv.className = 'history';
    chatHistory.appendChild(messageDiv);
    document.getElementById("chat-input").value = "";
}

// Display initial chatbot message
document.addEventListener("DOMContentLoaded", () => {
    appendMessage("Hello! If you need help with creating events, type 'help'.");
});

document.getElementById("send-btn").addEventListener("click", async () => {
    let input = document.getElementById("chat-input").value.trim().toLowerCase();
    if (input) {
        if (!await ruleChatBot(input)) {
            let response = await askChatBot(input);
            appendMessage(response);
        }
    } else {
        appendMessage("Please enter a prompt.");
    }
});
