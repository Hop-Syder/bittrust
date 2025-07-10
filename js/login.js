// login.js
import { auth } from '../firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log('Connexion réussie:', userCredential.user);
                window.location.href = 'fr-profil-BC_0725BIT34TRUST549CAPITAL120947.html';
            } catch (error) {
                console.error('Erreur de connexion:', error.code, error.message);

                let errorMessage = "Erreur de connexion";
                switch (error.code) {
                    case 'auth/invalid-email':
                        errorMessage = "Email invalide";
                        break;
                    case 'auth/user-disabled':
                        errorMessage = "Compte désactivé";
                        break;
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        errorMessage = "Email ou mot de passe incorrect";
                        break;
                    default:
                        errorMessage = error.message;
                }

                alert(errorMessage);
            }
        });
    }
});