// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVycudiPGxEe60Ulw8991VUUj8_n8uJn8",
  authDomain: "data-bittrust.firebaseapp.com",
  projectId: "data-bittrust",
  storageBucket: "data-bittrust.appspot.com",
  messagingSenderId: "279615547784",
  appId: "1:279615547784:web:624a233334d4a6b382f23d",
  measurementId: "G-YF9R0XJLY9"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };