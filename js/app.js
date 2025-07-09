>
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDVycudiPGxEe60Ulw8991VUUj8_n8uJn8",
    authDomain: "data-bittrust.firebaseapp.com",
    projectId: "data-bittrust",
    storageBucket: "data-bittrust.firebasestorage.app",
    messagingSenderId: "279615547784",
    appId: "1:279615547784:web:624a233334d4a6b382f23d",
    measurementId: "G-YF9R0XJLY9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
