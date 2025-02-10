import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCFv_s-yOQAU9uvsX6tV0gM-tcUZKWJ7-c",
    authDomain: "event-scheduler-wdt.firebaseapp.com",
    projectId: "event-scheduler-wdt",
    storageBucket: "event-scheduler-wdt.appspot.com",
    messagingSenderId: "49086247225",
    appId: "1:49086247225:web:8cca8d0e1f62b852fa38e8",
    measurementId: "G-YJPQVVPND0"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };  // ✅ This ensures App.js can import `db`

const eventForm = document.getElementById("event-form");
const eventList = document.getElementById("event-list");

// Add Event to Firestore
eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const eventName = document.getElementById("event-name").value;
    const eventTime = document.getElementById("event-time").value;

    if (!eventName || !eventTime) {
        console.error("Event name or time is missing.");
        return;
    }

    try {
        await addDoc(collection(db, "events"), { name: eventName, time: eventTime });
        console.log("Event added successfully");
    } catch (error) {
        console.error("Error adding event:", error);
    }

    eventForm.reset();
});

// Load and display events from Firestore
onSnapshot(collection(db, "events"), (snapshot) => {
    eventList.innerHTML = ""; // Clear current list
    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;

        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${data.name}</strong> at ${new Date(data.time).toLocaleString()}
            <button onclick="editEvent('${id}', '${data.name}', '${data.time}')">Edit</button>
            <button onclick="deleteEvent('${id}')">Delete</button>
        `;
        eventList.appendChild(li);
    });
});

// Edit an event
window.editEvent = async (id, currentName, currentTime) => {
    const newName = prompt("Edit Event Name:", currentName);
    const newTime = prompt("Edit Event Time (YYYY-MM-DDTHH:MM):", currentTime);

    if (newName && newTime) {
        try {
            const eventDoc = doc(db, "events", id);
            await updateDoc(eventDoc, { name: newName, time: newTime });
            console.log("Event updated successfully");
        } catch (error) {
            console.error("Error updating event:", error);
        }
    } else {
        alert("Both name and time are required to update the event.");
    }
};

// Delete an event
window.deleteEvent = async (id) => {
    if (confirm("Are you sure you want to delete this event?")) {
        try {
            await deleteDoc(doc(db, "events", id));
            console.log("Event deleted successfully");
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    }
};
