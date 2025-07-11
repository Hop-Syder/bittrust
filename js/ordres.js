// ordres-firebase.js
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
    const orderTypeSelect = document.getElementById('orderType');
    const assetSelect = document.getElementById('assetSelect');
    const amountInput = document.getElementById('amountInput');
    const limitInput = document.getElementById('limitInput');
    const form = document.querySelector('form');
    const ordersContainer = document.querySelector('.orders-container');

    const allOptions = [
        { value: 'btc', text: 'Bitcoin (BTC)' },
        { value: 'eth', text: 'Ethereum (ETH)' },
        { value: 'usdt', text: 'Tether (USDT)' },
        { value: 'eur', text: 'Euro (EUR)' },
        { value: 'usd', text: 'Dollar (USD)' },
        { value: 'gbp', text: 'Livre Sterling (GBP)' }
    ];

    onAuthStateChanged(auth, user => {
        if (user) {
            const userId = user.uid;
            setupOrderForm(userId);
            loadUserOrders(userId);
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

    document.querySelectorAll('.order-type-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            console.log(`Filtrer les ordres par type: ${this.dataset.type}`);
        });
    });

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

    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', function () {
            if (!this.classList.contains('active')) {
                document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    updateFormFields();
});
