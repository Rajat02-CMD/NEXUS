
import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "firebase/auth";

const userProfile = document.getElementById("user-profile");

onAuthStateChanged(auth, (user) => {
    if (!userProfile) return;

    if (user) {
        const displayName = user.displayName || user.email || "User";
        const initial = displayName.charAt(0).toUpperCase();

        userProfile.innerHTML = `
            <div class="profile-avatar">${initial}</div>
            <div class="profile-details">
                <span class="profile-name"></span>
                <small>Signed in</small>
            </div>
            <button type="button" class="nav-logout" id="logout-btn">
                Logout
            </button>
        `;

        userProfile.querySelector(".profile-name").textContent =
            displayName;

        document.getElementById("logout-btn").addEventListener("click", async () => {
            try {
                await signOut(auth);
                window.location.reload();
            } catch (error) {
                console.error("Logout error:", error);
                alert("Logout failed. Please try again.");
            }
        });
    } else {
        userProfile.innerHTML = `
            <a href="./login.html" class="nav-login">Login</a>
            <a href="./login.html?mode=signup" class="nav-signup">Sign Up</a>
        `;
    }
});
