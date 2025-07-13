// --- Affiche ou cache le champ de date programmée
document.getElementById("executionDate").addEventListener("change", function () {
    const field = document.getElementById("scheduledDateField");
    field.classList.toggle("d-none", this.value !== "date");
});

// --- Soumission du formulaire
document.getElementById("transferForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const virement = {
        type: document.getElementById('beneficiaryType').value,
        iban: document.getElementById('iban').value,
        nom: document.getElementById('beneficiaryName').value,
        montant: document.getElementById('amount').value,
        devise: document.getElementById('currency').value,
        date: document.getElementById('executionDate').value === 'date'
            ? document.getElementById('scheduledDate').value
            : 'Immédiat',
        libelle: document.getElementById('transferLabel').value
    };

    const htmlCard = genererHTMLVirement(virement);
    sauvegarderVirement(htmlCard);

    // Afficher la section et injecter le nouveau virement
    document.getElementById('ordreTransfertSection').style.display = 'flex';
    document.getElementById('ordreDetails').innerHTML += htmlCard;

    // Sauvegarde brute des données (optionnel)
    localStorage.setItem('dernierVirementData', JSON.stringify(virement));

    // Lancer la progression
    demarrerProgression();
});

// --- Générer le HTML du virement
function genererHTMLVirement(v) {
    return `
        <div class="card shadow-sm p-3 mb-3 bg-light border rounded virement-card">
            <p><strong>Bénéficiaire :</strong> ${v.nom} (${v.iban})</p>
            <p><strong>Type :</strong> ${v.type}</p>
            <p><strong>Montant :</strong> ${v.montant} ${v.devise}</p>
            <p><strong>Date d'exécution :</strong> ${v.date}</p>
            <p><strong>Libellé :</strong> ${v.libelle}</p>
            <div class="confirmation-message mt-3 fw-bold text-success" style="display:none;"></div>
        </div>
    `;
}


// --- Sauvegarde cumulative dans localStorage
function sauvegarderVirement(virementHTML) {
    let anciens = JSON.parse(localStorage.getItem('virements')) || [];
    anciens.push(virementHTML);
    localStorage.setItem('virements', JSON.stringify(anciens));
}

// --- Barre de progression jusqu'à 30%
let interval;
function demarrerProgression() {
    let pourcentage = 0;
    const progressBar = document.getElementById('progressBar');
    interval = setInterval(() => {
        if (pourcentage < 30) {
            pourcentage++;
            progressBar.style.width = `${pourcentage}%`;
            progressBar.textContent = `${pourcentage}%`;
        } else {
            clearInterval(interval);
            document.getElementById('pinSection').style.display = 'block';
        }
    }, 100);
}

// --- Valider le PIN
function validerPIN() {
    const pin = document.getElementById('pinInput').value;
    const message = document.getElementById('pinMessage');

    if (pin === 'BT07C37') {
        message.textContent = '';
        continuerProgression();
    } else {
        message.textContent = '❌ Code incorrect. Opération bloquée à 30%.';
    }
}


function continuerProgression() {
    let pourcentage = 30;
    const progressBar = document.getElementById('progressBar');
    interval = setInterval(() => {
        if (pourcentage < 100) {
            pourcentage++;
            progressBar.style.width = `${pourcentage}%`;
            progressBar.textContent = `${pourcentage}%`;
        } else {
            clearInterval(interval);

            // ✅ Ajout de confirmation dans la dernière carte
            const cards = document.querySelectorAll('.virement-card');
            if (cards.length > 0) {
                const lastCard = cards[cards.length - 1];
                const msg = lastCard.querySelector('.confirmation-message');
                if (msg) {
                    msg.style.display = 'block';
                    msg.textContent = "✅ Le transfert a été confirmé et traité avec succès.";
                }
            }
        }
    }, 50);
}


// --- Affichage automatique de l’historique au chargement
window.addEventListener('DOMContentLoaded', () => {
    const virements = JSON.parse(localStorage.getItem('virements'));
    if (virements && virements.length > 0) {
        const ordreSection = document.getElementById('ordreTransfertSection');
        const container = document.getElementById('ordreDetails');
        ordreSection.style.display = 'flex';
        container.innerHTML = '';
        virements.forEach(htmlCard => {
            container.innerHTML += htmlCard;
        });

        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = '100%';
        progressBar.textContent = '100%';

        document.getElementById('pinSection').style.display = 'none';
    }
});

// --- Réinitialiser l’historique
function resetHistorique() {
    if (confirm("Tu veux vraiment effacer tous les transferts ?")) {
        localStorage.removeItem('virements');
        document.getElementById('ordreDetails').innerHTML = '';
        document.getElementById('ordreTransfertSection').style.display = 'none';
    }
}
