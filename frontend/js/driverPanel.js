class DriverPanel {
    static render() {
        const user = getUser();
        if (!user || (user.role !== 'driver' && user.role !== 'conductor')) { AuthViews.renderLogin(); return; }

        document.getElementById('app').innerHTML = `
        <div class="dashboard-layout">
            <div class="mobile-overlay" id="mobileOverlay" onclick="closeMobileSidebar()"></div>
            <aside class="sidebar" id="appSidebar">
                <div class="sidebar-logo"><h3>🚀 Ruta Express</h3><span>Panel Conductor</span></div>
                <nav class="sidebar-nav">
                    <div class="sidebar-section-label">Principal</div>
                    <a href="#" class="active" onclick="DriverPanel.showSection('dashboard',event)"><i class="fas fa-home"></i> Inicio</a>
                    <a href="#" onclick="DriverPanel.showSection('profile',event)"><i class="fas fa-id-card"></i> Mis Datos</a>
                    <a href="#" onclick="DriverPanel.showSection('vehicle',event)"><i class="fas fa-truck"></i> Mi Vehículo</a>
                    <div class="sidebar-section-label">Operaciones</div>
                    <a href="#" onclick="DriverPanel.showSection('schedules',event)"><i class="fas fa-calendar-alt"></i> Horarios</a>
                    <a href="#" onclick="DriverPanel.showSection('routes',event)"><i class="fas fa-map-marked-alt"></i> Rutas</a>
                    <a href="#" onclick="DriverPanel.showSection('orders',event)"><i class="fas fa-clipboard-list"></i> Pedidos</a>
                    <div class="sidebar-section-label">Finanzas</div>
                    <a href="#" onclick="DriverPanel.showSection('history',event)"><i class="fas fa-chart-line"></i> Ganancias</a>
                    <a href="#" onclick="DriverPanel.showSection('payments',event)"><i class="fas fa-wallet"></i> Mis Pagos</a>
                    <div class="sidebar-section-label">Preferencias</div>
                    <a href="#" onclick="DriverPanel.showSection('settings',event)"><i class="fas fa-cog"></i> Ajustes</a>
                </nav>
                <div class="sidebar-footer">
                    <div class="sidebar-user"><div class="sidebar-user-avatar">${(user.username||'C')[0].toUpperCase()}</div><div class="sidebar-user-info"><div class="sidebar-user-name">${user.username}</div><div class="sidebar-user-role">Conductor</div></div></div>
                    <button class="btn btn-danger btn-block btn-sm" onclick="App.logout()">Cerrar Sesión</button>
                </div>
            </aside>
            <main class="main-content">
                <div class="top-bar">
                    <button class="mobile-menu-btn" onclick="openMobileSidebar()" aria-label="Abrir menú"><i class="fas fa-bars"></i></button>
                    <h2 id="sectionTitle">Dashboard</h2>
                    <div class="top-bar-right">
                        ${Notifications.renderBell()}
                        <div class="availability-toggle" id="availabilityWidget"><label class="toggle-switch"><input type="checkbox" id="availabilityToggle" onchange="DriverPanel.toggleAvailability()"><span class="toggle-slider"></span></label><span id="availabilityLabel">No disponible</span></div>
                    </div>
                </div>
                <div class="section-content-wrapper"><div id="sectionContent">${DriverPanel.getDashboardHTML()}</div></div>
            </main>
        </div>`;
        setTimeout(DriverPanel.loadAvailability, 200);
        Notifications.init();
        setTimeout(DriverPanel.loadDashboardStats, 300);
    }

    static showSection(section, event) {
        if(event) document.querySelectorAll('.sidebar-nav a').forEach(a=>a.classList.remove('active'));
        if(event) event.target.classList.add('active');
        closeMobileSidebar();
        const titles = { dashboard:'Dashboard', profile:'Mis Datos', vehicle:'Mi Vehículo', schedules:'Horarios', routes:'Rutas', orders:'Pedidos', history:'Ganancias', payments:'Mis Pagos', settings:'Ajustes' };
        document.getElementById('sectionTitle').innerHTML = titles[section] || section;
        const methods = { dashboard:DriverPanel.getDashboardHTML, profile:DriverPanel.getProfileHTML, vehicle:DriverPanel.getVehicleHTML, schedules:DriverPanel.getSchedulesHTML, routes:DriverPanel.getRoutesHTML, orders:DriverPanel.getOrdersHTML, history:DriverPanel.getHistoryHTML, payments:DriverPanel.getPaymentsHTML, settings:DriverPanel.getSettingsHTML };
        document.getElementById('sectionContent').innerHTML = methods[section]();
        const loads = { dashboard:DriverPanel.loadDashboardStats, profile:DriverPanel.loadProfile, vehicle:DriverPanel.loadVehicle, schedules:DriverPanel.loadSchedules, routes:DriverPanel.loadRoutes, orders:DriverPanel.loadOrders, history:DriverPanel.loadHistory, payments:DriverPanel.loadPayments, settings:DriverPanel.loadSettings };
        if(loads[section]) setTimeout(loads[section], 200);
    }

    static getDashboardHTML() {
        return `<div class="stats-grid"><div class="stat-card"><div class="stat-icon" style="background:#fef3c7;color:#f59e0b"><i class="fas fa-clock"></i></div><div><div class="stat-value" id="dStatPending">—</div><div>Pendientes</div></div></div><div class="stat-card"><div class="stat-icon" style="background:#d1fae5;color:#10b981"><i class="fas fa-check-circle"></i></div><div><div class="stat-value" id="dStatCompleted">—</div><div>Culminados</div></div></div><div class="stat-card"><div class="stat-icon" style="background:#ede9fe;color:#7c3aed"><i class="fas fa-money-bill-wave"></i></div><div><div class="stat-value" id="dStatEarnings">S/0</div><div>Ganancias</div></div></div><div class="stat-card"><div class="stat-icon" style="background:#dbeafe;color:#2563eb"><i class="fas fa-route"></i></div><div><div class="stat-value" id="dStatRoutes">—</div><div>Rutas</div></div></div></div><div class="grid-2"><div class="card"><div class="card-header"><h4>Acciones</h4></div><div class="card-body"><button class="btn btn-primary" onclick="DriverPanel.showSection('orders',null)">Ver Pedidos</button><button class="btn btn-success" onclick="DriverPanel.showSection('routes',null)">Agregar Ruta</button></div></div><div class="card"><div class="card-header"><h4>Disponibilidad</h4></div><div class="card-body"><div class="alert alert-info">Activa tu disponibilidad para recibir pedidos</div></div></div></div>`;
    }

    static async loadDashboardStats() {
        try {
            const [orders, history, routes] = await Promise.all([apiCall('/orders/driver/orders').catch(()=>({data:{encomiendas:[],viajes:[]}})), apiCall('/orders/driver/completed').catch(()=>({data:{totalGanancias:0,pedidos:[]}})), apiCall('/route-config/routes').catch(()=>({data:[]}))]);
            document.getElementById('dStatPending') && (document.getElementById('dStatPending').textContent = (orders.data?.encomiendas?.length||0)+(orders.data?.viajes?.length||0));
            document.getElementById('dStatCompleted') && (document.getElementById('dStatCompleted').textContent = history.data?.pedidos?.length||0);
            document.getElementById('dStatEarnings') && (document.getElementById('dStatEarnings').textContent = formatCurrency(history.data?.totalGanancias||0));
            document.getElementById('dStatRoutes') && (document.getElementById('dStatRoutes').textContent = routes.data?.length||0);
        } catch(e) {}
    }

    static async loadAvailability() {
        try {
            const data = await apiCall('/auth/profile');
            if(data.success && data.data.driver) {
                const isAvail = data.data.driver.disponible === 1;
                document.getElementById('availabilityToggle') && (document.getElementById('availabilityToggle').checked = isAvail);
                document.getElementById('availabilityLabel') && (document.getElementById('availabilityLabel').textContent = isAvail ? 'Disponible' : 'No disponible');
            }
        } catch(e) {}
    }

    static async toggleAvailability() {
        const av = document.getElementById('availabilityToggle').checked;
        document.getElementById('availabilityLabel').textContent = av ? 'Disponible' : 'No disponible';
        try {
            await apiCall('/drivers/availability', { method:'PUT', body: { available: av ? 1 : 0 } });
            showToast(av ? 'Disponible' : 'No disponible', av ? 'success' : 'warning');
        } catch(e) { showToast(e.message, 'error'); }
    }

    static getProfileHTML() {
        return `<div class="card"><div class="card-header"><h4>Mi Perfil</h4></div><div class="card-body"><form onsubmit="DriverPanel.updateProfile(event)"><div class="grid-2"><div class="form-group"><label>Nombre Completo</label><input type="text" name="full_name" id="dName" class="form-control" required></div><div class="form-group"><label>Edad</label><input type="number" name="age" id="dAge" class="form-control" required></div></div><div class="grid-2"><div class="form-group"><label>Teléfono 1</label><input type="tel" name="phone1" id="dPhone1" class="form-control" required></div><div class="form-group"><label>Teléfono 2</label><input type="tel" name="phone2" id="dPhone2" class="form-control"></div></div><button type="submit" class="btn btn-primary">Guardar</button></form></div></div>`;
    }

    static async loadProfile() {
        try {
            const data = await apiCall('/auth/profile');
            if(data.success && data.data.driver) {
                const d = data.data.driver;
                document.getElementById('dName') && (document.getElementById('dName').value = d.nombre_completo || '');
                document.getElementById('dAge') && (document.getElementById('dAge').value = d.edad || '');
                document.getElementById('dPhone1') && (document.getElementById('dPhone1').value = d.telefono_1 || '');
                document.getElementById('dPhone2') && (document.getElementById('dPhone2').value = d.telefono_2 || '');
            }
        } catch(e) {}
    }

    static async updateProfile(event) {
        event.preventDefault();
        try {
            await apiCall('/drivers/profile', { method:'PUT', body: getFormData(event.target) });
            showToast('Perfil actualizado', 'success');
        } catch(e) { showToast(e.message, 'error'); }
    }

    static getVehicleHTML() {
        return `<div class="card"><div class="card-header"><h4>Mi Vehículo</h4><button class="btn btn-primary btn-sm" onclick="DriverPanel.showVehicleForm()">Registrar</button></div><div id="vehicleInfo" class="card-body"><div class="empty-state">Cargando...</div></div></div>`;
    }

    static async loadVehicle() {
        try {
            const data = await apiCall('/drivers/vehicles');
            if(data.success && data.data.length>0) {
                const v = data.data[0];
                const fotoHTML = v.foto_vehiculo
                    ? `<img src="${v.foto_vehiculo}" alt="Foto del vehículo" class="vehicle-photo">`
                    : `<div class="vehicle-photo-placeholder"><i class="fas fa-truck"></i></div>`;
                document.getElementById('vehicleInfo').innerHTML = `
                    <div class="vehicle-card-layout">
                        ${fotoHTML}
                        <div>
                            <h3>${v.marca||''} ${v.modelo||''}</h3>
                            <p>Placa: ${v.placa}</p>
                            <p>Color: ${v.color||'—'}</p>
                            <p>Capacidad: ${v.capacidad||'—'} pasajeros</p>
                            <button class="btn btn-primary" onclick="DriverPanel.showVehicleForm(${v.id})">Editar</button>
                        </div>
                    </div>`;
            } else {
                document.getElementById('vehicleInfo').innerHTML = '<div class="empty-state">No hay vehículo registrado</div>';
            }
        } catch(e) {}
    }

    static showVehicleForm(id=null) {
        openModal(id?'Editar Vehículo':'Registrar Vehículo', `
            <form onsubmit="DriverPanel.saveVehicle(event, ${id})">
                <div class="form-group">
                    <label>Placa</label>
                    <input type="text" name="plate" class="form-control" required>
                </div>
                <div class="grid-2">
                    <div class="form-group"><label>Marca</label><input type="text" name="brand" class="form-control"></div>
                    <div class="form-group"><label>Modelo</label><input type="text" name="model" class="form-control"></div>
                </div>
                <div class="grid-2">
                    <div class="form-group"><label>Color</label><input type="text" name="color" class="form-control"></div>
                    <div class="form-group"><label>Capacidad</label><input type="number" name="capacity" class="form-control"></div>
                </div>
                <div class="form-group">
                    <label>Foto del vehículo (opcional)</label>
                    <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" class="form-control">
                    <p class="settings-desc">JPEG, PNG o WEBP, máximo 5MB.</p>
                </div>
                <button type="submit" class="btn btn-primary btn-block">Guardar</button>
            </form>`);
    }

    static async saveVehicle(event, id) {
        event.preventDefault();
        try {
            await apiCall(id ? `/drivers/vehicles/${id}` : '/drivers/vehicles', { method: id?'PUT':'POST', body: new FormData(event.target) });
            closeModal();
            showToast('Vehículo guardado', 'success');
            DriverPanel.loadVehicle();
        } catch(e) { showToast(e.message, 'error'); }
    }

    static getSchedulesHTML() {
        return `<div class="card"><div class="card-header"><h4>Horarios</h4><button class="btn btn-primary btn-sm" onclick="DriverPanel.showScheduleForm()">Agregar</button></div><div id="schedulesList" class="card-body"><div class="empty-state">Cargando...</div></div></div>`;
    }

    static async loadSchedules() {
        try {
            const data = await apiCall('/route-config/schedules');
            if(data.data && data.data.length>0) {
                document.getElementById('schedulesList').innerHTML = `<div class="grid-2">${data.data.map(s=>`<div class="card" style="margin:0;padding:12px;display:flex;justify-content:space-between"><span>${formatTime12h(s.hora_salida)}</span><button class="btn-icon btn-delete" onclick="DriverPanel.deleteSchedule(${s.id})"><i class="fas fa-times"></i></button></div>`).join('')}</div>`;
            } else {
                document.getElementById('schedulesList').innerHTML = '<div class="empty-state">Sin horarios</div>';
            }
        } catch(e) { document.getElementById('schedulesList').innerHTML = '<div class="empty-state">Error</div>'; }
    }

    static showScheduleForm() {
        openModal('Agregar Horario', `<form onsubmit="DriverPanel.saveSchedule(event)"><div class="form-group"><label>Hora de salida</label>${TimePicker.render('departure_time')}</div><button type="submit" class="btn btn-primary btn-block">Guardar</button></form>`);
    }

    static async saveSchedule(event) {
        event.preventDefault();
        try {
            const hora24h = TimePicker.readValue(event.target, 'departure_time');
            await apiCall('/route-config/schedules', { method:'POST', body: { departure_time: hora24h } });
            closeModal();
            showToast('Horario guardado', 'success');
            DriverPanel.loadSchedules();
        } catch(e) { showToast(e.message, 'error'); }
    }

    static async deleteSchedule(id) {
        if(!await confirmAction('¿Eliminar horario?')) return;
        try {
            await apiCall(`/route-config/schedules/${id}`, { method:'DELETE' });
            showToast('Eliminado', 'success');
            DriverPanel.loadSchedules();
        } catch(e) { showToast(e.message, 'error'); }
    }

    static getRoutesHTML() {
        return `<div class="card"><div class="card-header"><h4>Mis Rutas</h4><button class="btn btn-primary btn-sm" onclick="DriverPanel.showRouteForm()">Agregar</button></div><div class="table-container"><table><thead><tr><th>Origen</th><th>Destino</th><th>Precio</th><th></th></tr></thead><tbody id="routesTableBody"><tr><td colspan="4"><div class="empty-state">Cargando...</div></td></tr></tbody></table></div></div>`;
    }

    static async loadRoutes() {
        try {
            const data = await apiCall('/route-config/routes');
            if(data.data && data.data.length>0) {
                document.getElementById('routesTableBody').innerHTML = data.data.map(r=>`<tr><td>${r.origen}</td><td>${r.destino}</td><td>${formatCurrency(r.precio)}</td><td><button class="btn-icon btn-delete" onclick="DriverPanel.deleteRoute(${r.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
            } else {
                document.getElementById('routesTableBody').innerHTML = '<tr><td colspan="4"><div class="empty-state">Sin rutas</div></td></tr>';
            }
        } catch(e) {}
    }

    static showRouteForm() {
        openModal('Agregar Ruta', `<form onsubmit="DriverPanel.saveRoute(event)"><div class="grid-2"><div class="form-group"><label>Origen</label><input type="text" name="origin" class="form-control" required></div><div class="form-group"><label>Destino</label><input type="text" name="destination" class="form-control" required></div></div><div class="form-group"><label>Precio S/</label><input type="number" name="price" class="form-control" step="0.01" required></div><button type="submit" class="btn btn-primary btn-block">Guardar</button></form>`);
    }

    static async saveRoute(event) {
        event.preventDefault();
        try {
            await apiCall('/route-config/routes', { method:'POST', body: getFormData(event.target) });
            closeModal();
            showToast('Ruta guardada', 'success');
            DriverPanel.loadRoutes();
        } catch(e) { showToast(e.message, 'error'); }
    }

    static async deleteRoute(id) {
        if(!await confirmAction('¿Eliminar ruta?')) return;
        try {
            await apiCall(`/route-config/routes/${id}`, { method:'DELETE' });
            showToast('Ruta eliminada', 'success');
            DriverPanel.loadRoutes();
        } catch(e) { showToast(e.message, 'error'); }
    }

    static getOrdersHTML() {
        return `<div class="card"><div class="card-header"><h4>Pedidos Pendientes</h4></div><div id="ordersContent" class="card-body"><div class="empty-state">Cargando...</div></div></div>`;
    }

    static async loadOrders() {
        try {
            const data = await apiCall('/orders/driver/orders');
            const encomiendas = data.data?.encomiendas || [];
            const viajes = data.data?.viajes || [];
            if(encomiendas.length===0 && viajes.length===0) {
                document.getElementById('ordersContent').innerHTML = '<div class="empty-state">No hay pedidos pendientes</div>';
                return;
            }
            let html = '';
            encomiendas.forEach(o => { html += `<div class="card" style="margin-bottom:12px;padding:16px"><div><strong>📦 Encomienda</strong> - ${o.origen} → ${o.destino}</div><div>Cliente: ${o.nombre_usuario}</div><div>Estado: ${getStatusBadge(o.estado)}</div><button class="btn btn-success btn-sm" onclick="DriverPanel.completeOrder('parcels',${o.id})">Culminar</button></div>`; });
            viajes.forEach(o => { html += `<div class="card" style="margin-bottom:12px;padding:16px"><div><strong>🚗 Viaje</strong> - ${o.origen} → ${o.destino}</div><div>Cliente: ${o.nombre_usuario}</div><div>Estado: ${getStatusBadge(o.estado)}</div><button class="btn btn-success btn-sm" onclick="DriverPanel.completeOrder('trips',${o.id})">Culminar</button></div>`; });
            document.getElementById('ordersContent').innerHTML = html;
        } catch(e) { document.getElementById('ordersContent').innerHTML = '<div class="empty-state">Error al cargar</div>'; }
    }

    static async completeOrder(type, id) {
        if(!await confirmAction('¿Confirmar entrega?')) return;
        try {
            await apiCall(`/orders/driver/${type}/${id}/complete`, { method:'POST' });
            showToast('Pedido culminado', 'success');
            DriverPanel.loadOrders();
            DriverPanel.loadDashboardStats();
        } catch(e) { showToast(e.message, 'error'); }
    }

    static getHistoryHTML() {
        return `<div class="card"><div class="card-header"><h4>Historial de Ganancias</h4></div><div class="card-body"><div id="historyContent"><div class="empty-state">Cargando...</div></div></div></div>`;
    }

    static async loadHistory() {
        try {
            const data = await apiCall('/orders/driver/completed');
            const pedidos = data.data?.pedidos || [];
            const total = data.data?.totalGanancias || 0;
            if(pedidos.length===0) {
                document.getElementById('historyContent').innerHTML = `<div class="empty-state">Sin historial</div>`;
                return;
            }
            document.getElementById('historyContent').innerHTML = `<div class="alert alert-success">Total ganado: ${formatCurrency(total)}</div><table class="table"><thead><tr><th>Tipo</th><th>Ruta</th><th>Precio</th><th>Fecha</th></tr></thead><tbody>${pedidos.map(p=>`<tr><td>${p.tipo_pedido==='encomienda'?'📦 Encomienda':'🚗 Viaje'}</td><td>${p.origen}→${p.destino}</td><td>${formatCurrency(p.precio)}</td><td>${formatDateShort(p.fecha_culminacion)}</td></tr>`).join('')}</tbody></table>`;
        } catch(e) { document.getElementById('historyContent').innerHTML = '<div class="empty-state">Error</div>'; }
    }

    static getPaymentsHTML() {
        return `<div class="card"><div class="card-header"><h4>Métodos de Pago para Cobrar</h4><button class="btn btn-primary btn-sm" onclick="DriverPanel.showDriverPaymentForm()">Agregar</button></div><div id="driverPaymentsList" class="card-body"><div class="empty-state">Cargando...</div></div></div>`;
    }

    static async loadPayments() {
        try {
            const data = await apiCall('/driver/payments');
            if(data.success && data.data.length>0) {
                document.getElementById('driverPaymentsList').innerHTML = `<div class="grid-2">${data.data.map(p=>`<div class="card" style="margin:0;padding:16px"><div><strong>${p.tipo_billetera?.toUpperCase()}</strong></div><div>${p.numero_billetera}</div><button class="btn btn-danger btn-sm" onclick="DriverPanel.deleteDriverPayment(${p.id})">Eliminar</button></div>`).join('')}</div>`;
            } else {
                document.getElementById('driverPaymentsList').innerHTML = '<div class="empty-state">No hay métodos de pago registrados</div>';
            }
        } catch(e) { document.getElementById('driverPaymentsList').innerHTML = '<div class="empty-state">Error al cargar</div>'; }
    }

    static showDriverPaymentForm() {
        openModal('Agregar Método de Pago para Cobrar', `<form onsubmit="DriverPanel.saveDriverPayment(event)"><div class="form-group"><label>Tipo</label><select name="wallet_type" class="form-control"><option value="yape">Yape</option><option value="plin">Plin</option></select></div><div class="form-group"><label>Número</label><input type="tel" name="wallet_number" class="form-control" required maxlength="9"></div><button type="submit" class="btn btn-primary btn-block">Guardar</button></form>`);
    }

    static async saveDriverPayment(event) {
        event.preventDefault();
        try {
            await apiCall('/driver/payments', { method:'POST', body: getFormData(event.target) });
            closeModal();
            showToast('Método de pago guardado', 'success');
            DriverPanel.loadPayments();
        } catch(e) { showToast(e.message, 'error'); }
    }

    static async deleteDriverPayment(id) {
        if(!await confirmAction('¿Eliminar este método de pago?')) return;
        try {
            await apiCall(`/driver/payments/${id}`, { method:'DELETE' });
            showToast('Eliminado', 'success');
            DriverPanel.loadPayments();
        } catch(e) { showToast(e.message, 'error'); }
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
                        <button class="theme-btn ${currentTheme==='claro'?'active':''}" onclick="DriverPanel.changeTheme('claro')">
                            <i class="fas fa-sun"></i> Claro
                        </button>
                        <button class="theme-btn ${currentTheme==='oscuro'?'active':''}" onclick="DriverPanel.changeTheme('oscuro')">
                            <i class="fas fa-moon"></i> Oscuro
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top:20px; border: 1px solid var(--danger);">
            <div class="card-header"><div class="card-title" style="color:var(--danger)"><i class="fas fa-exclamation-triangle"></i> Zona de peligro</div></div>
            <div class="card-body">
                <div class="settings-row">
                    <div>
                        <strong>Eliminar mi cuenta</strong>
                        <p class="settings-desc">Esta acción es permanente. Se desactivará también tu perfil de conductor, tus rutas y tus vehículos.</p>
                    </div>
                    <button class="btn btn-danger" onclick="DriverPanel.confirmDeleteAccount()"><i class="fas fa-trash"></i> Eliminar cuenta</button>
                </div>
            </div>
        </div>`;
    }

    static loadSettings() {}

    static changeTheme(theme) {
        setSavedTheme(theme);
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        event.target.closest('.theme-btn').classList.add('active');
        apiCall('/auth/theme', { method: 'PUT', body: { theme } }).catch(() => {});
    }

    static confirmDeleteAccount() {
        openModal(
            `<i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i> Eliminar cuenta`,
            `<p>Esta acción <strong>no se puede deshacer</strong>. Tu perfil de conductor, vehículos y rutas quedarán inactivos.</p>
             <form onsubmit="DriverPanel.executeDeleteAccount(event)">
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