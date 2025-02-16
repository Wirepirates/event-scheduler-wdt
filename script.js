import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";

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

// Initialize Firebase and Services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };

// Authentication Elements
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const logoutBtnMain = document.getElementById("logout-btn-main");
const biometricBtn = document.getElementById("biometric-btn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authContainer = document.getElementById("auth-container");
const appContainer = document.getElementById("app-container");

// Handle Login
loginBtn.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in");
    } catch (error) {
        alert("Login Failed: " + error.message);
    }
});

async function registerBiometricCredential() {
    if (!window.PublicKeyCredential) {
        alert("Your browser does not support WebAuthn.");
        return;
    }

    try {
        // Generate a random challenge
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const publicKeyOptions = {
            challenge: challenge,
            rp: {
                name: "Event Scheduler",
                id: window.location.hostname,
            },
            user: {
                id: new Uint8Array(16), // User ID (should be a real unique ID)
                name: emailInput.value,
                displayName: emailInput.value,
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ECDSA w/ SHA-256
            authenticatorSelection: {
                authenticatorAttachment: "platform", // Use built-in authenticators
                userVerification: "required",
            },
            timeout: 60000,
        };

        const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });

        if (credential) {
            console.log("Passkey registered successfully:", credential);
            alert("Passkey registered! You can now use it to log in.");
        }
    } catch (error) {
        console.error("Passkey registration failed:", error);
        alert("Failed to register passkey.");
    }
}

document.getElementById("signup-btn").addEventListener("click", registerBiometricCredential);
// Handle Signup
signupBtn.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log("User signed up");
    } catch (error) {
        alert("Signup Failed: " + error.message);
    }
});


logoutBtnMain.addEventListener("click", async () => {
    try {
        await signOut(auth);
        console.log("User signed out");

        // Reset UI after logout
        authContainer.style.display = "block";
        appContainer.style.display = "none";
    } catch (error) {
        console.error("Sign-out error:", error);
    }
});


// Check Auth State
onAuthStateChanged(auth, (user) => {
    if (user) {
        authContainer.style.display = "none";
        appContainer.style.display = "block";
        logoutBtnMain.style.display = "block"; // ✅ FIXED
    } else {
        authContainer.style.display = "block";
        appContainer.style.display = "none";
        logoutBtnMain.style.display = "none"; // ✅ FIXED
    }
});


// Biometric Authentication
biometricBtn.addEventListener("click", async () => {
    if (!window.PublicKeyCredential) {
        alert("Your browser does not support WebAuthn.");
        return;
    }

    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const assertionOptions = {
            challenge: challenge,
            allowCredentials: [],
            userVerification: "required",
        };

        const credential = await navigator.credentials.get({ publicKey: assertionOptions });

        if (credential) {
            console.log("Biometric login successful:", credential);
            alert("Biometric authentication successful!");
            authContainer.style.display = "none";
            appContainer.style.display = "block";
            logoutBtnMain.style.display = "block";
        }
    } catch (error) {
        console.error("Biometric authentication failed:", error);
        alert("Failed to authenticate with biometrics.");
    }
});

// Event Management
const eventForm = document.getElementById("event-form");
const eventList = document.getElementById("event-list");

// Populate Time Dropdowns
document.addEventListener("DOMContentLoaded", function () {
    const hourSelector = document.getElementById("hour-selector");
    const minuteSelector = document.getElementById("minute-selector");

    if (hourSelector && minuteSelector) {
        for (let i = 0; i < 24; i++) {
            let hour = document.createElement("option");
            hour.value = i.toString().padStart(2, "0");
            hour.textContent = i.toString().padStart(2, "0");
            hourSelector.appendChild(hour);
        }

        for (let i = 0; i < 60; i++) {
            let minute = document.createElement("option");
            minute.value = i.toString().padStart(2, "0");
            minute.textContent = i.toString().padStart(2, "0");
            minuteSelector.appendChild(minute);
        }
    }
});

// Handle Event Submission
eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const eventName = document.getElementById("event-name").value;
    const eventDate = document.getElementById("event-date").value;
    const eventHour = document.getElementById("hour-selector").value;
    const eventMinute = document.getElementById("minute-selector").value;

    if (!eventName || !eventDate || eventHour === "" || eventMinute === "") {
        alert("Please fill in all fields.");
        return;
    }

    const eventTime = `${eventDate}T${eventHour}:${eventMinute}:00`;
    try {
        await addDoc(collection(db, "events"), { name: eventName, time: eventTime });
        console.log("Event added successfully:", eventName, eventTime);
    } catch (error) {
        console.error("Error adding event:", error);
    }

    eventForm.reset();
});

// Display Events from Firestore
onSnapshot(collection(db, "events"), (snapshot) => {
    eventList.innerHTML = "";
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

// Edit Event
window.editEvent = async (id, currentName, currentTime) => {
    const newName = prompt("Edit Event Name:", currentName);
    const newTime = prompt("Edit Event Time (YYYY-MM-DDTHH:MM):", currentTime);

    if (newName && newTime) {
        try {
            await updateDoc(doc(db, "events", id), { name: newName, time: newTime });
            console.log("Event updated successfully");
        } catch (error) {
            console.error("Error updating event:", error);
        }
    } else {
        alert("Both name and time are required to update the event.");
    }
};

// Delete Event
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
