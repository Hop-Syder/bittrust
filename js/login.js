


// Récupération des éléments du DOM
const loginForm = document.getElementById('loginForm');
import { auth, signInWithEmailAndPassword } from './firebase-config.js';
// Utilise auth directement, ne fais pas getAuth() ici !

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page

    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // ✅ Connexion réussie → Redirection vers le profil
        window.location.href = "fr-profil-BC_0725BIT34TRUST549CAPITAL120947.html";
    } catch (error) {
        console.error("Erreur de connexion :", error.message);
        alert("Identifiants invalides ou utilisateur inexistant.");
    }
});


