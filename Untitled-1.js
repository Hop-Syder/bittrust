document.addEventListener('DOMContentLoaded', function () {
    // Stockage des données
    let beneficiaries = JSON.parse(localStorage.getItem('beneficiaries')) || [];
    let transfers = JSON.parse(localStorage.getItem('transfers')) || [];

    // Initialisation
    initBeneficiaryList();
    setupEventListeners();

    // Fonctions d'initialisation
    function initBeneficiaryList() {
        const listContainer = document.getElementById('beneficiariesList');
        const noBenefMsg = listContainer.querySelector('.no-beneficiaries');

        if (beneficiaries.length > 0) {
            noBenefMsg.classList.add('d-none');
            renderBeneficiariesList();
        }
    }

    function renderBeneficiariesList() {
        const listContainer = document.getElementById('beneficiariesList');
        const template = document.getElementById('beneficiaryTemplate');

        // Nettoyer la liste
        Array.from(listContainer.children).forEach(child => {
            if (!child.classList.contains('no-beneficiaries') && child.id !== 'beneficiaryTemplate') {
                child.remove();
            }
        });

        // Ajouter chaque bénéficiaire
        beneficiaries.forEach(beneficiary => {
            const clone = template.cloneNode(true);
            clone.id = '';
            clone.classList.remove('d-none');

            clone.querySelector('.beneficiary-name').textContent = beneficiary.name;
            clone.querySelector('.beneficiary-iban').textContent = formatIBAN(beneficiary.iban);
            clone.querySelector('.beneficiary-type').textContent = beneficiary.type === 'external' ? 'Externe' : 'BitTrust';

            clone.querySelector('.use-beneficiary-btn').addEventListener('click', () => {
                fillBeneficiaryForm(beneficiary);
            });

            listContainer.appendChild(clone);
        });
    }

    function fillBeneficiaryForm(beneficiary) {
        document.getElementById('beneficiaryType').value = beneficiary.type;
        document.getElementById('iban').value = beneficiary.iban;
        document.getElementById('beneficiaryName').value = beneficiary.name;
    }

    function setupEventListeners() {
        // Changement type bénéficiaire
        document.getElementById('beneficiaryType').addEventListener('change', function () {
            const isExternal = this.value === 'external';
            document.getElementById('externalBeneficiaryField').classList.toggle('d-none', !isExternal);
            document.getElementById('externalBeneficiaryNameField').classList.toggle('d-none', !isExternal);
        });

        // Changement date exécution
        document.getElementById('executionDate').addEventListener('change', function () {
            document.getElementById('scheduledDateField').classList.toggle('d-none', this.value !== 'date');
        });

        // Formatage IBAN
        document.getElementById('iban')?.addEventListener('input', function () {
            formatIBANField(this);
        });
        document.getElementById('beneficiaryIban')?.addEventListener('input', function () {
            formatIBANField(this);
        });

        // Soumission formulaire virement
        document.getElementById('transferForm').addEventListener('submit', function (e) {
            e.preventDefault();
            executeTransfer();
        });

        // Changement type bénéficiaire (modal)
        document.getElementById('newBeneficiaryType').addEventListener('change', function () {
            const type = this.value;
            document.getElementById('internalAccountField').classList.toggle('d-none', type !== 'internal');
            document.getElementById('externalAccountFields').classList.toggle('d-none', type !== 'external');
        });

        // Sauvegarde bénéficiaire
        document.getElementById('saveBeneficiaryBtn').addEventListener('click', saveNewBeneficiary);
    }

    // Fonctions utilitaires
    function formatIBAN(iban) {
        return iban.replace(/(.{4})/g, '$1 ').trim();
    }

    function formatIBANField(field) {
        const cursorPos = field.selectionStart;
        const cleanedValue = field.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        let formattedValue = '';

        for (let i = 0; i < cleanedValue.length; i++) {
            if (i > 0 && i % 4 === 0) formattedValue += ' ';
            formattedValue += cleanedValue[i];
        }

        field.value = formattedValue;
        field.setSelectionRange(cursorPos, cursorPos);
    }

    function saveNewBeneficiary() {
        const type = document.getElementById('newBeneficiaryType').value;
        const name = type === 'internal'
            ? document.getElementById('internalAccountId').value
            : document.getElementById('beneficiaryName').value;
        const iban = type === 'external'
            ? document.getElementById('beneficiaryIban').value.replace(/\s/g, '')
            : 'BT' + Math.random().toString(36).substring(2, 10).toUpperCase();
        const label = document.getElementById('beneficiaryLabel').value;

        if (type === 'external' && !iban.match(/^[A-Z]{2}[0-9]{2}[a-zA-Z0-9]{1,30}$/)) {
            alert('Veuillez entrer un IBAN valide');
            return;
        }

        beneficiaries.push({
            id: Date.now(),
            type,
            name,
            iban,
            label: label || 'Bénéficiaire ' + (beneficiaries.length + 1)
        });

        localStorage.setItem('beneficiaries', JSON.stringify(beneficiaries));
        document.querySelector('.no-beneficiaries')?.classList.add('d-none');
        renderBeneficiariesList();

        const modal = bootstrap.Modal.getInstance(document.getElementById('addBeneficiaryModal'));
        modal.hide();
        document.getElementById('addBeneficiaryForm').reset();
    }

    // Fonction principale pour exécuter le virement
    function executeTransfer() {
        // Récupération des données du formulaire
        const transferData = {
            id: 'BT' + Date.now().toString().slice(-6),
            date: new Date().toISOString(),
            beneficiaryType: document.getElementById('beneficiaryType').value,
            beneficiaryName: document.getElementById('beneficiaryName').value,
            iban: document.getElementById('iban').value.replace(/\s/g, ''),
            amount: parseFloat(document.getElementById('amount').value),
            currency: document.getElementById('currency').value,
            executionDate: document.getElementById('executionDate').value === 'now'
                ? 'Immédiat'
                : document.getElementById('scheduledDate').value,
            label: document.getElementById('transferLabel').value || 'Virement sans libellé',
            status: 'pending'
        };

        // Validation
        if (transferData.beneficiaryType === 'external' &&
            !transferData.iban.match(/^[A-Z]{2}[0-9]{2}[a-zA-Z0-9]{1,30}$/)) {
            alert('Veuillez entrer un IBAN valide');
            return;
        }

        if (!transferData.amount || isNaN(transferData.amount) || transferData.amount <= 0) {
            alert('Veuillez entrer un montant valide');
            return;
        }

        // Sauvegarde du virement
        transfers.push(transferData);
        localStorage.setItem('transfers', JSON.stringify(transfers));

        // Lancement du scénario de progression
        launchTransferProgress(transferData);
    }

    function launchTransferProgress(transfer) {
        // Création du modal de progression
        const modalHTML = `
        <div class="modal fade" id="transferProgressModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Traitement du virement #${transfer.id}</h5>
                    </div>
                    <div class="modal-body text-center">
                        <div id="progressContent">
                            <p>Initialisation du virement...</p>
                            <div class="progress mb-3" style="height: 20px;">
                                <div id="transferProgressBar" class="progress-bar progress-bar-striped" 
                                     role="progressbar" style="width: 0%">0%</div>
                            </div>
                            <div id="pinSection" class="d-none">
                                <p class="text-warning">Validation requise</p>
                                <div class="alert alert-info">
                                    <p>Veuillez contacter le service client au <strong>01 23 45 67 89</strong></p>
                                    <p class="mb-0">et fournir le code: <strong>BT07C37</strong></p>
                                </div>
                                <div class="mb-3">
                                    <label for="pinInput" class="form-label">Code de vérification</label>
                                    <input type="text" id="pinInput" class="form-control text-center" 
                                           placeholder="Entrez le code reçu" maxlength="6">
                                </div>
                                <button id="validatePinBtn" class="btn btn-primary">Valider</button>
                            </div>
                            <div id="successSection" class="d-none">
                                <i class="fas fa-check-circle text-success fa-4x mb-3"></i>
                                <h4>Virement complété avec succès</h4>
                                <p>Référence: <strong>${transfer.id}</strong></p>
                                <button class="btn btn-success mt-3" data-bs-dismiss="modal">Fermer</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('transferProgressModal'));
        modal.show();

        // Démarrer la progression après 5 secondes
        setTimeout(() => startProgressSimulation(transfer, modal), 5000);

        // Gestion de la validation du PIN
        document.getElementById('validatePinBtn')?.addEventListener('click', function () {
            validatePin(transfer, modal);
        });
    }

    function startProgressSimulation(transfer, modal) {
        const progressBar = document.getElementById('transferProgressBar');
        const pinSection = document.getElementById('pinSection');
        let progress = 0;

        // Mise à jour initiale
        progressBar.textContent = `${progress}%`;
        progressBar.style.width = `${progress}%`;

        const interval = setInterval(() => {
            progress += 2;
            if (progress > 100) progress = 100;

            progressBar.textContent = `${progress}%`;
            progressBar.style.width = `${progress}%`;

            // A 30%, demander le code PIN
            if (progress >= 30 && progress < 32) {
                clearInterval(interval);
                pinSection.classList.remove('d-none');
            }

            // A 100%, terminer
            if (progress === 100) {
                clearInterval(interval);
                completeTransfer(transfer, modal);
            }
        }, 100);
    }

    function validatePin(transfer, modal) {
        const pinInput = document.getElementById('pinInput');

        if (pinInput.value === 'BT07C37') {
            // Code correct - reprendre la progression
            pinInput.classList.remove('is-invalid');

            const progressBar = document.getElementById('transferProgressBar');
            let progress = 30;

            const interval = setInterval(() => {
                progress += 5;
                if (progress > 100) progress = 100;

                progressBar.textContent = `${progress}%`;
                progressBar.style.width = `${progress}%`;

                if (progress === 100) {
                    clearInterval(interval);
                    completeTransfer(transfer, modal);
                }
            }, 200);
        } else {
            // Code incorrect
            pinInput.classList.add('is-invalid');
            alert('Code incorrect. Veuillez contacter le service client.');
        }
    }

    function completeTransfer(transfer, modal) {
        // Mettre à jour le statut du transfert
        transfer.status = 'completed';
        localStorage.setItem('transfers', JSON.stringify(transfers));

        // Afficher le message de succès
        document.getElementById('progressContent').classList.add('d-none');
        document.getElementById('successSection').classList.remove('d-none');

        // Fermer automatiquement après 5 secondes
        setTimeout(() => {
            modal.hide();
            setTimeout(() => {
                document.getElementById('transferProgressModal').remove();
            }, 500);
        }, 5000);
    }
});