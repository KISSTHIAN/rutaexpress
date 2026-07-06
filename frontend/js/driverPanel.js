class DriverPanel {
    static render() {
        const user = getUser();
        if (!user || (user.role !== 'driver' && user.role !== 'conductor')) { AuthViews.renderLogin(); return; }

        document.getElementById('app').innerHTML = `
        <div class="dashboard-layout">
            <div class="mobile-overlay" id="mobileOverlay" onclick="closeMobileSidebar()"></div>
            <aside class="sidebar" id="appSidebar">
                <div class="sidebar-logo"><h3>Ruta Express</h3><span>Panel Conductor</span></div>
                <nav class="sidebar-nav">
                    <div class="sidebar-section-label">Principal</div>
                    <a href="#" class="active" onclick="DriverPanel.showSection('dashboard',event)"><i class="fas fa-home"></i> <span>Inicio</span></a>
                    <a href="#" onclick="DriverPanel.showSection('profile',event)"><i class="fas fa-id-card"></i> <span>Mis Datos</span></a>
                    <a href="#" onclick="DriverPanel.showSection('vehicle',event)"><i class="fas fa-truck"></i> <span>Mi Vehículo</span></a>
                    <div class="sidebar-section-label">Operaciones</div>
                    <a href="#" onclick="DriverPanel.showSection('schedules',event)"><i class="fas fa-calendar-alt"></i> <span>Horarios</span></a>
                    <a href="#" onclick="DriverPanel.showSection('routes',event)"><i class="fas fa-map-marked-alt"></i> <span>Rutas</span></a>
                    <a href="#" onclick="DriverPanel.showSection('orders',event)"><i class="fas fa-clipboard-list"></i> <span>Pedidos</span></a>
                    <div class="sidebar-section-label">Rendimiento</div>
                    <a href="#" onclick="DriverPanel.showSection('history',event)"><i class="fas fa-chart-line"></i> <span>Historial</span></a>
                    <a href="#" onclick="DriverPanel.showSection('reviews',event)"><i class="fas fa-star"></i> <span>Mis Reseñas</span></a>
                    <div class="sidebar-section-label">Cuenta</div>
                    <a href="#" onclick="DriverPanel.showSection('subscription',event)"><i class="fas fa-id-card"></i> <span>Suscripción</span></a>
                    <a href="#" onclick="DriverPanel.showSection('settings',event)"><i class="fas fa-cog"></i> <span>Ajustes</span></a>
                </nav>
                <div class="sidebar-footer">
                    <div class="sidebar-user">
                        <div class="sidebar-user-avatar">${(user.username||'C')[0].toUpperCase()}</div>
                        <div class="sidebar-user-info"><div class="sidebar-user-name">${user.username}</div><div class="sidebar-user-role">Conductor</div></div>
                    </div>
                    <button class="btn btn-danger btn-block btn-sm" onclick="App.logout()"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</button>
                </div>
            </aside>
            <main class="main-content">
                <div class="top-bar">
                    <button class="mobile-menu-btn" onclick="openMobileSidebar()" aria-label="Abrir menú"><i class="fas fa-bars"></i></button>
                    <h2 id="sectionTitle"><i class="fas fa-home"></i> Dashboard</h2>
                    <div class="top-bar-right">
                        ${Notifications.renderBell()}
                        <div class="availability-toggle" id="availabilityWidget">
                            <label class="toggle-switch">
                                <input type="checkbox" id="availabilityToggle" onchange="DriverPanel.toggleAvailability()">
                                <span class="toggle-slider"></span>
                            </label>
                            <span id="availabilityLabel">No disponible</span>
                        </div>
                    </div>
                </div>
                <div class="section-content-wrapper">
                    <div id="sectionContent">${DriverPanel.getDashboardHTML()}</div>
                </div>
            </main>
        </div>`;
        setTimeout(DriverPanel.loadAvailability, 200);
        Notifications.init();
        setTimeout(DriverPanel.loadDashboardStats, 300);
    }

    static showSection(section, event) {
        if (event) {
            document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
            event.target.closest('a')?.classList.add('active');
        }
        closeMobileSidebar();
        const titles = { dashboard:'Dashboard', profile:'Mis Datos', vehicle:'Mi Vehículo', schedules:'Horarios', routes:'Rutas', orders:'Pedidos', history:'Historial', reviews:'Mis Reseñas', subscription:'Suscripción', settings:'Ajustes' };
        const icons  = { dashboard:'fa-home', profile:'fa-id-card', vehicle:'fa-truck', schedules:'fa-calendar-alt', routes:'fa-map-marked-alt', orders:'fa-clipboard-list', history:'fa-chart-line', reviews:'fa-star', subscription:'fa-id-card', settings:'fa-cog' };
        document.getElementById('sectionTitle').innerHTML = `<i class="fas ${icons[section]||'fa-circle'}"></i> ${titles[section]||section}`;

        const syncMethods = { dashboard:DriverPanel.getDashboardHTML, profile:DriverPanel.getProfileHTML, vehicle:DriverPanel.getVehicleHTML, schedules:DriverPanel.getSchedulesHTML, routes:DriverPanel.getRoutesHTML, orders:DriverPanel.getOrdersHTML, history:DriverPanel.getHistoryHTML, settings:DriverPanel.getSettingsHTML };
        const asyncSections = ['reviews', 'subscription'];

        if (asyncSections.includes(section)) {
            document.getElementById('sectionContent').innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
        } else {
            document.getElementById('sectionContent').innerHTML = (syncMethods[section]||(() => ''))();
        }

        const loads = { dashboard:DriverPanel.loadDashboardStats, profile:DriverPanel.loadProfile, vehicle:DriverPanel.loadVehicle, schedules:DriverPanel.loadSchedules, routes:DriverPanel.loadRoutes, orders:DriverPanel.loadOrders, history:DriverPanel.loadHistory, reviews:DriverPanel.loadReviews, subscription:DriverPanel.loadSubscription, settings:DriverPanel.loadSettings };
        if (loads[section]) setTimeout(loads[section], 200);
    }
    static getDashboardHTML() {
        return `
        <div id="subscriptionBannerDriver"></div>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-icon" style="background:#fef3c7;color:#f59e0b"><i class="fas fa-clock"></i></div><div><div class="stat-value" id="dStatPending">—</div><div class="stat-label">Pendientes</div></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#d1fae5;color:#10b981"><i class="fas fa-check-circle"></i></div><div><div class="stat-value" id="dStatCompleted">—</div><div class="stat-label">Culminados</div></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#ede9fe;color:#7c3aed"><i class="fas fa-money-bill-wave"></i></div><div><div class="stat-value" id="dStatEarnings">S/0</div><div class="stat-label">Ganancias</div></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#dbeafe;color:#2563eb"><i class="fas fa-route"></i></div><div><div class="stat-value" id="dStatRoutes">—</div><div class="stat-label">Rutas</div></div></div>
        </div>
        <div class="grid-2" style="margin-top:20px">
            <div class="card"><div class="card-header"><h4 class="card-title">Acciones</h4></div>
            <div class="card-body" style="display:grid;gap:12px">
                <button class="btn btn-primary" onclick="DriverPanel.showSection('orders',null)"><i class="fas fa-clipboard-list"></i> Ver Pedidos</button>
                <button class="btn btn-success" onclick="DriverPanel.showSection('routes',null)"><i class="fas fa-map-marked-alt"></i> Gestionar Rutas</button>
            </div></div>
            <div class="card"><div class="card-header"><h4 class="card-title">Disponibilidad</h4></div>
            <div class="card-body">
                <div class="alert alert-info"><i class="fas fa-info-circle"></i> Activa el toggle de arriba para recibir pedidos de los clientes. El estado persiste aunque cierres la app.</div>
            </div></div>
        </div>`;
    }

    static async loadDashboardStats() {
        try {
            const sub = await Subscription.obtenerEstado();
            const banner = document.getElementById('subscriptionBannerDriver');
            if (banner) banner.innerHTML = Subscription.renderBanner(sub);

            const [orders, history, routes] = await Promise.all([
                apiCall('/orders/driver/orders').catch(()=>({data:{encomiendas:[],viajes:[]}})),
                apiCall('/orders/driver/completed').catch(()=>({data:{totalGanancias:0,pedidos:[]}})),
                apiCall('/route-config/routes').catch(()=>({data:[]}))
            ]);
            const el = id => document.getElementById(id);
            if(el('dStatPending'))  el('dStatPending').textContent  = (orders.data?.encomiendas?.length||0)+(orders.data?.viajes?.length||0);
            if(el('dStatCompleted'))el('dStatCompleted').textContent= history.data?.pedidos?.length||0;
            if(el('dStatEarnings')) el('dStatEarnings').textContent = formatCurrency(history.data?.totalGanancias||0);
            if(el('dStatRoutes'))   el('dStatRoutes').textContent   = routes.data?.length||0;
        } catch(e) {}
    }

    // ============ DISPONIBILIDAD ============

    static async loadAvailability() {
        try {
            const data = await apiCall('/auth/profile');
            if (data.success && data.data.driver) {
                const isAvail = data.data.driver.disponible === 1;
                const toggle = document.getElementById('availabilityToggle');
                const label  = document.getElementById('availabilityLabel');
                if (toggle) toggle.checked = isAvail;
                if (label)  label.textContent = isAvail ? '✅ Disponible' : 'No disponible';
                if (label)  label.style.color = isAvail ? 'var(--success)' : '';
            }
        } catch(e) {}
    }

    static async toggleAvailability() {
        const av = document.getElementById('availabilityToggle').checked;
        const label = document.getElementById('availabilityLabel');
        if (label) { label.textContent = av ? '✅ Disponible' : 'No disponible'; label.style.color = av ? 'var(--success)' : ''; }
        try {
            await apiCall('/drivers/availability', { method:'PUT', body: { available: av ? 1 : 0 } });
            showToast(av ? '¡Ahora recibirás pedidos!' : 'Ya no recibirás pedidos nuevos', av ? 'success' : 'warning');
        } catch(e) {
            // Si fue bloqueado por suscripción, revertir el toggle
            if (e.message && e.message.toLowerCase().includes('suscripci')) {
                document.getElementById('availabilityToggle').checked = false;
                if (label) { label.textContent = 'No disponible'; label.style.color = ''; }
                showToast(e.message, 'warning');
                Subscription.openPayModal();
            } else {
                showToast(e.message || 'Error al actualizar disponibilidad', 'error');
            }
        }
    }

    // ============ PERFIL (con campo whatsapp) ============

    static getProfileHTML() {
        return `<div class="card"><div class="card-header"><h4 class="card-title"><i class="fas fa-id-card"></i> Mis Datos</h4></div><div class="card-body">
        <form onsubmit="DriverPanel.updateProfile(event)">
            <div class="grid-2">
                <div class="form-group"><label>Nombre Completo <span class="text-danger">*</span></label><input type="text" name="full_name" id="dName" class="form-control" required></div>
                <div class="form-group"><label>Edad</label><input type="number" name="age" id="dAge" class="form-control" min="18" max="99"></div>
            </div>
            <div class="grid-2">
                <div class="form-group"><label>Teléfono principal <span class="text-danger">*</span></label><input type="tel" name="phone1" id="dPhone1" class="form-control" required placeholder="9XXXXXXXX"></div>
                <div class="form-group"><label>Teléfono secundario</label><input type="tel" name="phone2" id="dPhone2" class="form-control"></div>
            </div>
            <div class="form-group">
                <label><i class="fab fa-whatsapp" style="color:#25d366"></i> Número de WhatsApp</label>
                <input type="tel" name="whatsapp" id="dWhatsapp" class="form-control" placeholder="9XXXXXXXX (para que los clientes te contacten)">
                <p class="settings-desc">Si no lo pones, se usará tu Teléfono principal para el link de WhatsApp.</p>
            </div>
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar Cambios</button>
        </form>
        </div></div>`;
    }

    static async loadProfile() {
        try {
            const data = await apiCall('/auth/profile');
            if (data.success && data.data.driver) {
                const d = data.data.driver;
                const el = id => document.getElementById(id);
                if(el('dName'))     el('dName').value     = d.nombre_completo||'';
                if(el('dAge'))      el('dAge').value      = d.edad||'';
                if(el('dPhone1'))   el('dPhone1').value   = d.telefono_1||'';
                if(el('dPhone2'))   el('dPhone2').value   = d.telefono_2||'';
                if(el('dWhatsapp')) el('dWhatsapp').value = d.whatsapp||'';
            }
        } catch(e) {}
    }

    static async updateProfile(event) {
        event.preventDefault();
        try {
            await apiCall('/drivers/profile', { method:'PUT', body: getFormData(event.target) });
            showToast('Datos actualizados', 'success');
        } catch(e) { showToast(e.message,'error'); }
    }

    // ============ VEHÍCULO ============

    static getVehicleHTML() {
        return `<div class="card"><div class="card-header"><h4 class="card-title"><i class="fas fa-truck"></i> Mi Vehículo</h4><button class="btn btn-primary btn-sm" onclick="DriverPanel.showVehicleForm()"><i class="fas fa-plus"></i> Registrar</button></div><div id="vehicleInfo" class="card-body"><div class="empty-state">Cargando...</div></div></div>`;
    }

    static async loadVehicle() {
        try {
            const data = await apiCall('/drivers/vehicles');
            if (data.success && data.data.length > 0) {
                const v = data.data[0];
                const fotoHTML = v.foto_vehiculo
                    ? `<img src="${v.foto_vehiculo}" alt="Vehículo" class="vehicle-photo">`
                    : `<div class="vehicle-photo-placeholder"><i class="fas fa-truck"></i></div>`;
                document.getElementById('vehicleInfo').innerHTML = `
                <div class="vehicle-card-layout">
                    ${fotoHTML}
                    <div>
                        <h3>${v.marca||''} ${v.modelo||''}</h3>
                        <p><i class="fas fa-hashtag"></i> Placa: <strong>${v.placa}</strong></p>
                        <p><i class="fas fa-palette"></i> Color: ${v.color||'—'}</p>
                        <p><i class="fas fa-users"></i> Capacidad: <strong>${v.capacidad||'—'}</strong> pasajeros</p>
                        <button class="btn btn-primary btn-sm" onclick="DriverPanel.showVehicleForm(${v.id})"><i class="fas fa-edit"></i> Editar</button>
                    </div>
                </div>`;
            } else {
                document.getElementById('vehicleInfo').innerHTML = '<div class="empty-state"><i class="fas fa-truck"></i><p>No hay vehículo registrado</p></div>';
            }
        } catch(e) {}
    }

    static showVehicleForm(id=null) {
        openModal(id ? 'Editar Vehículo' : 'Registrar Vehículo', `
        <form onsubmit="DriverPanel.saveVehicle(event, ${id})">
            <div class="form-group"><label>Placa <span class="text-danger">*</span></label><input type="text" name="plate" class="form-control" required placeholder="Ej: ABC-123"></div>
            <div class="grid-2">
                <div class="form-group"><label>Marca</label><input type="text" name="brand" class="form-control" placeholder="Ej: Toyota"></div>
                <div class="form-group"><label>Modelo</label><input type="text" name="model" class="form-control" placeholder="Ej: Hiace"></div>
            </div>
            <div class="grid-2">
                <div class="form-group"><label>Color</label><input type="text" name="color" class="form-control"></div>
                <div class="form-group"><label>Capacidad (pasajeros) <span class="text-danger">*</span></label><input type="number" name="capacity" class="form-control" min="1" max="50" required></div>
            </div>
            <div class="form-group">
                <label>Foto del vehículo (opcional)</label>
                <input type="file" name="photo" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" class="form-control">
                <p class="settings-desc">JPEG, PNG o WEBP, máximo 5MB.</p>
            </div>
            <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-save"></i> Guardar</button>
        </form>`);
    }

    static async saveVehicle(event, id) {
        event.preventDefault();
        try {
            await apiCall(id ? `/drivers/vehicles/${id}` : '/drivers/vehicles', { method: id?'PUT':'POST', body: new FormData(event.target) });
            closeModal(); showToast('Vehículo guardado','success'); DriverPanel.loadVehicle();
        } catch(e) { showToast(e.message,'error'); }
    }

    // ============ HORARIOS ============

    static getSchedulesHTML() {
        return `<div class="card"><div class="card-header"><h4 class="card-title"><i class="fas fa-calendar-alt"></i> Horarios de Salida</h4><button class="btn btn-primary btn-sm" onclick="DriverPanel.showScheduleForm()"><i class="fas fa-plus"></i> Agregar</button></div><div id="schedulesList" class="card-body"><div class="empty-state">Cargando...</div></div></div>`;
    }

    static async loadSchedules() {
        try {
            const data = await apiCall('/route-config/schedules');
            if (data.data && data.data.length > 0) {
                document.getElementById('schedulesList').innerHTML = `<div class="grid-2">${data.data.map(s=>`
                    <div class="schedule-item">
                        <i class="fas fa-clock"></i> <span>${formatTime12h(s.hora_salida)}</span>
                        <button class="btn-icon btn-delete" onclick="DriverPanel.deleteSchedule(${s.id})" title="Eliminar"><i class="fas fa-times"></i></button>
                    </div>`).join('')}</div><p class="settings-desc" style="margin-top:8px">Máximo 4 horarios.</p>`;
            } else {
                document.getElementById('schedulesList').innerHTML = '<div class="empty-state"><i class="fas fa-clock"></i><p>Sin horarios registrados</p></div>';
            }
        } catch(e) { document.getElementById('schedulesList').innerHTML = '<div class="empty-state">Error al cargar</div>'; }
    }

    static showScheduleForm() {
        openModal('Agregar Horario', `<form onsubmit="DriverPanel.saveSchedule(event)"><div class="form-group"><label>Hora de salida</label>${TimePicker.render('departure_time')}</div><button type="submit" class="btn btn-primary btn-block">Guardar</button></form>`);
    }

    static async saveSchedule(event) {
        event.preventDefault();
        try {
            const hora24h = TimePicker.readValue(event.target, 'departure_time');
            await apiCall('/route-config/schedules', { method:'POST', body: { departure_time: hora24h } });
            closeModal(); showToast('Horario guardado','success'); DriverPanel.loadSchedules();
        } catch(e) { showToast(e.message,'error'); }
    }

    static async deleteSchedule(id) {
        if (!await confirmAction('¿Eliminar horario?')) return;
        try {
            await apiCall(`/route-config/schedules/${id}`, { method:'DELETE' });
            showToast('Eliminado','success'); DriverPanel.loadSchedules();
        } catch(e) { showToast(e.message,'error'); }
    }

    // ============ RUTAS ============

    static getRoutesHTML() {
        return `<div class="card"><div class="card-header"><h4 class="card-title"><i class="fas fa-map-marked-alt"></i> Mis Rutas</h4><button class="btn btn-primary btn-sm" onclick="DriverPanel.showRouteForm()"><i class="fas fa-plus"></i> Agregar</button></div>
        <div class="table-container"><table><thead><tr><th>Origen</th><th>Destino</th><th>Precio</th><th></th></tr></thead>
        <tbody id="routesTableBody"><tr><td colspan="4"><div class="empty-state">Cargando...</div></td></tr></tbody></table></div>
        <p class="settings-desc" style="padding:12px">Máximo 8 rutas activas.</p></div>`;
    }

    static async loadRoutes() {
        try {
            const data = await apiCall('/route-config/routes');
            const tbody = document.getElementById('routesTableBody');
            if (data.data && data.data.length > 0) {
                tbody.innerHTML = data.data.map(r=>`<tr>
                    <td>${r.origen}</td><td>${r.destino}</td><td>${formatCurrency(r.precio)}</td>
                    <td><button class="btn-icon btn-delete" onclick="DriverPanel.deleteRoute(${r.id})" title="Eliminar"><i class="fas fa-trash"></i></button></td>
                </tr>`).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state">Sin rutas registradas</div></td></tr>';
            }
        } catch(e) {}
    }

    static showRouteForm() {
        openModal('Agregar Ruta', `<form onsubmit="DriverPanel.saveRoute(event)">
            <div class="grid-2">
                <div class="form-group"><label>Origen <span class="text-danger">*</span></label><input type="text" name="origin" class="form-control" required placeholder="Ej: Trujillo Centro"></div>
                <div class="form-group"><label>Destino <span class="text-danger">*</span></label><input type="text" name="destination" class="form-control" required placeholder="Ej: Huanchaco"></div>
            </div>
            <div class="form-group"><label>Precio S/ por pasajero <span class="text-danger">*</span></label><input type="number" name="price" class="form-control" step="0.50" min="0.50" required></div>
            <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-save"></i> Guardar Ruta</button>
        </form>`);
    }

    static async saveRoute(event) {
        event.preventDefault();
        try {
            await apiCall('/route-config/routes', { method:'POST', body: getFormData(event.target) });
            closeModal(); showToast('Ruta guardada','success'); DriverPanel.loadRoutes();
        } catch(e) { showToast(e.message,'error'); }
    }

    static async deleteRoute(id) {
        if (!await confirmAction('¿Eliminar esta ruta?')) return;
        try {
            await apiCall(`/route-config/routes/${id}`, { method:'DELETE' });
            showToast('Ruta eliminada','success'); DriverPanel.loadRoutes();
        } catch(e) { showToast(e.message,'error'); }
    }

    static getOrdersHTML() {
        return `<div class="card"><div class="card-header"><h4 class="card-title"><i class="fas fa-clipboard-list"></i> Pedidos Pendientes</h4></div><div id="ordersContent" class="card-body"><div class="empty-state">Cargando...</div></div></div>`;
    }

    static async loadOrders() {
        try {
            const data = await apiCall('/orders/driver/orders');
            const encomiendas = data.data?.encomiendas || [];
            const viajes = data.data?.viajes || [];
            if (encomiendas.length === 0 && viajes.length === 0) {
                document.getElementById('ordersContent').innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No hay pedidos pendientes</p></div>';
                return;
            }

            const renderPedido = (p, tipo) => {
                const esEnc = tipo === 'encomiendas';
                const mapsLink = p.origen_lat && p.origen_lng ? MapPicker.buildMapsLink(p.origen_lat, p.origen_lng) : null;
                return `
                <div class="pedido-card">
                    <div class="pedido-card-header">
                        <span class="badge ${esEnc ? 'badge-primary' : 'badge-success'}"><i class="fas ${esEnc?'fa-box':'fa-route'}"></i> ${esEnc?'Encomienda':'Viaje'}</span>
                        <span class="text-muted" style="font-size:12px;margin-left:auto">${formatDateShort(p.fecha_creacion)}</span>
                    </div>
                    <div class="pedido-card-body">
                        <div><strong>${p.origen}</strong> → <strong>${p.destino}</strong></div>
                        ${mapsLink ? `<a href="${mapsLink}" target="_blank" class="maps-link"><i class="fas fa-map-marked-alt"></i> Ver ubicación en Maps</a>` : ''}
                        <div class="text-muted" style="font-size:13px">Cliente: ${p.nombre_usuario || '—'}</div>
                        ${esEnc && p.nombre_receptor ? `<div class="text-muted" style="font-size:13px">Receptor: ${p.nombre_receptor} ${p.contacto_receptor ? '· '+p.contacto_receptor : ''}</div>` : ''}
                        ${!esEnc && p.cantidad_pasajeros ? `<div class="text-muted" style="font-size:13px">${p.cantidad_pasajeros} pasajero(s) · ${formatTime12h(p.hora_salida)}</div>` : ''}
                        ${!esEnc && p.notas ? `<div class="text-muted" style="font-size:13px">Notas: ${p.notas}</div>` : ''}
                    </div>
                    <div class="pedido-card-footer">
                        <button class="btn btn-success btn-sm" onclick="DriverPanel.completeOrder('${esEnc?'parcels':'trips'}', ${p.id})">
                            <i class="fas fa-check"></i> Marcar como culminado
                        </button>
                    </div>
                </div>`;
            };

            document.getElementById('ordersContent').innerHTML = `
            <div class="pedidos-list">
                ${encomiendas.map(p => renderPedido(p,'encomiendas')).join('')}
                ${viajes.map(p => renderPedido(p,'viajes')).join('')}
            </div>`;
        } catch(e) { document.getElementById('ordersContent').innerHTML = '<div class="empty-state">Error al cargar</div>'; }
    }

    static async completeOrder(type, id) {
        if (!await confirmAction('¿Marcar este pedido como culminado?')) return;
        try {
            await apiCall(`/orders/driver/${type}/${id}/complete`, { method:'POST' });
            showToast('¡Pedido culminado!','success');
            DriverPanel.loadOrders();
            DriverPanel.loadDashboardStats();
        } catch(e) { showToast(e.message,'error'); }
    }

    static getHistoryHTML() {
        return `<div class="card"><div class="card-header"><h4 class="card-title"><i class="fas fa-chart-line"></i> Historial de Pedidos</h4></div><div class="card-body"><div id="historyContent"><div class="empty-state">Cargando...</div></div></div></div>`;
    }

    static async loadHistory() {
        try {
            const data = await apiCall('/orders/driver/completed');
            const pedidos = data.data?.pedidos || [];
            const total = data.data?.totalGanancias || 0;
            if (!pedidos.length) { document.getElementById('historyContent').innerHTML='<div class="empty-state">Sin historial aún</div>'; return; }
            document.getElementById('historyContent').innerHTML = `
            <div class="alert alert-success"><i class="fas fa-money-bill-wave"></i> Total estimado: <strong>${formatCurrency(total)}</strong></div>
            <div class="table-container"><table>
                <thead><tr><th>Tipo</th><th>Ruta</th><th>Pasajeros</th><th>Precio</th><th>Fecha</th></tr></thead>
                <tbody>${pedidos.map(p=>`<tr>
                    <td><span class="badge ${p.tipo_pedido==='encomienda'?'badge-primary':'badge-success'}">${p.tipo_pedido==='encomienda'?'Encomienda':'Viaje'}</span></td>
                    <td>${p.origen} → ${p.destino}</td>
                    <td>${p.tipo_pedido==='viaje' ? (p.cantidad_pasajeros ?? '-') : '-'}</td>
                    <td>${formatCurrency(p.precio)}</td>
                    <td>${formatDateShort(p.fecha_culminacion)}</td>
                </tr>`).join('')}</tbody>
            </table></div>`;
        } catch(e) { document.getElementById('historyContent').innerHTML='<div class="empty-state">Error al cargar</div>'; }
    }

    static async loadReviews() {
        document.getElementById('sectionContent').innerHTML = await Ratings.renderDriverReviewsHTML();
    }

    static async loadSubscription() {
        document.getElementById('sectionContent').innerHTML = await Subscription.renderSectionHTML();
    }

    static getSettingsHTML() {
        const currentTheme = getSavedTheme();
        return `
        <div class="card">
            <div class="card-header"><div class="card-title"><i class="fas fa-palette"></i> Apariencia</div></div>
            <div class="card-body">
                <div class="settings-row">
                    <div><strong>Tema de la aplicación</strong><p class="settings-desc">Elige entre modo claro u oscuro</p></div>
                    <div class="theme-toggle">
                        <button class="theme-btn ${currentTheme==='claro'?'active':''}" onclick="DriverPanel.changeTheme('claro')"><i class="fas fa-sun"></i> Claro</button>
                        <button class="theme-btn ${currentTheme==='oscuro'?'active':''}" onclick="DriverPanel.changeTheme('oscuro')"><i class="fas fa-moon"></i> Oscuro</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="card" style="margin-top:20px">
            <div class="card-header"><div class="card-title"><i class="fas fa-shield-alt"></i> Cuenta</div></div>
            <div class="card-body">
                <div class="settings-row">
                    <div><strong>Cerrar sesión</strong><p class="settings-desc">Cierra tu sesión en este dispositivo</p></div>
                    <button class="btn btn-secondary" onclick="App.logout()"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</button>
                </div>
            </div>
        </div>
        <div class="card" style="margin-top:20px;border:1px solid var(--danger)">
            <div class="card-header"><div class="card-title" style="color:var(--danger)"><i class="fas fa-exclamation-triangle"></i> Zona de peligro</div></div>
            <div class="card-body">
                <div class="settings-row">
                    <div><strong>Eliminar mi cuenta</strong><p class="settings-desc">Permanente e irreversible. Tus rutas, horarios y vehículos también quedarán inactivos.</p></div>
                    <button class="btn btn-danger" onclick="DriverPanel.confirmDeleteAccount()"><i class="fas fa-trash"></i> Eliminar cuenta</button>
                </div>
            </div>
        </div>`;
    }

    static loadSettings() {}

    static changeTheme(theme) {
        setSavedTheme(theme);
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        event.target.closest('.theme-btn')?.classList.add('active');
        apiCall('/auth/theme', { method:'PUT', body: { theme } }).catch(()=>{});
    }

    static confirmDeleteAccount() {
        openModal(
            `<i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i> Eliminar cuenta`,
            `<p>Esta acción es permanente. Tu perfil de conductor, vehículos y rutas quedarán desactivados.</p>
             <form onsubmit="DriverPanel.executeDeleteAccount(event)">
                <div class="form-group"><label>Confirma tu contraseña</label><input type="password" name="password" class="form-control" placeholder="(vacío si entraste con Google)"></div>
                <button type="submit" class="btn btn-danger btn-block"><i class="fas fa-trash"></i> Sí, eliminar mi cuenta</button>
             </form>`
        );
    }

    static async executeDeleteAccount(event) {
        event.preventDefault();
        try {
            await apiCall('/auth/account', { method:'DELETE', body:{ password: event.target.password.value } });
            closeModal(); showToast('Tu cuenta ha sido eliminada','success');
            setTimeout(() => App.logout(), 800);
        } catch(e) { showToast(e.message,'error'); }
    }
}
