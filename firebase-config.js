// Importation des modules Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js ";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js ";
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js ';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js ';


// Configuration Firebase (depuis la console Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyDVycudiPGxEe60Ulw8991VUUj8_n8uJn8",
    authDomain: "data-bittrust.firebaseapp.com",
    projectId: "data-bittrust",
    storageBucket: "data-bittrust.firebasestorage.app",
    messagingSenderId: "279615547784",
    appId: "1:279615547784:web:624a233334d4a6b382f23d",
    measurementId: "G-YF9R0XJLY9"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
    auth,
    db,
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    onAuthStateChanged
};
// Exporter l'authentification pour l'utiliser dans login.js
window.auth = auth;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;