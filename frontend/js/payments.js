class PaymentModule {
    
    static openPaymentModal(amount, description, onSuccess) {
        const overlay = document.getElementById('paymentModalOverlay');
        const body = document.getElementById('paymentModalBody');
        document.getElementById('paymentModalTitle').innerHTML = 
            `<i class="fas fa-credit-card"></i> Pagar S/ ${parseFloat(amount).toFixed(2)}`;
        
        body.innerHTML = `
            <div style="margin-bottom: 16px;">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    <span><strong>${description}</strong></span>
                </div>
                <div style="text-align:center; margin: 8px 0;">
                    <span style="font-size:32px; font-weight:800; color:var(--primary)">S/ ${parseFloat(amount).toFixed(2)}</span>
                </div>
            </div>

            <div class="payment-tabs">
                <button class="payment-tab active" onclick="PaymentModule.switchTab('yape')">
                    <i class="fas fa-mobile-alt"></i> Yape
                </button>
                <button class="payment-tab" onclick="PaymentModule.switchTab('plin')">
                    <i class="fas fa-wallet"></i> Plin
                </button>
                <button class="payment-tab" onclick="PaymentModule.switchTab('card')">
                    <i class="fas fa-credit-card"></i> Tarjeta
                </button>
            </div>

            <div class="payment-tab-content active" id="tab-yape">
                <div class="yape-card">
                    <div class="wallet-logo">💜</div>
                    <div style="font-size:22px; font-weight:800;">YAPE</div>
                    <div class="wallet-number">999 888 777</div>
                    <div class="wallet-name">Ruta Express S.A.C.</div>
                    <div class="qr-placeholder">📱</div>
                </div>
                <div class="form-group">
                    <label>Número Yape con que pagarás</label>
                    <input type="tel" id="yapeNumber" class="form-control" placeholder="987654321" maxlength="9">
                </div>
                <div class="form-group">
                    <label>Código de operación</label>
                    <input type="text" id="yapeCode" class="form-control" placeholder="1234" maxlength="4">
                </div>
                <button class="btn btn-success btn-block" onclick="PaymentModule.processWallet('yape', ${amount}, '${description}')">
                    <i class="fas fa-check-circle"></i> Confirmar pago con Yape
                </button>
            </div>

            <div class="payment-tab-content" id="tab-plin">
                <div class="plin-card">
                    <div class="wallet-logo">💙</div>
                    <div style="font-size:22px; font-weight:800;">PLIN</div>
                    <div class="wallet-number">999 888 666</div>
                    <div class="wallet-name">Ruta Express S.A.C.</div>
                    <div class="qr-placeholder">📱</div>
                </div>
                <div class="form-group">
                    <label>Número Plin con que pagarás</label>
                    <input type="tel" id="plinNumber" class="form-control" placeholder="987654321" maxlength="9">
                </div>
                <div class="form-group">
                    <label>Código de operación</label>
                    <input type="text" id="plinCode" class="form-control" placeholder="5678" maxlength="4">
                </div>
                <button class="btn btn-success btn-block" onclick="PaymentModule.processWallet('plin', ${amount}, '${description}')">
                    <i class="fas fa-check-circle"></i> Confirmar pago con Plin
                </button>
            </div>

            <div class="payment-tab-content" id="tab-card">
                <div class="alert alert-warning">
                    <i class="fas fa-flask"></i>
                    <span>Modo prueba: Usa tarjeta 4242 4242 4242 4242</span>
                </div>
                <div class="form-group">
                    <label>Nombre en la tarjeta</label>
                    <input type="text" id="cardName" class="form-control" placeholder="Juan Pérez">
                </div>
                <div class="form-group">
                    <label>Número de tarjeta</label>
                    <input type="text" id="cardNumber" class="form-control" placeholder="4242 4242 4242 4242" maxlength="19">
                </div>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Vencimiento</label>
                        <input type="text" id="cardExpiry" class="form-control" placeholder="MM/AA" maxlength="5">
                    </div>
                    <div class="form-group">
                        <label>CVC</label>
                        <input type="text" id="cardCvc" class="form-control" placeholder="123" maxlength="4">
                    </div>
                </div>
                <button class="btn btn-primary btn-block" onclick="PaymentModule.processCard(${amount}, '${description}')">
                    <i class="fas fa-lock"></i> Pagar con tarjeta S/ ${parseFloat(amount).toFixed(2)}
                </button>
            </div>
        `;

        overlay.classList.add('active');
        window._paymentOnSuccess = onSuccess;
        
        // Agregar estilos dinámicos
        const style = document.createElement('style');
        style.textContent = `
            .payment-tabs { display: flex; gap: 8px; margin-bottom: 24px; background: var(--gray-100); padding: 6px; border-radius: var(--radius); }
            .payment-tab { flex: 1; padding: 10px; border: none; border-radius: var(--radius); font-weight: 600; cursor: pointer; background: transparent; color: var(--gray-500); }
            .payment-tab.active { background: white; color: var(--primary); box-shadow: var(--shadow); }
            .payment-tab-content { display: none; }
            .payment-tab-content.active { display: block; }
            .yape-card, .plin-card { border-radius: var(--radius-lg); padding: 24px; text-align: center; margin-bottom: 20px; color: white; }
            .yape-card { background: linear-gradient(135deg, #6d1dd1, #9333ea); }
            .plin-card { background: linear-gradient(135deg, #0284c7, #0ea5e9); }
            .wallet-logo { font-size: 42px; margin-bottom: 12px; }
            .wallet-number { font-size: 24px; font-weight: 700; letter-spacing: 2px; margin: 8px 0; }
            .qr-placeholder { width: 120px; height: 120px; margin: 16px auto; background: white; border-radius: var(--radius); display: flex; align-items: center; justify-content: center; font-size: 50px; color: #333; }
        `;
        document.head.appendChild(style);
    }

    static closePaymentModal() {
        document.getElementById('paymentModalOverlay').classList.remove('active');
    }

    static switchTab(tab) {
        document.querySelectorAll('.payment-tab').forEach((t, i) => {
            t.classList.toggle('active', ['yape','plin','card'][i] === tab);
        });
        document.querySelectorAll('.payment-tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById('tab-' + tab).classList.add('active');
    }

    static async processWallet(type, amount, description) {
        const numField = document.getElementById(type + 'Number');
        const codeField = document.getElementById(type + 'Code');
        if (!numField.value || numField.value.length !== 9) {
            showToast('Ingresa un número de 9 dígitos', 'error'); 
            return;
        }
        if (!codeField.value || codeField.value.length < 4) {
            showToast('Ingresa el código de operación', 'error'); 
            return;
        }

        showLoader();
        await new Promise(r => setTimeout(r, 1500));
        hideLoader();

        PaymentModule.closePaymentModal();
        showToast(`✅ Pago con ${type.toUpperCase()} confirmado — S/ ${parseFloat(amount).toFixed(2)}`, 'success');
        if (window._paymentOnSuccess) window._paymentOnSuccess({ type, amount, status: 'completed' });
    }

    static async processCard(amount, description) {
        const name = document.getElementById('cardName').value.trim();
        const number = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const expiry = document.getElementById('cardExpiry').value;
        const cvc = document.getElementById('cardCvc').value;

        if (!name) { showToast('Ingresa el nombre', 'error'); return; }
        if (number.length < 16) { showToast('Número inválido', 'error'); return; }
        if (!expiry.match(/^\d{2}\/\d{2}$/)) { showToast('Fecha inválida (MM/AA)', 'error'); return; }
        if (!cvc || cvc.length < 3) { showToast('CVC inválido', 'error'); return; }

        showLoader();
        await new Promise(r => setTimeout(r, 2000));
        hideLoader();

        PaymentModule.closePaymentModal();
        showToast(`✅ Pago con tarjeta confirmado — S/ ${parseFloat(amount).toFixed(2)}`, 'success');
        if (window._paymentOnSuccess) window._paymentOnSuccess({ type: 'card', amount, last4: number.slice(-4), status: 'completed' });
    }
}

function closePaymentModal() { PaymentModule.closePaymentModal(); }