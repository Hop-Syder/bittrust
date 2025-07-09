document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault(); // Empêche le rechargement immédiat

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            // Afficher le spinner pendant la connexion
            document.getElementById('spinner').classList.add('show');

            // Connexion Firebase
            firebase.auth().signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Connexion réussie
                    console.log("Connexion réussie :", userCredential.user);

                    // Redirection après succès
                    window.location.href = "fr-profil-BC_0725BIT34TRUST549CAPITAL120947.html";
                })
                .catch((error) => {
                    // Gestion des erreurs
                    console.error("Erreur de connexion :", error.message);
                    alert("Erreur : " + error.message);
                })
                .finally(() => {
                    // Toujours cacher le spinner
                    document.getElementById('spinner').classList.remove('show');
                });
        });
    }
});