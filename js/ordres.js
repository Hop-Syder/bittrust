// /js/ordres.js
import { auth, db, collection, addDoc, onAuthStateChanged } from './firebase-config.js';

// Vérifie si l'utilisateur est connecté
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "connexion.html"; // Redirige si non connecté
    } else {
        // Injecte les données utilisateur dans le DOM
        document.getElementById("profile-name").textContent = user.displayName || "Utilisateur";
        document.getElementById("profile-email").textContent = user.email;

        // Gestion du formulaire d'ordre
        const orderForm = document.getElementById("orderForm");
        if (orderForm) {
            orderForm.addEventListener("submit", async function (e) {
                e.preventDefault();

                // Récupère les valeurs du formulaire
                const type = document.getElementById("orderType").value;
                const asset = document.getElementById("assetSelect").value;
                const amount = document.getElementById("amountInput").value;
                const limit = document.getElementById("limitInput").value;

                // Demande du PIN (test actuel avec 123456)
                const pin = prompt("Entrez votre code PIN à 6 chiffres :");

                // Simule une vérification du PIN
                if (pin === "BT7C94") {
                    try {
                        // Enregistrement dans Firestore
                        await addDoc(collection(db, "orders"), {
                            userId: user.uid,
                            type,
                            asset,
                            amount: parseFloat(amount),
                            limit: limit ? parseFloat(limit) : null,
                            status: "pending",
                            timestamp: new Date()
                        });

                        alert("Ordre passé avec succès !");
                        updateOrderList({ type, asset, amount }); // Met à jour l'affichage
                    } catch (error) {
                        console.error("Erreur lors de l'enregistrement :", error);
                        alert("Une erreur s'est produite. Réessayez.");
                    }
                } else {
                    alert("Code PIN incorrect.");
                }
            });
        }
    }
});

// Fonction pour afficher les ordres en temps réel
function updateOrderList(order) {
    const container = document.querySelector(".orders-container");

    // Supprime le message "Aucun ordre"
    const noOrders = container.querySelector(".no-orders");
    if (noOrders) noOrders.remove();

    // Création de la carte d'ordre
    const orderCard = document.createElement("div");
    orderCard.className = "order-card bg-dark p-3 mb-2 rounded animate__animated animate__fadeInUp";
    orderCard.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <strong style="color: #fff;">${order.type}</strong> - ${order.asset}
            </div>
            <span class="badge bg-primary">En cours</span>
        </div>
        <p class="mb-0 text-muted">Montant: ${order.amount} ${document.getElementById("amountCurrency").textContent}</p>
    `;
    container.appendChild(orderCard);
}