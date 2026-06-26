class UserPanel {
    static render() {
        const user = getUser();
        if (!user || (user.role !== 'user' && user.role !== 'usuario')) { AuthViews.renderLogin(); return; }
        
        document.getElementById('app').innerHTML = `
        <div class="dashboard-layout">
            <div class="mobile-overlay" id="mobileOverlay" onclick="closeMobileSidebar()"></div>
            <aside class="sidebar" id="appSidebar">
                <div class="sidebar-logo">
                    <h3>🚀 Ruta Express</h3>
                    <span>Panel de Usuario</span>
                </div>
                <nav class="sidebar-nav">
                    <div class="sidebar-section-label">Principal</div>
                    <a href="#" class="active" onclick="UserPanel.showSection('dashboard',event)" data-section="dashboard">
                        <i class="fas fa-home"></i> <span>Inicio</span>
                    </a>
                    <a href="#" onclick="UserPanel.showSection('profile',event)" data-section="profile">
                        <i class="fas fa-user-circle"></i> <span>Mi Perfil</span>
                    </a>
                    <div class="sidebar-section-label">Servicios</div>
                    <a href="#" onclick="UserPanel.showSection('parcels',event)" data-section="parcels">
                        <i class="fas fa-box"></i> <span>Encomiendas</span>
                    </a>
                    <a href="#" onclick="UserPanel.showSection('trips',event)" data-section="trips">
                        <i class="fas fa-route"></i> <span>Viajes</span>
                    </a>
                    <a href="#" onclick="UserPanel.showSection('status',event)" data-section="status">
                        <i class="fas fa-tasks"></i> <span>Mis Pedidos</span>
                    </a>
                    <div class="sidebar-section-label">Finanzas</div>
                    <a href="#" onclick="UserPanel.showSection('payments',event)" data-section="payments">
                        <i class="fas fa-credit-card"></i> <span>Métodos de Pago</span>
                    </a>
                    <div class="sidebar-section-label">Preferencias</div>
                    <a href="#" onclick="UserPanel.showSection('settings',event)" data-section="settings">
                        <i class="fas fa-cog"></i> <span>Ajustes</span>
                    </a>
                </nav>
                <div class="sidebar-footer">
                    <div class="sidebar-user">
                        <div class="sidebar-user-avatar">${(user.username||'U')[0].toUpperCase()}</div>
                        <div class="sidebar-user-info">
                            <div class="sidebar-user-name">${user.username || 'Usuario'}</div>
                            <div class="sidebar-user-role">Cliente</div>
                        </div>
                    </div>
                    <button class="btn btn-danger btn-block btn-sm" onclick="App.logout()">
                        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </div>
            </aside>
            <main class="main-content">
                <div class="top-bar">
                    <button class="mobile-menu-btn" onclick="openMobileSidebar()" aria-label="Abrir menú">
                        <i class="fas fa-bars"></i>
                    </button>
                    <h2 id="sectionTitle"><i class="fas fa-home"></i> Dashboard</h2>
                    <div class="top-bar-right">
                        ${Notifications.renderBell()}
                        <div class="user-avatar">${(user.username||'U')[0].toUpperCase()}</div>
                        <span class="top-bar-username">${user.username || 'Usuario'}</span>
                    </div>
                </div>
                <div class="section-content-wrapper">
                    <div id="sectionContent">${UserPanel.getDashboardHTML()}</div>
                </div>
            </main>
        </div>`;
        setTimeout(UserPanel.loadDashboardStats, 200);
        Notifications.init();
    }

    static showSection(section, event) {
        if (event) {
            document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
            event.target.closest('a').classList.add('active');
        }
        closeMobileSidebar();
        const titles = { dashboard:'Dashboard', profile:'Mi Perfil', payments:'Métodos de Pago', parcels:'Encomiendas', trips:'Viajes', status:'Mis Pedidos', settings:'Ajustes' };
        const icons = { dashboard:'fa-home', profile:'fa-user-circle', payments:'fa-credit-card', parcels:'fa-box', trips:'fa-route', status:'fa-tasks', settings:'fa-cog' };
        document.getElementById('sectionTitle').innerHTML = `<i class="fas ${icons[section] || 'fa-circle'}"></i> ${titles[section] || section}`;
        
        const methods = { dashboard: UserPanel.getDashboardHTML, profile: UserPanel.getProfileHTML, payments: UserPanel.getPaymentsHTML, parcels: UserPanel.getParcelsHTML, trips: UserPanel.getTripsHTML, status: UserPanel.getStatusHTML, settings: UserPanel.getSettingsHTML };
        const content = document.getElementById('sectionContent');
        content.innerHTML = methods[section]();
        
        const loads = { dashboard: UserPanel.loadDashboardStats, profile: UserPanel.loadProfile, payments: UserPanel.loadPayments, parcels: UserPanel.loadParcels, trips: UserPanel.loadTrips, status: UserPanel.loadStatus, settings: UserPanel.loadSettings };
        if (loads[section]) setTimeout(loads[section], 200);
    }

    static getDashboardHTML() {
        return `
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-icon" style="background:#dbeafe;color:#2563eb"><i class="fas fa-box"></i></div><div class="stat-info"><div class="stat-value" id="statParcels">—</div><div class="stat-label">Encomiendas</div></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#d1fae5;color:#10b981"><i class="fas fa-check-circle"></i></div><div class="stat-info"><div class="stat-value" id="statCompleted">—</div><div class="stat-label">Culminados</div></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#fef3c7;color:#f59e0b"><i class="fas fa-clock"></i></div><div class="stat-info"><div class="stat-value" id="statInProcess">—</div><div class="stat-label">En Proceso</div></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#ede9fe;color:#7c3aed"><i class="fas fa-route"></i></div><div class="stat-info"><div class="stat-value" id="statTrips">—</div><div class="stat-label">Viajes</div></div></div>
        </div>
        <div class="grid-2">
            <div class="card"><div class="card-header"><h4 class="card-title">Acciones Rápidas</h4></div><div class="card-body" style="display:grid;gap:12px"><button class="btn btn-primary" onclick="UserPanel.showSection('parcels',null);setTimeout(UserPanel.showParcelForm,300)">Nueva Encomienda</button><button class="btn btn-success" onclick="UserPanel.showSection('trips',null);setTimeout(UserPanel.showTripForm,300)">Nuevo Viaje</button><button class="btn btn-secondary" onclick="UserPanel.showSection('status',null)">Ver Pedidos</button></div></div>
            <div class="card"><div class="card-header"><h4 class="card-title">Información</h4></div><div class="card-body"><div class="alert alert-info">Todos tus envíos están protegidos y rastreados.</div><div>Soporte: <strong>0800-12345</strong></div><div>soporte@rutaexpress.pe</div></div></div>
        </div>`;
    }

    static async loadDashboardStats() {
        try {
            const [parcels, trips] = await Promise.all([apiCall('/orders/parcels').catch(()=>({data:[]})), apiCall('/orders/trips').catch(()=>({data:[]}))]);
            const p = parcels.data || [], t = trips.data || [];
            const completed = [...p,...t].filter(x=>x.estado==='culminado').length;
            const inProcess = [...p,...t].filter(x=>x.estado==='en_proceso').length;
            document.getElementById('statParcels') && (document.getElementById('statParcels').textContent = p.length);
            document.getElementById('statCompleted') && (document.getElementById('statCompleted').textContent = completed);
            document.getElementById('statInProcess') && (document.getElementById('statInProcess').textContent = inProcess);
            document.getElementById('statTrips') && (document.getElementById('statTrips').textContent = t.length);
        } catch(e) {}
    }

    static getProfileHTML() {
        const user = getUser();
        return `<div class="card"><div class="card-header"><h4 class="card-title">Mi Perfil</h4></div><div class="card-body"><div style="text-align:center"><div class="user-avatar" style="width:80px;height:80px;font-size:32px;margin:0 auto 12px">${(user?.username||'U')[0].toUpperCase()}</div><h3>${user?.username}</h3><p>${user?.email}</p></div><form id="profileForm" onsubmit="UserPanel.updateProfile(event)"><div class="grid-2"><div class="form-group"><label>Usuario</label><input type="text" name="username" id="profileUsername" class="form-control" required></div><div class="form-group"><label>Correo</label><input type="email" name="email" id="profileEmail" class="form-control" required></div></div><button type="submit" class="btn btn-primary">Guardar Cambios</button></form></div></div>`;
    }

    static async loadProfile() {
        try {
            const data = await apiCall('/auth/profile');
            if (data.success) {
                document.getElementById('profileUsername') && (document.getElementById('profileUsername').value = data.data.username || '');
                document.getElementById('profileEmail') && (document.getElementById('profileEmail').value = data.data.email || '');
            }
        } catch(e) { showToast('Error al cargar perfil', 'error'); }
    }

    static async updateProfile(event) {
        event.preventDefault();
        try {
            await apiCall('/auth/profile', { method:'PUT', body: getFormData(event.target) });
            showToast('Perfil actualizado', 'success');
            const user = getUser();
            if(user) { user.username = event.target.username.value; setUser(user); }
        } catch(e) { showToast(e.message, 'error'); }
    }

    static getPaymentsHTML() {
        return `<div class="card"><div class="card-header"><h4 class="card-title">Métodos de Pago</h4><button class="btn btn-primary btn-sm" onclick="UserPanel.showAddPaymentForm()">Agregar</button></div><div class="card-body"><div id="paymentMethodsList" class="empty-state">Cargando...</div></div></div>`;
    }

    static async loadPayments() {
        try {
            const data = await apiCall('/payments');
            if (data.success && data.data.length > 0) {
                document.getElementById('paymentMethodsList').innerHTML = `<div class="grid-2">${data.data.map(p => `
                    <div class="card" style="margin:0;padding:16px"><div><strong>${p.tipo_billetera?.toUpperCase()}</strong></div><div>${p.numero_billetera}</div><button class="btn btn-danger btn-sm" onclick="UserPanel.deletePayment(${p.id})">Eliminar</button></div>`).join('')}</div>`;
            } else {
                document.getElementById('paymentMethodsList').innerHTML = '<div class="empty-state">No hay métodos de pago guardados</div>';
            }
        } catch(e) { document.getElementById('paymentMethodsList').innerHTML = '<div class="empty-state">Error al cargar</div>'; }
    }

    static showAddPaymentForm() {
        openModal('Agregar Método de Pago', `<form onsubmit="UserPanel.savePayment(event)"><div class="form-group"><label>Tipo</label><select name="wallet_type" class="form-control"><option value="yape">Yape</option><option value="plin">Plin</option></select></div><div class="form-group"><label>Número</label><input type="tel" name="wallet_number" class="form-control" required maxlength="9"></div><button type="submit" class="btn btn-primary btn-block">Guardar</button></form>`);
    }

    static async savePayment(event) {
        event.preventDefault();
        try {
            await apiCall('/payments', { method:'POST', body: getFormData(event.target) });
            closeModal();
            showToast('Método de pago guardado', 'success');
            UserPanel.loadPayments();
        } catch(e) { showToast(e.message, 'error'); }
    }

    static async deletePayment(id) {
        if (!await confirmAction('¿Eliminar este método de pago?')) return;
        try {
            await apiCall(`/payments/${id}`, { method:'DELETE' });
            showToast('Eliminado', 'success');
            UserPanel.loadPayments();
        } catch(e) { showToast(e.message, 'error'); }
    }

    static getParcelsHTML() {
        return `<div class="card"><div class="card-header"><h4 class="card-title">Mis Encomiendas</h4><button class="btn btn-primary btn-sm" onclick="UserPanel.showParcelForm()">Nueva</button></div><div class="table-container"><table><thead><tr><th>Descripción</th><th>Origen</th><th>Destino</th><th>Estado</th><th></th></tr></thead><tbody id="parcelsTableBody"><tr><td colspan="5"><div class="empty-state">Cargando...</div></td></tr></tbody></table></div></div>`;
    }

    static async loadParcels() {
        try {
            const data = await apiCall('/orders/parcels');
            if (data.success && data.data.length > 0) {
                document.getElementById('parcelsTableBody').innerHTML = data.data.map(p => `<tr><td>${p.descripcion?.substring(0,40)||''}</td><td>${p.origen}</td><td>${p.destino}</td><td>${getStatusBadge(p.estado)}</td><td>${p.estado==='en_proceso'&&!p.conductor_id?`<button class="btn-icon btn-delete" onclick="UserPanel.deleteParcel(${p.id})"><i class="fas fa-trash"></i></button>`:'—'}</td></tr>`).join('');
            } else {
                document.getElementById('parcelsTableBody').innerHTML = '<tr><td colspan="5"><div class="empty-state">No hay encomiendas</div></td></tr>';
            }
        } catch(e) { showToast('Error al cargar', 'error'); }
    }

    static async showParcelForm() {
        openModal('Nueva Encomienda', `<div id="parcelFormContainer"><div class="empty-state">Cargando rutas disponibles...</div></div>`);
        try {
            const data = await apiCall('/route-config/routes/available');
            const rutas = data.data || [];
            document.getElementById('parcelFormContainer').innerHTML = UserPanel.buildParcelFormHTML(rutas);
        } catch (e) {
            document.getElementById('parcelFormContainer').innerHTML = `<div class="alert alert-danger">No se pudieron cargar las rutas. <button class="btn btn-secondary btn-sm" onclick="UserPanel.showParcelManualForm()">Continuar sin ruta</button></div>`;
        }
    }

    static buildParcelFormHTML(rutas) {
        if (!rutas.length) {
            return `<div class="alert alert-info">No hay conductores disponibles en este momento.</div>
                <button class="btn btn-secondary btn-block" onclick="UserPanel.showParcelManualForm()">Continuar escribiendo origen/destino manualmente</button>`;
        }
        const opciones = rutas.map(r => `
            <option value="${r.id}">
                ${r.origen} → ${r.destino} · S/${parseFloat(r.precio).toFixed(2)} · ${r.nombre_completo || 'Conductor'}${r.placa ? ' · ' + r.placa : ''}
            </option>`).join('');

        return `
        <form id="parcelForm" onsubmit="UserPanel.saveParcel(event)">
            <div class="form-group">
                <label>Ruta y conductor disponible</label>
                <select name="route_id" id="parcelRouteSelect" class="form-control" required onchange="UserPanel.onParcelRouteChange(this.value)">
                    <option value="">Selecciona una ruta...</option>
                    ${opciones}
                </select>
            </div>
            <div id="parcelRouteInfo"></div>
            <div class="form-group">
                <label>Descripción del paquete</label>
                <textarea name="description" class="form-control" required></textarea>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Referencia de recojo (opcional)</label>
                    <input type="text" name="origin_reference" class="form-control">
                </div>
                <div class="form-group">
                    <label>Referencia de entrega (opcional)</label>
                    <input type="text" name="destination_reference" class="form-control">
                </div>
            </div>
            <div class="form-group">
                <label>Nombre de quien recibe</label>
                <input type="text" name="receiver_name" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Contacto de quien recibe (opcional)</label>
                <input type="text" name="receiver_contact" class="form-control">
            </div>
            <button type="submit" class="btn btn-primary btn-block">Crear Encomienda</button>
        </form>
        <div class="auth-link" style="margin-top:12px"><a href="#" onclick="UserPanel.showParcelManualForm();return false;">Prefiero escribir origen/destino manualmente</a></div>`;
    }

    static onParcelRouteChange(routeId) {
        const info = document.getElementById('parcelRouteInfo');
        if (!routeId) { info.innerHTML = ''; return; }
        info.innerHTML = `<div class="alert alert-info"><i class="fas fa-info-circle"></i> El conductor recogerá y entregará tu paquete según la ruta seleccionada. El precio final lo confirma el conductor al culminar.</div>`;
    }

    static showParcelManualForm() {
        openModal('Nueva Encomienda', `<form id="parcelForm" onsubmit="UserPanel.saveParcel(event)"><div class="form-group"><label>Descripción</label><textarea name="description" class="form-control" required></textarea></div><div class="grid-2"><div class="form-group"><label>Origen</label><input type="text" name="origin" class="form-control" required></div><div class="form-group"><label>Destino</label><input type="text" name="destination" class="form-control" required></div></div><div class="form-group"><label>Nombre de quien recibe</label><input type="text" name="receiver_name" class="form-control" required></div><button type="submit" class="btn btn-primary btn-block">Crear Encomienda</button></form>`);
    }

    static async saveParcel(event) {
        event.preventDefault();
        try {
            await apiCall('/orders/parcels', { method:'POST', body: getFormData(event.target) });
            closeModal();
            showToast('Encomienda creada', 'success');
            UserPanel.loadParcels();
        } catch(e) { showToast(e.message, 'error'); }
    }

    static async deleteParcel(id) {
        if (!await confirmAction('¿Eliminar esta encomienda?')) return;
        try {
            await apiCall(`/orders/parcels/${id}`, { method:'DELETE' });
            showToast('Eliminada', 'success');
            UserPanel.loadParcels();
        } catch(e) { showToast(e.message, 'error'); }
    }

    static getTripsHTML() {
        return `<div class="card"><div class="card-header"><h4 class="card-title">Mis Viajes</h4><button class="btn btn-primary btn-sm" onclick="UserPanel.showTripForm()">Nuevo</button></div><div class="table-container"><table><thead><tr><th>Origen</th><th>Destino</th><th>Hora</th><th>Estado</th><th></th></tr></thead><tbody id="tripsTableBody"><tr><td colspan="5"><div class="empty-state">Cargando...</div></td></tr></tbody></table></div></div>`;
    }

    static async loadTrips() {
        try {
            const data = await apiCall('/orders/trips');
            if (data.success && data.data.length > 0) {
                document.getElementById('tripsTableBody').innerHTML = data.data.map(t => `<tr><td>${t.origen}</td><td>${t.destino}</td><td>${formatTime12h(t.hora_salida)}</td><td>${getStatusBadge(t.estado)}</td><td>${t.estado==='en_proceso'&&!t.conductor_id?`<button class="btn-icon btn-delete" onclick="UserPanel.deleteTrip(${t.id})"><i class="fas fa-trash"></i></button>`:'—'}</td></tr>`).join('');
            } else {
                document.getElementById('tripsTableBody').innerHTML = '<tr><td colspan="5"><div class="empty-state">No hay viajes</div></td></tr>';
            }
        } catch(e) { showToast('Error al cargar', 'error'); }
    }

    static async showTripForm() {
        openModal('Nuevo Viaje', `<div id="tripFormContainer"><div class="empty-state">Cargando rutas disponibles...</div></div>`);
        try {
            const data = await apiCall('/route-config/routes/available');
            const rutas = data.data || [];
            document.getElementById('tripFormContainer').innerHTML = UserPanel.buildTripFormHTML(rutas);
        } catch (e) {
            document.getElementById('tripFormContainer').innerHTML = `<div class="alert alert-danger">No se pudieron cargar las rutas. <button class="btn btn-secondary btn-sm" onclick="UserPanel.showTripManualForm()">Continuar sin ruta</button></div>`;
        }
    }

    static _tripRoutesCache = [];

    static buildTripFormHTML(rutas) {
        UserPanel._tripRoutesCache = rutas;
        if (!rutas.length) {
            return `<div class="alert alert-info">No hay conductores disponibles en este momento.</div>
                <button class="btn btn-secondary btn-block" onclick="UserPanel.showTripManualForm()">Continuar escribiendo origen/destino manualmente</button>`;
        }
        const opciones = rutas.map(r => `
            <option value="${r.id}">
                ${r.origen} → ${r.destino} · S/${parseFloat(r.precio).toFixed(2)} · ${r.nombre_completo || 'Conductor'}${r.placa ? ' · ' + r.placa : ''}
            </option>`).join('');

        return `
        <form id="tripForm" onsubmit="UserPanel.saveTrip(event)">
            <div class="form-group">
                <label>Ruta y conductor disponible</label>
                <select name="route_id" id="tripRouteSelect" class="form-control" required onchange="UserPanel.onTripRouteChange(this.value)">
                    <option value="">Selecciona una ruta...</option>
                    ${opciones}
                </select>
            </div>
            <div id="tripScheduleContainer"></div>
            <div class="form-group">
                <label>Pasajeros</label>
                <input type="number" name="passenger_count" class="form-control" value="1" min="1">
            </div>
            <div class="form-group">
                <label>Notas (opcional)</label>
                <textarea name="notes" class="form-control"></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Crear Viaje</button>
        </form>
        <div class="auth-link" style="margin-top:12px"><a href="#" onclick="UserPanel.showTripManualForm();return false;">Prefiero escribir origen/destino y hora manualmente</a></div>`;
    }

    static onTripRouteChange(routeId) {
        const container = document.getElementById('tripScheduleContainer');
        if (!routeId) { container.innerHTML = ''; return; }
        const ruta = UserPanel._tripRoutesCache.find(r => String(r.id) === String(routeId));
        const horarios = ruta?.horarios || [];

        if (horarios.length === 0) {
            container.innerHTML = `<div class="form-group"><label>Hora de salida deseada</label>${TimePicker.render('departure_time_manual')}</div>`;
            return;
        }

        const opciones = horarios.map(h => `<option value="${h.id}">${formatTime12h(h.hora_salida)}</option>`).join('');
        container.innerHTML = `<div class="form-group"><label>Horario de salida del conductor</label>
            <select name="schedule_id" class="form-control" required>${opciones}</select>
        </div>`;
    }

    static showTripManualForm() {
        openModal('Nuevo Viaje', `<form id="tripForm" onsubmit="UserPanel.saveTrip(event)"><div class="grid-2"><div class="form-group"><label>Origen</label><input type="text" name="origin" class="form-control" required></div><div class="form-group"><label>Destino</label><input type="text" name="destination" class="form-control" required></div></div><div class="form-group"><label>Hora de salida deseada</label>${TimePicker.render('departure_time_manual')}</div><div class="form-group"><label>Pasajeros</label><input type="number" name="passenger_count" class="form-control" value="1" min="1"></div><button type="submit" class="btn btn-primary btn-block">Crear Viaje</button></form>`);
    }

    static async saveTrip(event) {
        event.preventDefault();
        try {
            const formData = getFormData(event.target);
            // Si se usó el selector manual de hora 12h, combinarlo a formato 24h
            const manual24h = TimePicker.readValue(event.target, 'departure_time_manual');
            if (manual24h) formData.departure_time = manual24h;
            delete formData.departure_time_manual_hour;
            delete formData.departure_time_manual_minute;
            delete formData.departure_time_manual_period;

            await apiCall('/orders/trips', { method:'POST', body: formData });
            closeModal();
            showToast('Viaje creado', 'success');
            UserPanel.loadTrips();
        } catch(e) { showToast(e.message, 'error'); }
    }

    static async deleteTrip(id) {
        if (!await confirmAction('¿Eliminar este viaje?')) return;
        try {
            await apiCall(`/orders/trips/${id}`, { method:'DELETE' });
            showToast('Eliminado', 'success');
            UserPanel.loadTrips();
        } catch(e) { showToast(e.message, 'error'); }
    }

    static getStatusHTML() {
        return `<div class="section-tabs"><button class="section-tab active" onclick="UserPanel.switchStatusTab('en_proceso',event)">En Proceso</button><button class="section-tab" onclick="UserPanel.switchStatusTab('culminado',event)">Culminados</button></div><div id="statusContent"><div class="empty-state">Cargando...</div></div>`;
    }

    static async loadStatus() { UserPanel.switchStatusTab('en_proceso'); }

    static async switchStatusTab(status, event) {
        if(event) document.querySelectorAll('.section-tab').forEach(t=>t.classList.remove('active'));
        if(event) event.target.classList.add('active');
        const content = document.getElementById('statusContent');
        content.innerHTML = '<div class="empty-state">Cargando...</div>';
        try {
            const [p, t] = await Promise.all([apiCall(`/orders/parcels?status=${status}`).catch(()=>({data:[]})), apiCall(`/orders/trips?status=${status}`).catch(()=>({data:[]}))]);
            const all = [...(p.data||[]).map(x=>({...x,type:'Encomienda'})), ...(t.data||[]).map(x=>({...x,type:'Viaje'}))];
            if(all.length===0) { content.innerHTML='<div class="empty-state">No hay pedidos</div>'; return; }
            content.innerHTML = `<table><thead><tr><th>Tipo</th><th>Ruta</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>${all.map(o=>`<tr><td>${o.type}</td><td>${o.origen} → ${o.destino}</td><td>${getStatusBadge(o.estado)}</td><td>${formatDateShort(o.fecha_creacion)}</td></tr>`).join('')}</tbody></table>`;
        } catch(e) { content.innerHTML = '<div class="empty-state">Error al cargar</div>'; }
    }

    // ============ AJUSTES ============

    static getSettingsHTML() {
        const currentTheme = getSavedTheme();
        return `
        <div class="card">
            <div class="card-header"><div class="card-title"><i class="fas fa-palette"></i> Apariencia</div></div>
            <div class="card-body">
                <div class="settings-row">
                    <div>
                        <strong>Tema de la aplicación</strong>
                        <p class="settings-desc">Elige entre modo claro u oscuro</p>
                    </div>
                    <div class="theme-toggle">
                        <button class="theme-btn ${currentTheme==='claro'?'active':''}" onclick="UserPanel.changeTheme('claro')">
                            <i class="fas fa-sun"></i> Claro
                        </button>
                        <button class="theme-btn ${currentTheme==='oscuro'?'active':''}" onclick="UserPanel.changeTheme('oscuro')">
                            <i class="fas fa-moon"></i> Oscuro
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top:20px">
            <div class="card-header"><div class="card-title"><i class="fas fa-shield-alt"></i> Cuenta</div></div>
            <div class="card-body">
                <div class="settings-row">
                    <div>
                        <strong>Cerrar sesión</strong>
                        <p class="settings-desc">Cierra tu sesión en este dispositivo</p>
                    </div>
                    <button class="btn btn-secondary" onclick="App.logout()"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</button>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top:20px; border: 1px solid var(--danger);">
            <div class="card-header"><div class="card-title" style="color:var(--danger)"><i class="fas fa-exclamation-triangle"></i> Zona de peligro</div></div>
            <div class="card-body">
                <div class="settings-row">
                    <div>
                        <strong>Eliminar mi cuenta</strong>
                        <p class="settings-desc">Esta acción es permanente. Perderás acceso a tu cuenta y tus datos personales serán eliminados.</p>
                    </div>
                    <button class="btn btn-danger" onclick="UserPanel.confirmDeleteAccount()"><i class="fas fa-trash"></i> Eliminar cuenta</button>
                </div>
            </div>
        </div>`;
    }

    static loadSettings() { /* no requiere carga remota, el tema ya está en localStorage */ }

    static changeTheme(theme) {
        setSavedTheme(theme);
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        event.target.closest('.theme-btn').classList.add('active');
        apiCall('/auth/theme', { method: 'PUT', body: { theme } }).catch(() => {});
    }

    static confirmDeleteAccount() {
        const user = getUser();
        const needsPassword = true; // se valida en backend; si la cuenta es solo Google, el backend la deja pasar sin contraseña
        openModal(
            `<i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i> Eliminar cuenta`,
            `<p>Esta acción <strong>no se puede deshacer</strong>. Tu cuenta quedará inhabilitada y tus datos personales serán eliminados.</p>
             <form id="deleteAccountForm" onsubmit="UserPanel.executeDeleteAccount(event)">
                <div class="form-group">
                    <label>Confirma tu contraseña para continuar</label>
                    <input type="password" name="password" class="form-control" placeholder="Tu contraseña (déjalo vacío si entraste con Google)">
                </div>
                <button type="submit" class="btn btn-danger btn-block"><i class="fas fa-trash"></i> Sí, eliminar mi cuenta</button>
             </form>`
        );
    }

    static async executeDeleteAccount(event) {
        event.preventDefault();
        try {
            const password = event.target.password.value;
            await apiCall('/auth/account', { method: 'DELETE', body: { password } });
            closeModal();
            showToast('Tu cuenta ha sido eliminada', 'success');
            setTimeout(() => App.logout(), 800);
        } catch (e) {
            showToast(e.message, 'error');
        }
    }
}