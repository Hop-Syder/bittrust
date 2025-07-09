// /js/ordres.js
import {
    auth,
    db,
    collection,
    addDoc,
    onAuthStateChanged,
    query,
    where,
    onSnapshot
} from './firebase-config.js';

// Vérifie si l'utilisateur est connecté
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "connexion.html";
    } else {
        // Affiche les infos utilisateur
        document.getElementById("profile-name").textContent = user.displayName || "Utilisateur";
        document.getElementById("profile-email").textContent = user.email;

        // Charge les ordres existants
        loadExistingOrders(user.uid);

        // Gestion du formulaire d'ordre
        setupOrderForm(user);
    }
});

function setupOrderForm(user) {
    const orderForm = document.getElementById("orderForm");
    if (!orderForm) return;

    orderForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Récupère les valeurs du formulaire
        const type = document.getElementById("orderType").value;
        const asset = document.getElementById("assetSelect").value;
        const amount = document.getElementById("amountInput").value;
        const limit = document.getElementById("limitInput").value;
        const currency = document.getElementById("amountCurrency").textContent;

        // Validation basique
        if (!amount || isNaN(amount) {
            alert("Veuillez entrer un montant valide");
            return;
        }

        // Afficher le loader
        const submitBtn = orderForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Traitement...';
        submitBtn.disabled = true;

        // Créer et afficher le modal de confirmation
        const confirmationModal = createConfirmationModal({
            type,
            asset,
            amount,
            currency,
            limit
        });

        try {
            // Attendre la confirmation
            const isConfirmed = await new Promise(resolve => {
                confirmationModal.querySelector('#confirmOrderBtn').addEventListener('click', () => resolve(true));
                confirmationModal.querySelector('#cancelOrderBtn').addEventListener('click', () => resolve(false));
            });

            if (!isConfirmed) {
                throw new Error("Annulé par l'utilisateur");
            }

            // Demander le PIN
            const pin = prompt("Entrez votre code PIN à 6 chiffres :");
            if (pin !== "BT7C94") {
                throw new Error("PIN incorrect");
            }

            updateProgress(30, "Enregistrement de l'ordre...");

            // Enregistrement dans Firebase
            const docRef = await addDoc(collection(db, "orders"), {
                userId: user.uid,
                type,
                asset,
                amount: parseFloat(amount),
                limit: limit ? parseFloat(limit) : null,
                currency,
                status: "pending",
                timestamp: new Date()
            });

            updateProgress(70, "Ordre enregistré !");
            await new Promise(resolve => setTimeout(resolve, 500));

            updateProgress(100, "Ordre complété avec succès !");
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Réinitialiser le formulaire
            orderForm.reset();

        } catch (error) {
            console.error("Erreur:", error);

            if (error.message === "PIN incorrect") {
                // Blocage temporaire en cas de PIN incorrect
                submitBtn.innerHTML = '<i class="fas fa-lock me-2"></i> Code PIN incorrect (30s)';
                let seconds = 30;
                const countdown = setInterval(() => {
                    seconds--;
                    submitBtn.innerHTML = `<i class="fas fa-lock me-2"></i> Code PIN incorrect (${seconds}s)`;
                    if (seconds <= 0) {
                        clearInterval(countdown);
                        submitBtn.innerHTML = originalBtnText;
                        submitBtn.disabled = false;
                    }
                }, 1000);
            } else {
                alert(error.message === "Annulé par l'utilisateur"
                    ? "Ordre annulé"
                    : "Erreur lors de l'enregistrement. Veuillez réessayer.");
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        }
    });
}

function loadExistingOrders(userId) {
    const q = query(collection(db, "orders"),
        where("userId", "==", userId),
        where("status", "==", "pending"));

    onSnapshot(q, (snapshot) => {
        const container = document.querySelector(".orders-container");
        container.innerHTML = ''; // Nettoyer avant de recharger

        if (snapshot.empty) {
            container.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-exchange-alt"></i>
                    <h4 class="mt-3" style="color: #fff;">Aucun ordre en cours</h4>
                    <p style="color: #fff;">Vos ordres actifs apparaîtront ici</p>
                </div>
            `;
            return;
        }

        snapshot.forEach((doc) => {
            const order = doc.data();
            createOrderCard({
                id: doc.id,
                type: order.type,
                asset: order.asset,
                amount: order.amount.toString(),
                limit: order.limit ? order.limit.toString() : null,
                currency: order.currency,
                status: order.status
            });
        });
    });
}

function createOrderCard(order) {
    const container = document.querySelector(".orders-container");
    const noOrders = container.querySelector(".no-orders");

    if (noOrders) noOrders.remove();

    const orderCard = document.createElement("div");
    orderCard.className = `order-card ${order.type} bg-dark p-3 mb-2 rounded animate__animated animate__fadeIn`;
    orderCard.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <strong style="color: #fff;">${getOrderTypeLabel(order.type)}</strong> - ${order.asset}
            </div>
            <span class="badge ${getStatusBadgeClass(order.status)}">
                ${getStatusLabel(order.status)}
            </span>
        </div>
        <p class="mb-0 text-muted">Montant: ${order.amount} ${order.currency}</p>
        ${order.limit ? `<p class="mb-0 text-muted">Limite: ${order.limit} ${order.currency}</p>` : ''}
        <p class="mb-0 text-muted small">${new Date(order.timestamp?.toDate() || new Date()).toLocaleString()}</p>
    `;
    container.appendChild(orderCard);
}

function createConfirmationModal(orderDetails) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'orderConfirmationModal';
    modal.tabIndex = '-1';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">Confirmer l'ordre</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="order-summary">
                        <p><strong>Type:</strong> ${getOrderTypeLabel(orderDetails.type)}</p>
                        <p><strong>Actif:</strong> ${orderDetails.asset}</p>
                        <p><strong>Montant:</strong> ${orderDetails.amount} ${orderDetails.currency}</p>
                        ${orderDetails.limit ? `<p><strong>Prix limite:</strong> ${orderDetails.limit} ${orderDetails.currency}</p>` : ''}
                    </div>
                    <div class="progress mt-3" style="height: 6px; display: none;">
                        <div id="orderProgressBar" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%"></div>
                    </div>
                    <p id="progressText" class="text-muted small mt-2" style="display: none;"></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelOrderBtn" data-bs-dismiss="modal">Annuler</button>
                    <button type="button" class="btn btn-primary" id="confirmOrderBtn">Confirmer</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    // Nettoyer le modal après fermeture
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });

    return modal;
}

function updateProgress(percent, message) {
    const progressBar = document.getElementById('orderProgressBar');
    const progressContainer = progressBar?.parentElement;
    const progressText = document.getElementById('progressText');

    if (progressBar && progressText) {
        progressContainer.style.display = 'block';
        progressText.style.display = 'block';
        progressBar.style.width = `${percent}%`;
        progressText.textContent = message;
    }
}

function getOrderTypeLabel(type) {
    const types = {
        'buy': 'Achat',
        'sell': 'Vente',
        'transfer': 'Transfert',
        'limit': 'Prêt'
    };
    return types[type] || type;
}

function getStatusLabel(status) {
    const statuses = {
        'pending': 'En cours',
        'completed': 'Complété',
        'failed': 'Échec'
    };
    return statuses[status] || status;
}

function getStatusBadgeClass(status) {
    const classes = {
        'pending': 'bg-primary',
        'completed': 'bg-success',
        'failed': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
}
