
import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from "firebase/auth";

import {
    doc,
    setDoc,
    collection,
    addDoc,
    serverTimestamp
} from "firebase/firestore";

// Save or update the user's profile
async function saveUserProfile(user, name = "") {
    await setDoc(
        doc(db, "users", user.uid),
        {
            uid: user.uid,
            name: name || user.displayName || "",
            email: user.email || "",
            updatedAt: serverTimestamp()
        },
        { merge: true }
    );
}

// Save a login activity record
async function saveLoginLog(user, method = "email") {
    await addDoc(collection(db, "loginLogs"), {
        uid: user.uid,
        email: user.email || "",
        method: method,
        timestamp: serverTimestamp()
    });
}

// Save activity without blocking successful authentication
async function saveActivity(user, method, name = "") {
    try {
        await saveUserProfile(user, name);
        await saveLoginLog(user, method);
    } catch (error) {
        console.error("Could not save Firebase activity:", error);
    }
}

// Form elements
const authForm = document.getElementById("auth-form");
const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submit-btn");
const googleBtn = document.getElementById("google-btn");
const authMessage = document.getElementById("auth-message");

let isSignup = false;
let isBusy = false;

function showMessage(text, isError = false) {
    authMessage.textContent = text;
    authMessage.style.color = isError ? "#fca5a5" : "#86efac";
}

function setLoading(loading) {
    isBusy = loading;
    submitBtn.disabled = loading;
    googleBtn.disabled = loading;
    loginTab.disabled = loading;
    signupTab.disabled = loading;

    submitBtn.textContent = loading
        ? "Please wait..."
        : isSignup ? "Create Account" : "Login";
}

function setMode(signup) {
    isSignup = signup;

    nameInput.hidden = !signup;
    nameInput.required = signup;

    passwordInput.autocomplete = signup
        ? "new-password"
        : "current-password";

    loginTab.classList.toggle("active", !signup);
    signupTab.classList.toggle("active", signup);

    showMessage("");
    setLoading(false);
}

loginTab.addEventListener("click", () => setMode(false));
signupTab.addEventListener("click", () => setMode(true));

function getFriendlyError(error) {
    const messages = {
        "auth/email-already-in-use":
            "This email is already registered. Please log in.",
        "auth/invalid-email":
            "Please enter a valid email address.",
        "auth/invalid-credential":
            "Incorrect email or password.",
        "auth/weak-password":
            "Choose a stronger password with at least 6 characters.",
        "auth/popup-closed-by-user":
            "Google sign-in was cancelled.",
        "auth/popup-blocked":
            "Your browser blocked the popup. Allow popups and try again.",
        "auth/network-request-failed":
            "Network error. Check your internet connection.",
        "auth/too-many-requests":
            "Too many attempts. Please try again later.",
        "auth/operation-not-allowed":
            "This sign-in method is not enabled in Firebase."
    };

    return messages[error.code] || error.message ||
        "Something went wrong. Please try again.";
}

// Email/password signup and login
authForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (isBusy) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const name = nameInput.value.trim();

    if (isSignup && !name) {
        showMessage("Please enter your name.", true);
        nameInput.focus();
        return;
    }

    setLoading(true);
    showMessage("");

    try {
        let user;

        if (isSignup) {
            const result = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            user = result.user;

            await updateProfile(user, {
                displayName: name
            });

            await saveActivity(user, "email_signup", name);
        } else {
            const result = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            user = result.user;

            await saveActivity(user, "email_login");
        }

        showMessage("Success! Opening NEXUS...");
        window.location.replace("./index.html");

    } catch (error) {
        console.error("Authentication error:", error);
        showMessage(getFriendlyError(error), true);
        setLoading(false);
    }
});

// Google login
googleBtn.addEventListener("click", async () => {
    if (isBusy) return;

    setLoading(true);
    showMessage("");

    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        await saveActivity(user, "google_login");

        showMessage("Google sign-in successful! Opening NEXUS...");
        window.location.replace("./index.html");

    } catch (error) {
        console.error("Google sign-in error:", error);
        showMessage(getFriendlyError(error), true);
        setLoading(false);
    }
});

// Open signup mode when URL contains ?mode=signup
const params = new URLSearchParams(window.location.search);

if (params.get("mode") === "signup") {
    setMode(true);
}
