import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCFv_s-yOQAU9uvsX6tV0gM-tcUZKWJ7-c",
    authDomain: "event-scheduler-wdt.firebaseapp.com",
    databaseURL: "https://event-scheduler-wdt-default-rtdb.firebaseio.com",
    projectId: "event-scheduler-wdt",
    storageBucket: "event-scheduler-wdt.appspot.com",
    messagingSenderId: "49086247225",
    appId: "1:49086247225:web:8cca8d0e1f62b852fa38e8",
    measurementId: "G-YJPQVVPND0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const eventForm = document.getElementById("event-form");
const eventList = document.getElementById("event-list");

// Add Event to Firebase
eventForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const eventName = document.getElementById("event-name").value;
    const eventTime = document.getElementById("event-time").value;

    if (!eventName || !eventTime) {
        console.error("Event name or time is missing.");
        return;
    }

    const eventRef = ref(db, "events");
    push(eventRef, { name: eventName, time: eventTime })
        .then(() => console.log("Event added successfully"))
        .catch((error) => console.error("Error adding event:", error));

    eventForm.reset();
});

// Load and display events from Firebase
const eventRef = ref(db, "events");
onValue(eventRef, (snapshot) => {
    eventList.innerHTML = ""; // Clear current list
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const key = childSnapshot.key;
            const data = childSnapshot.val();

            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${data.name}</strong> at ${new Date(data.time).toLocaleString()}
                <button onclick="editEvent('${key}', '${data.name}', '${data.time}')">Edit</button>
                <button onclick="deleteEvent('${key}')">Delete</button>
            `;
            eventList.appendChild(li);
        });
    } else {
        console.warn("No events found in the database.");
    }
});

// Edit an event
window.editEvent = (key, currentName, currentTime) => {
    const newName = prompt("Edit Event Name:", currentName);
    const newTime = prompt("Edit Event Time (YYYY-MM-DDTHH:MM):", currentTime);

    if (newName && newTime) {
        const eventToUpdate = ref(db, `events/${key}`);
        update(eventToUpdate, { name: newName, time: newTime })
            .then(() => console.log("Event updated successfully"))
            .catch((error) => console.error("Error updating event:", error));
    } else {
        alert("Both name and time are required to update the event.");
    }
};

// Delete an event
window.deleteEvent = (key) => {
    if (confirm("Are you sure you want to delete this event?")) {
        const eventToDelete = ref(db, `events/${key}`);
        remove(eventToDelete)
            .then(() => console.log("Event deleted successfully"))
            .catch((error) => console.error("Error deleting event:", error));
    }
};