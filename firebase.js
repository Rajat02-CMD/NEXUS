
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAQZV_cUZzufyLsB15CDyat2S-zqhyq5mA",
    authDomain: "nexus-ddc87.firebaseapp.com",
    projectId: "nexus-ddc87",
    storageBucket: "nexus-ddc87.firebasestorage.app",
    messagingSenderId: "574702716211",
    appId: "1:574702716211:web:d9312372d14c70290aaa46",
    measurementId: "G-JL53YCP9SX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("NEXUS Firebase initialized successfully!");
