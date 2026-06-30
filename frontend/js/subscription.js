// ============================================================
// Subscription: maneja todo lo relacionado a la suscripción de S/25/mes
// ============================================================
// Por ahora el "pago" es simulado (ver backend/controllers/subscriptionController.js).
// Cuando se conecte una pasarela real, solo hay que cambiar lo que pasa
// dentro de Subscription.confirmarPago(); el resto de la UI no cambia.

const Subscription = {
    _estadoActual: null,

    async obtenerEstado() {
        try {
            const res = await apiCall('/subscription/status');
            Subscription._estadoActual = res.data;
            return res.data;
        } catch (e) {
            return null;
        }
    },

    // Tarjeta/banner para mostrar en el dashboard cuando la suscripción
    // no está activa, invitando a pagar. Si está activa y vigente, no
    // se muestra nada (devuelve string vacío).
    renderBanner(estado) {
        if (!estado) return '';
        if (estado.estado === 'activa') {
            if (estado.dias_restantes !== null && estado.dias_restantes <= 5) {
                return `
                <div class="alert alert-warning subscription-banner">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Tu suscripción vence en ${estado.dias_restantes} día(s).
                    <a href="#" onclick="Subscription.openPayModal(event)">Renovar ahora</a></span>
                </div>`;
            }
            return '';
        }

        const mensaje = estado.estado === 'pendiente'
            ? 'Activa tu suscripción de S/25/mes para crear encomiendas y viajes.'
            : 'Tu suscripción venció. Renuévala para seguir usando Ruta Express.';

        return `
        <div class="alert alert-danger subscription-banner">
            <i class="fas fa-lock"></i>
            <span>${mensaje}
            <a href="#" onclick="Subscription.openPayModal(event)">Pagar S/25 ahora</a></span>
        </div>`;
    },

    // Sección completa para la página de "Suscripción" del sidebar
    async renderSectionHTML() {
        const estado = await Subscription.obtenerEstado();
        if (!estado) {
            return `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>No se pudo cargar tu suscripción.</p></div>`;
        }

        const badgeMap = {
            activa: { cls: 'badge-success', label: 'Activa' },
            pendiente: { cls: 'badge-warning', label: 'Pendiente de pago' },
            vencida: { cls: 'badge-danger', label: 'Vencida' }
        };
        const badge = badgeMap[estado.estado] || badgeMap.pendiente;

        let historialHTML = '<p class="text-muted" style="font-size:13px">Aún no tienes pagos registrados.</p>';
        try {
            const histRes = await apiCall('/subscription/history');
            const pagos = histRes.data || [];
            if (pagos.length > 0) {
                historialHTML = `
                <div class="table-container">
                    <table>
                        <thead><tr><th>Fecha</th><th>Monto</th><th>Método</th></tr></thead>
                        <tbody>
                            ${pagos.map(p => `
                                <tr>
                                    <td>${formatDateShort(p.fecha_pago)}</td>
                                    <td>${formatCurrency(p.monto)}</td>
                                    <td>${p.metodo === 'simulado' ? 'Pago simulado (demo)' : p.metodo}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>`;
            }
        } catch (e) {}

        return `
        <div class="card">
            <div class="card-header">
                <div class="card-title"><i class="fas fa-id-card"></i> Tu Suscripción</div>
                <span class="badge ${badge.cls}">${badge.label}</span>
            </div>
            <div class="card-body">
                <div class="stats-grid" style="margin-bottom:20px">
                    <div class="stat-card">
                        <div class="stat-icon" style="background:var(--primary-100);color:var(--primary-dark)"><i class="fas fa-tag"></i></div>
                        <div><div class="stat-value">S/ 25</div><div class="stat-label">Precio mensual</div></div>
                    </div>
                    ${estado.estado === 'activa' ? `
                    <div class="stat-card">
                        <div class="stat-icon" style="background:#ecfdf5;color:#059669"><i class="fas fa-calendar-check"></i></div>
                        <div><div class="stat-value">${estado.dias_restantes ?? '—'}</div><div class="stat-label">Días restantes</div></div>
                    </div>` : ''}
                </div>

                ${estado.estado === 'activa'
                    ? `<p>Tu suscripción está activa hasta el <strong>${formatDateShort(estado.fecha_vencimiento)}</strong>.</p>
                       <button class="btn btn-secondary" onclick="Subscription.openPayModal(event)"><i class="fas fa-redo"></i> Renovar antes de tiempo</button>`
                    : `<div class="alert ${estado.estado === 'vencida' ? 'alert-danger' : 'alert-info'}">
                         <i class="fas fa-info-circle"></i>
                         <span>${estado.estado === 'vencida'
                             ? 'Tu suscripción venció. Mientras esté vencida no podrás crear encomiendas/viajes, ni (si eres conductor) activarte para recibir pedidos.'
                             : 'Aún no has activado tu suscripción. Págala para empezar a usar Ruta Express.'}</span>
                       </div>
                       <button class="btn btn-primary" onclick="Subscription.openPayModal(event)"><i class="fas fa-credit-card"></i> Pagar S/25 ahora</button>`
                }

                <h4 style="margin:24px 0 12px">Historial de pagos</h4>
                ${historialHTML}

                <div class="alert alert-info" style="margin-top:20px">
                    <i class="fas fa-flask"></i>
                    <span>Nota: por ahora el cobro es <strong>simulado</strong> (modo demo) mientras se conecta una pasarela de pago real.</span>
                </div>
            </div>
        </div>`;
    },

    openPayModal(event) {
        if (event) event.preventDefault();
        openModal(
            `<i class="fas fa-credit-card"></i> Pagar suscripción`,
            `
            <div style="text-align:center; margin-bottom:16px">
                <div style="font-size:13px; color:var(--text-muted); margin-bottom:4px">Suscripción mensual Ruta Express</div>
                <div style="font-size:36px; font-weight:800; color:var(--primary)">S/ 25.00</div>
            </div>
            <div class="alert alert-info">
                <i class="fas fa-flask"></i>
                <span>Modo demo: al confirmar, tu suscripción se activa de inmediato por 30 días. No se realiza ningún cobro real todavía.</span>
            </div>
            `,
            `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
             <button class="btn btn-primary" onclick="Subscription.confirmarPago()"><i class="fas fa-check-circle"></i> Confirmar pago</button>`
        );
    },

    async confirmarPago() {
        try {
            await apiCall('/subscription/pay', { method: 'POST' });
            closeModal();
            showToast('¡Suscripción activada por 30 días! 🎉', 'success');
            // Refrescar la vista actual para que se levante cualquier bloqueo
            if (typeof App !== 'undefined' && App.router) App.router();
        } catch (e) {
            showToast(e.message || 'No se pudo procesar el pago', 'error');
        }
    },

    // Atrapa el error estándar que devuelve el backend (402 + code
    // SUBSCRIPTION_REQUIRED) y muestra el modal de pago automáticamente
    // en vez de un toast de error genérico. Se usa así:
    //   try { ...crear encomienda... } catch (e) { if (Subscription.handleBlockedError(e)) return; ... }
    handleBlockedError(error) {
        if (error && error.message && (
            error.message.toLowerCase().includes('suscripción') ||
            error.message.toLowerCase().includes('suscripcion')
        )) {
            showToast(error.message, 'warning');
            Subscription.openPayModal();
            return true;
        }
        return false;
    }
};
