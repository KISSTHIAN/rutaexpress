class UserPanel {
    static render() {
        const user = getUser();
        if (!user || (user.role !== 'user' && user.role !== 'usuario')) { AuthViews.renderLogin(); return; }

        document.getElementById('app').innerHTML = `
        <div class="dashboard-layout">
            <div class="mobile-overlay" id="mobileOverlay" onclick="closeMobileSidebar()"></div>
            <aside class="sidebar" id="appSidebar">
                <div class="sidebar-logo">
                    <h3>Ruta Express</h3>
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
                    <div class="sidebar-section-label">Cuenta</div>
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
        const titles = { dashboard:'Dashboard', profile:'Mi Perfil', parcels:'Encomiendas', trips:'Viajes', status:'Mis Pedidos', settings:'Ajustes' };
        const icons  = { dashboard:'fa-home', profile:'fa-user-circle', parcels:'fa-box', trips:'fa-route', status:'fa-tasks', settings:'fa-cog' };
        document.getElementById('sectionTitle').innerHTML = `<i class="fas ${icons[section]||'fa-circle'}"></i> ${titles[section]||section}`;

        const methods = { dashboard:UserPanel.getDashboardHTML, profile:UserPanel.getProfileHTML, parcels:UserPanel.getParcelsHTML, trips:UserPanel.getTripsHTML, status:UserPanel.getStatusHTML, settings:UserPanel.getSettingsHTML };
        document.getElementById('sectionContent').innerHTML = (methods[section]||(() => ''))();

        const asyncLoads = { dashboard:UserPanel.loadDashboardStats, profile:UserPanel.loadProfile, parcels:UserPanel.loadParcels, trips:UserPanel.loadTrips, status:UserPanel.loadStatus, settings:UserPanel.loadSettings };
        if (asyncLoads[section]) setTimeout(asyncLoads[section], 200);
    }

    static getDashboardHTML() {
        return `
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-icon" style="background:#dbeafe;color:#2563eb"><i class="fas fa-box"></i></div><div class="stat-info"><div class="stat-value" id="statParcels">—</div><div class="stat-label">Encomiendas</div></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#d1fae5;color:#10b981"><i class="fas fa-check-circle"></i></div><div class="stat-info"><div class="stat-value" id="statCompleted">—</div><div class="stat-label">Culminados</div></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#fef3c7;color:#f59e0b"><i class="fas fa-clock"></i></div><div class="stat-info"><div class="stat-value" id="statInProcess">—</div><div class="stat-label">En Proceso</div></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#ede9fe;color:#7c3aed"><i class="fas fa-route"></i></div><div class="stat-info"><div class="stat-value" id="statTrips">—</div><div class="stat-label">Viajes</div></div></div>
        </div>
        <div class="grid-2" style="margin-top:20px">
            <div class="card"><div class="card-header"><h4 class="card-title">Acciones Rápidas</h4></div>
            <div class="card-body" style="display:grid;gap:12px">
                <button class="btn btn-primary" onclick="UserPanel.showSection('parcels',null);setTimeout(UserPanel.showParcelForm,300)"><i class="fas fa-box"></i> Nueva Encomienda</button>
                <button class="btn btn-success" onclick="UserPanel.showSection('trips',null);setTimeout(UserPanel.showTripForm,300)"><i class="fas fa-route"></i> Nuevo Viaje</button>
                <button class="btn btn-secondary" onclick="UserPanel.showSection('status',null)"><i class="fas fa-tasks"></i> Ver Mis Pedidos</button>
            </div></div>
            <div class="card"><div class="card-header"><h4 class="card-title">Información</h4></div>
            <div class="card-body">
                <div class="alert alert-info"><i class="fas fa-shield-alt"></i> Todos tus envíos están rastreados en tiempo real.</div>
                <p style="margin-top:8px">Soporte: <strong>0800-12345</strong></p>
                <p>soporte@rutaexpress.pe</p>
            </div></div>
        </div>`;
    }

    static async loadDashboardStats() {
        try {
            const [parcels, trips] = await Promise.all([
                apiCall('/orders/parcels').catch(()=>({data:[]})),
                apiCall('/orders/trips').catch(()=>({data:[]}))
            ]);
            const p = parcels.data||[], t = trips.data||[];
            const all = [...p,...t];
            const el = id => document.getElementById(id);
            if(el('statParcels'))  el('statParcels').textContent  = p.length;
            if(el('statCompleted'))el('statCompleted').textContent= all.filter(x=>x.estado==='culminado').length;
            if(el('statInProcess'))el('statInProcess').textContent= all.filter(x=>x.estado==='en_proceso').length;
            if(el('statTrips'))    el('statTrips').textContent    = t.length;
        } catch(e) {}
    }

    static getProfileHTML() {
        const user = getUser();
        return `<div class="card"><div class="card-header"><h4 class="card-title">Mi Perfil</h4></div><div class="card-body">
            <div style="text-align:center;margin-bottom:24px">
                <div class="user-avatar" style="width:80px;height:80px;font-size:32px;margin:0 auto 12px">${(user?.username||'U')[0].toUpperCase()}</div>
                <h3>${user?.username}</h3><p style="color:var(--text-muted)">${user?.email}</p>
            </div>
            <form id="profileForm" onsubmit="UserPanel.updateProfile(event)">
                <div class="grid-2">
                    <div class="form-group"><label>Usuario</label><input type="text" name="username" id="profileUsername" class="form-control" required></div>
                    <div class="form-group"><label>Correo</label><input type="email" name="email" id="profileEmail" class="form-control" required></div>
                </div>
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar Cambios</button>
            </form>
        </div></div>`;
    }

    static async loadProfile() {
        try {
            const data = await apiCall('/auth/profile');
            if (data.success) {
                const el = id => document.getElementById(id);
                if(el('profileUsername')) el('profileUsername').value = data.data.username||'';
                if(el('profileEmail'))    el('profileEmail').value    = data.data.email||'';
            }
        } catch(e) { showToast('Error al cargar perfil', 'error'); }
    }

    static async updateProfile(event) {
        event.preventDefault();
        try {
            await apiCall('/auth/profile', { method:'PUT', body: getFormData(event.target) });
            showToast('Perfil actualizado', 'success');
            const user = getUser(); if(user){ user.username=event.target.username.value; setUser(user); }
        } catch(e) { showToast(e.message,'error'); }
    }
    
    static getParcelsHTML() {
        return `<div class="card"><div class="card-header">
            <h4 class="card-title"><i class="fas fa-box"></i> Mis Encomiendas</h4>
            <button class="btn btn-primary btn-sm" onclick="UserPanel.showParcelForm()"><i class="fas fa-plus"></i> Nueva</button>
        </div>
        <div class="table-container"><table>
            <thead><tr><th>Descripción</th><th>Origen</th><th>Destino</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody id="parcelsTableBody"><tr><td colspan="5"><div class="empty-state">Cargando...</div></td></tr></tbody>
        </table></div></div>`;
    }

    static async loadParcels() {
        try {
            const data = await apiCall('/orders/parcels');
            const tbody = document.getElementById('parcelsTableBody');
            if (data.success && data.data.length > 0) {
                tbody.innerHTML = data.data.map(p => `
                <tr>
                    <td>${(p.descripcion||'').substring(0,40)}</td>
                    <td>${p.origen}</td><td>${p.destino}</td>
                    <td>${getStatusBadge(p.estado)}</td>
                    <td>
                        ${p.estado==='en_proceso'&&!p.conductor_id
                            ? `<button class="btn-icon btn-delete" onclick="UserPanel.deleteParcel(${p.id})" title="Eliminar"><i class="fas fa-trash"></i></button>`
                            : '—'}
                    </td>
                </tr>`).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><i class="fas fa-box-open"></i><p>No hay encomiendas aún</p></div></td></tr>';
            }
        } catch(e) { showToast('Error al cargar encomiendas','error'); }
    }

    /**
     * Genera el selector guiado "Origen -> Destino": el cliente elige
     * primero un origen (de la lista real de orígenes que ofrecen los
     * conductores) y el campo Destino se llena solo con los destinos
     * reales disponibles desde ese origen — así el cliente nunca ve una
     * combinación que ningún conductor ofrece. Funciona para 'parcel' y
     * 'trip' usando el mismo cache de rutas (_parcelRoutesCache / _tripRoutesCache).
     */
    static buildOriginDestinoSelector(rutas, tipo) {
        const rutasConOrigen = rutas.filter(r => !r.sin_ruta && r.origen && r.destino);
        if (rutasConOrigen.length === 0) return '';

        const origenes = [...new Set(rutasConOrigen.map(r => r.origen))].sort();

        return `
        <div class="form-group">
            <label><i class="fas fa-map-marker-alt" style="color:var(--primary)"></i> Origen</label>
            <select id="${tipo}OriginSelect" class="form-control" onchange="UserPanel.onOriginChange('${tipo}')">
                <option value="">-- Elige un origen --</option>
                ${origenes.map(o => `<option value="${o.replace(/"/g,'&quot;')}">${o}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label><i class="fas fa-map-marker-alt" style="color:var(--danger)"></i> Destino</label>
            <select id="${tipo}DestinoSelect" class="form-control" onchange="UserPanel.onDestinoChange('${tipo}')" disabled>
                <option value="">-- Primero elige un origen --</option>
            </select>
        </div>
        <p class="form-hint" style="margin:-8px 0 12px;color:var(--text-secondary);font-size:.85em">
            <i class="fas fa-info-circle"></i> O elige directamente un conductor de la lista de abajo.
        </p>`;
    }

    static onOriginChange(tipo) {
        const origenSelect = document.getElementById(`${tipo}OriginSelect`);
        const destinoSelect = document.getElementById(`${tipo}DestinoSelect`);
        const origen = origenSelect.value;
        const cache = tipo === 'trip' ? UserPanel._tripRoutesCache : UserPanel._parcelRoutesCache;

        if (!origen) {
            destinoSelect.innerHTML = '<option value="">-- Primero elige un origen --</option>';
            destinoSelect.disabled = true;
            return;
        }
        const disponibles = cache.filter(r => !r.sin_ruta && r.origen === origen && !r.vehiculo_lleno);

        if (disponibles.length === 0) {
            destinoSelect.innerHTML = '<option value="">-- Sin destinos disponibles ahora mismo --</option>';
            destinoSelect.disabled = true;
            return;
        }

        destinoSelect.disabled = false;
        destinoSelect.innerHTML = `<option value="">-- Elige un destino (${disponibles.length} opción${disponibles.length>1?'es':''}) --</option>` +
            disponibles.map(r => {
                const etiqueta = disponibles.filter(x => x.destino === r.destino).length > 1
                    ? `${r.destino} (${r.nombre_completo}, S/ ${parseFloat(r.precio).toFixed(2)})`
                    : `${r.destino} — S/ ${parseFloat(r.precio).toFixed(2)}`;
                return `<option value="${r.id}">${etiqueta}</option>`;
            }).join('');
    }

    static onDestinoChange(tipo) {
        const destinoSelect = document.getElementById(`${tipo}DestinoSelect`);
        const routeId = destinoSelect.value;
        if (!routeId) return;

        if (tipo === 'trip') {
            UserPanel.selectTripRoute(parseInt(routeId, 10));
        } else {
            UserPanel.selectParcelRoute(parseInt(routeId, 10));
        }

        document.querySelector(`[data-route-id="${routeId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    static async showParcelForm() {
        openModal('<i class="fas fa-box"></i> Nueva Encomienda', `<div id="parcelFormContainer"><div class="empty-state"><i class="fas fa-spinner fa-spin"></i> Cargando conductores disponibles...</div></div>`);
        try {
            const data = await apiCall('/route-config/routes/available');
            const rutas = data.data || [];
            document.getElementById('parcelFormContainer').innerHTML = UserPanel.buildParcelFormHTML(rutas);
        } catch(e) {
            document.getElementById('parcelFormContainer').innerHTML = `
            <div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> No se pudieron cargar las rutas.</div>
            <button class="btn btn-secondary btn-block" onclick="UserPanel.showParcelManualForm()">Continuar sin ruta</button>`;
        }
    }

    static _parcelRoutesCache = [];

    static buildParcelFormHTML(rutas) {
        UserPanel._parcelRoutesCache = rutas;
        if (!rutas.length) {
            return `<div class="alert alert-info"><i class="fas fa-info-circle"></i> No hay conductores disponibles en este momento.</div>
            <button class="btn btn-secondary btn-block" onclick="UserPanel.showParcelManualForm()">Continuar con origen/destino manual</button>`;
        }

        const tarjetas = rutas.map(r => {
            if (r.sin_ruta) {
                return `
                <div class="driver-card" data-conductor-id="${r.conductor_id}"
                     onclick="UserPanel.selectParcelDriver(${r.conductor_id})" style="cursor:pointer">
                    <div class="driver-card-info">
                        <div class="driver-card-name"><i class="fas fa-user-circle"></i> ${r.nombre_completo||'Conductor'}</div>
                        <div class="driver-card-meta">
                            <span><i class="fas fa-route"></i> Sin ruta fija — tú indicas origen y destino</span>
                            ${r.placa ? `<span><i class="fas fa-car"></i> ${r.placa}</span>` : ''}
                            ${r.capacidad_vehiculo ? `<span><i class="fas fa-users"></i> ${r.capacidad_vehiculo} asientos</span>` : ''}
                        </div>
                        <div class="driver-card-rating">${Ratings.renderStars(r.rating_promedio, r.rating_total)}</div>
                    </div>
                    <span class="badge badge-success"><i class="fas fa-circle"></i> Disponible</span>
                </div>`;
            }
            return `
            <div class="driver-card ${r.vehiculo_lleno ? 'driver-card-full' : ''}" data-route-id="${r.id}"
                 onclick="${r.vehiculo_lleno ? '' : `UserPanel.selectParcelRoute(${r.id})`}"
                 style="${r.vehiculo_lleno ? 'opacity:.55;cursor:not-allowed' : 'cursor:pointer'}">
                <div class="driver-card-info">
                    <div class="driver-card-name"><i class="fas fa-user-circle"></i> ${r.nombre_completo||'Conductor'}</div>
                    <div class="driver-card-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${r.origen} → ${r.destino}</span>
                        <span><i class="fas fa-tag"></i> S/ ${parseFloat(r.precio).toFixed(2)}</span>
                        ${r.placa ? `<span><i class="fas fa-car"></i> ${r.placa}</span>` : ''}
                        ${r.capacidad_vehiculo ? `<span><i class="fas fa-users"></i> ${r.asientos_disponibles} de ${r.capacidad_vehiculo} asientos</span>` : ''}
                    </div>
                    <div class="driver-card-rating">${Ratings.renderStars(r.rating_promedio, r.rating_total)}</div>
                </div>
                ${r.vehiculo_lleno
                    ? `<span class="badge badge-danger"><i class="fas fa-ban"></i> Vehículo lleno</span>`
                    : `<span class="badge badge-success"><i class="fas fa-circle"></i> Disponible</span>`}
            </div>`;
        }).join('');

        return `
        <form id="parcelForm" onsubmit="UserPanel.saveParcel(event)">
            <input type="hidden" name="route_id" id="parcelSelectedRoute">
            <input type="hidden" name="conductor_id" id="parcelSelectedConductor">
            ${UserPanel.buildOriginDestinoSelector(rutas, 'parcel')}
            <div class="form-group">
                <label><i class="fas fa-car"></i> Elige un conductor disponible</label>
                <div class="driver-card-list">${tarjetas}</div>
                <div id="parcelRouteInfo"></div>
            </div>
            <div class="form-group">
                <label><i class="fas fa-box"></i> Descripción del paquete</label>
                <textarea name="description" class="form-control" rows="2" required placeholder="Describe el paquete (tamaño, fragil, etc.)"></textarea>
            </div>

            <div class="form-group">
                <label><i class="fas fa-map-marker-alt" style="color:var(--primary)"></i> Punto exacto de recojo</label>
                <input type="text" name="origin" id="parcelOriginText" class="form-control" placeholder="Dirección de recojo...">
                <div id="mapParcelOrigin" style="margin-top:8px"></div>
            </div>

            <div class="form-group">
                <label><i class="fas fa-map-marker-alt" style="color:var(--danger)"></i> Punto exacto de entrega</label>
                <input type="text" name="destination" id="parcelDestinationText" class="form-control" placeholder="Dirección de entrega...">
                <div id="mapParcelDestination" style="margin-top:8px"></div>
            </div>

            <div class="grid-2">
                <div class="form-group"><label>Referencia de recojo</label><input type="text" name="origin_reference" class="form-control" placeholder="Ej: frente al parque, 2do piso"></div>
                <div class="form-group"><label>Referencia de entrega</label><input type="text" name="destination_reference" class="form-control" placeholder="Ej: casa verde, dejar en portería"></div>
            </div>
            <div class="grid-2">
                <div class="form-group"><label>Nombre de quien recibe <span class="text-danger">*</span></label><input type="text" name="receiver_name" class="form-control" required></div>
                <div class="form-group"><label>Contacto de quien recibe</label><input type="tel" name="receiver_contact" class="form-control" placeholder="Celular (opcional)"></div>
            </div>
            <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-paper-plane"></i> Crear Encomienda</button>
        </form>
        <div class="auth-link" style="margin-top:10px"><a href="#" onclick="UserPanel.showParcelManualForm();return false;">Prefiero ingresar origen/destino manualmente</a></div>`;
    }

    static selectParcelRoute(routeId) {
        document.querySelectorAll('.driver-card').forEach(c => c.classList.remove('driver-card-selected'));
        document.querySelector(`[data-route-id="${routeId}"]`)?.classList.add('driver-card-selected');
        document.getElementById('parcelSelectedRoute').value = routeId;
        document.getElementById('parcelSelectedConductor').value = '';

        const ruta = UserPanel._parcelRoutesCache.find(r => String(r.id) === String(routeId));
        const info = document.getElementById('parcelRouteInfo');
        if (ruta) {
            info.innerHTML = `<div class="alert alert-success" style="margin-top:8px">
                <i class="fas fa-check-circle"></i>
                Conductor seleccionado: <strong>${ruta.nombre_completo}</strong> · Ruta: ${ruta.origen} → ${ruta.destino}
            </div>`;
        }

        document.getElementById('parcelOriginText')?.removeAttribute('required');
        document.getElementById('parcelDestinationText')?.removeAttribute('required');

        setTimeout(() => {
            MapPicker.render('mapParcelOrigin', { fieldPrefix: 'origin', addressFieldName: 'origin' });
            MapPicker.render('mapParcelDestination', { fieldPrefix: 'destination', addressFieldName: 'destination' });
        }, 150);
    }

    static selectParcelDriver(conductorId) {
        document.querySelectorAll('.driver-card').forEach(c => c.classList.remove('driver-card-selected'));
        document.querySelector(`[data-conductor-id="${conductorId}"]`)?.classList.add('driver-card-selected');
        document.getElementById('parcelSelectedConductor').value = conductorId;
        document.getElementById('parcelSelectedRoute').value = '';

        const conductor = UserPanel._parcelRoutesCache.find(r => r.sin_ruta && String(r.conductor_id) === String(conductorId));
        const info = document.getElementById('parcelRouteInfo');
        if (conductor) {
            info.innerHTML = `<div class="alert alert-success" style="margin-top:8px">
                <i class="fas fa-check-circle"></i>
                Conductor seleccionado: <strong>${conductor.nombre_completo}</strong> · Indica abajo el origen y destino exactos.
            </div>`;
        }

        // Sin ruta fija, el origen/destino exacto es obligatorio porque no
        // hay ruta de la cual tomarlo por defecto.
        document.getElementById('parcelOriginText')?.setAttribute('required', 'required');
        document.getElementById('parcelDestinationText')?.setAttribute('required', 'required');

        setTimeout(() => {
            MapPicker.render('mapParcelOrigin', { fieldPrefix: 'origin', addressFieldName: 'origin' });
            MapPicker.render('mapParcelDestination', { fieldPrefix: 'destination', addressFieldName: 'destination' });
        }, 150);
    }

    static showParcelManualForm() {
        openModal('<i class="fas fa-box"></i> Nueva Encomienda', `
        <form id="parcelForm" onsubmit="UserPanel.saveParcel(event)">
            <div class="form-group"><label>Descripción</label><textarea name="description" class="form-control" rows="2" required></textarea></div>
            <div class="form-group">
                <label><i class="fas fa-map-marker-alt" style="color:var(--primary)"></i> Origen</label>
                <input type="text" name="origin" id="parcelOriginText" class="form-control" required placeholder="Dirección de recojo">
                <div id="mapParcelOrigin" style="margin-top:8px"></div>
            </div>
            <div class="form-group">
                <label><i class="fas fa-map-marker-alt" style="color:var(--danger)"></i> Destino</label>
                <input type="text" name="destination" id="parcelDestinationText" class="form-control" required placeholder="Dirección de entrega">
                <div id="mapParcelDestination" style="margin-top:8px"></div>
            </div>
            <div class="grid-2">
                <div class="form-group"><label>Nombre receptor <span class="text-danger">*</span></label><input type="text" name="receiver_name" class="form-control" required></div>
                <div class="form-group"><label>Contacto receptor</label><input type="tel" name="receiver_contact" class="form-control"></div>
            </div>
            <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-paper-plane"></i> Crear Encomienda</button>
        </form>`);
        setTimeout(() => {
            MapPicker.render('mapParcelOrigin', { fieldPrefix: 'origin', addressFieldName: 'origin' });
            MapPicker.render('mapParcelDestination', { fieldPrefix: 'destination', addressFieldName: 'destination' });
        }, 300);
    }

    static async saveParcel(event) {
        event.preventDefault();
        const form = event.target;
        const formData = getFormData(form);
        if (!formData.route_id && !formData.origin) { showToast('Selecciona un conductor o ingresa el origen', 'error'); return; }

        try {
            showLoader();
            const res = await apiCall('/orders/parcels', { method:'POST', body: formData });
            hideLoader();
            closeModal();
            UserPanel.loadParcels();

            UserPanel.showWhatsAppConfirm(res.data, 'encomienda', {
                descripcion: formData.description,
                receptor: formData.receiver_name,
                contacto_receptor: formData.receiver_contact,
                ref_origen: formData.origin_reference,
                ref_destino: formData.destination_reference
            });
        } catch(e) {
            hideLoader();
            showToast(e.message||'Error al crear encomienda','error');
        }
    }

    static async deleteParcel(id) {
        if (!await confirmAction('¿Eliminar esta encomienda?')) return;
        try {
            await apiCall(`/orders/parcels/${id}`, { method:'DELETE' });
            showToast('Encomienda eliminada','success');
            UserPanel.loadParcels();
        } catch(e) { showToast(e.message,'error'); }
    }

    static getTripsHTML() {
        return `<div class="card"><div class="card-header">
            <h4 class="card-title"><i class="fas fa-route"></i> Mis Viajes</h4>
            <button class="btn btn-primary btn-sm" onclick="UserPanel.showTripForm()"><i class="fas fa-plus"></i> Nuevo</button>
        </div>
        <div class="table-container"><table>
            <thead><tr><th>Origen</th><th>Destino</th><th>Hora</th><th>Pasajeros</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody id="tripsTableBody"><tr><td colspan="6"><div class="empty-state">Cargando...</div></td></tr></tbody>
        </table></div></div>`;
    }

    static async loadTrips() {
        try {
            const data = await apiCall('/orders/trips');
            const tbody = document.getElementById('tripsTableBody');
            if (data.success && data.data.length > 0) {
                tbody.innerHTML = data.data.map(t => `
                <tr>
                    <td>${t.origen}</td><td>${t.destino}</td>
                    <td>${formatTime12h(t.hora_salida)}</td>
                    <td>${t.cantidad_pasajeros||1}</td>
                    <td>${getStatusBadge(t.estado)}</td>
                    <td>${t.estado==='en_proceso'&&!t.conductor_id
                        ? `<button class="btn-icon btn-delete" onclick="UserPanel.deleteTrip(${t.id})" title="Eliminar"><i class="fas fa-trash"></i></button>`
                        : '—'}</td>
                </tr>`).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="fas fa-route"></i><p>No hay viajes aún</p></div></td></tr>';
            }
        } catch(e) { showToast('Error al cargar viajes','error'); }
    }

    static async showTripForm() {
        openModal('<i class="fas fa-route"></i> Nuevo Viaje', `<div id="tripFormContainer"><div class="empty-state"><i class="fas fa-spinner fa-spin"></i> Cargando conductores disponibles...</div></div>`);
        try {
            const data = await apiCall('/route-config/routes/available');
            const rutas = data.data || [];
            document.getElementById('tripFormContainer').innerHTML = UserPanel.buildTripFormHTML(rutas);
        } catch(e) {
            document.getElementById('tripFormContainer').innerHTML = `
            <div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> No se pudieron cargar las rutas.</div>
            <button class="btn btn-secondary btn-block" onclick="UserPanel.showTripManualForm()">Continuar sin ruta</button>`;
        }
    }

    static _tripRoutesCache = [];

    static buildTripFormHTML(rutas) {
        UserPanel._tripRoutesCache = rutas;
        if (!rutas.length) {
            return `<div class="alert alert-info"><i class="fas fa-info-circle"></i> No hay conductores disponibles en este momento.</div>
            <button class="btn btn-secondary btn-block" onclick="UserPanel.showTripManualForm()">Continuar con datos manuales</button>`;
        }

        const tarjetas = rutas.map(r => {
            if (r.sin_ruta) {
                return `
                <div class="driver-card" data-conductor-id="${r.conductor_id}"
                     onclick="UserPanel.selectTripDriver(${r.conductor_id})" style="cursor:pointer">
                    <div class="driver-card-info">
                        <div class="driver-card-name"><i class="fas fa-user-circle"></i> ${r.nombre_completo||'Conductor'}</div>
                        <div class="driver-card-meta">
                            <span><i class="fas fa-route"></i> Sin ruta fija — tú indicas origen y destino</span>
                            ${r.placa ? `<span><i class="fas fa-car"></i> ${r.placa}${r.marca ? ' · '+r.marca : ''}</span>` : ''}
                            ${r.capacidad_vehiculo ? `<span><i class="fas fa-users"></i> ${r.capacidad_vehiculo} asientos</span>` : ''}
                        </div>
                        <div class="driver-card-rating">${Ratings.renderStars(r.rating_promedio, r.rating_total)}</div>
                    </div>
                    <span class="badge badge-success"><i class="fas fa-circle"></i> Disponible</span>
                </div>`;
            }
            return `
            <div class="driver-card ${r.vehiculo_lleno ? 'driver-card-full' : ''}" data-route-id="${r.id}"
                 onclick="${r.vehiculo_lleno ? '' : `UserPanel.selectTripRoute(${r.id})`}"
                 style="${r.vehiculo_lleno ? 'opacity:.55;cursor:not-allowed' : 'cursor:pointer'}">
                <div class="driver-card-info">
                    <div class="driver-card-name"><i class="fas fa-user-circle"></i> ${r.nombre_completo||'Conductor'}</div>
                    <div class="driver-card-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${r.origen} → ${r.destino}</span>
                        <span><i class="fas fa-tag"></i> S/ ${parseFloat(r.precio).toFixed(2)}/pasajero</span>
                        ${r.placa ? `<span><i class="fas fa-car"></i> ${r.placa}${r.marca ? ' · '+r.marca : ''}</span>` : ''}
                        ${r.capacidad_vehiculo
                            ? `<span><i class="fas fa-users"></i>
                               <strong>${r.asientos_disponibles}</strong> de ${r.capacidad_vehiculo} asientos libres</span>`
                            : ''}
                        ${r.horarios && r.horarios.length
                            ? `<span><i class="fas fa-clock"></i> ${r.horarios.map(h=>formatTime12h(h.hora_salida)).join(' · ')}</span>`
                            : ''}
                    </div>
                    <div class="driver-card-rating">${Ratings.renderStars(r.rating_promedio, r.rating_total)}</div>
                </div>
                ${r.vehiculo_lleno
                    ? `<span class="badge badge-danger"><i class="fas fa-ban"></i> Vehículo lleno</span>`
                    : `<span class="badge badge-success"><i class="fas fa-circle"></i> Disponible</span>`}
            </div>`;
        }).join('');

        return `
        <form id="tripForm" onsubmit="UserPanel.saveTrip(event)">
            <input type="hidden" name="route_id" id="tripSelectedRoute">
            <input type="hidden" name="conductor_id" id="tripSelectedConductor">
            ${UserPanel.buildOriginDestinoSelector(rutas, 'trip')}
            <div class="form-group">
                <label><i class="fas fa-car"></i> Elige un conductor disponible</label>
                <div class="driver-card-list">${tarjetas}</div>
                <div id="tripRouteInfo"></div>
            </div>
            <div id="tripScheduleContainer"></div>
            <div class="form-group">
                <label><i class="fas fa-users"></i> Número de pasajeros</label>
                <input type="number" name="passenger_count" class="form-control" value="1" min="1" max="20">
            </div>

            <div class="form-group">
                <label><i class="fas fa-map-marker-alt" style="color:var(--primary)"></i> Punto exacto de recojo</label>
                <input type="text" name="origin" id="tripOriginText" class="form-control" placeholder="Dirección de recojo...">
                <div id="mapTripOrigin" style="margin-top:8px"></div>
            </div>

            <div class="form-group">
                <label><i class="fas fa-map-marker-alt" style="color:var(--danger)"></i> Punto exacto de destino</label>
                <input type="text" name="destination" id="tripDestinationText" class="form-control" placeholder="Dirección de destino...">
                <div id="mapTripDestination" style="margin-top:8px"></div>
            </div>

            <div class="form-group"><label>Notas para el conductor (opcional)</label><textarea name="notes" class="form-control" rows="2" placeholder="Equipaje especial, paradas, etc."></textarea></div>
            <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-paper-plane"></i> Crear Viaje</button>
        </form>
        <div class="auth-link" style="margin-top:10px"><a href="#" onclick="UserPanel.showTripManualForm();return false;">Prefiero ingresar todo manualmente</a></div>`;
    }

    static selectTripRoute(routeId) {
        document.querySelectorAll('.driver-card').forEach(c => c.classList.remove('driver-card-selected'));
        document.querySelector(`[data-route-id="${routeId}"]`)?.classList.add('driver-card-selected');
        document.getElementById('tripSelectedRoute').value = routeId;
        document.getElementById('tripSelectedConductor').value = '';

        const ruta = UserPanel._tripRoutesCache.find(r => String(r.id) === String(routeId));
        const info = document.getElementById('tripRouteInfo');
        if (ruta) {
            info.innerHTML = `<div class="alert alert-success" style="margin-top:8px">
                <i class="fas fa-check-circle"></i> Conductor: <strong>${ruta.nombre_completo}</strong>
                ${ruta.asientos_disponibles !== null ? ` · ${ruta.asientos_disponibles} asiento(s) disponible(s)` : ''}
            </div>`;
        }

        const container = document.getElementById('tripScheduleContainer');
        const horarios = ruta?.horarios || [];
        if (horarios.length > 0) {
            container.innerHTML = `<div class="form-group"><label><i class="fas fa-clock"></i> Horario de salida</label>
                <select name="schedule_id" class="form-control">
                    ${horarios.map(h=>`<option value="${h.id}">${formatTime12h(h.hora_salida)}</option>`).join('')}
                </select></div>`;
        } else {
            container.innerHTML = `<div class="form-group"><label>Hora de salida deseada</label>${TimePicker.render('departure_time_manual')}</div>`;
        }

        document.getElementById('tripOriginText')?.removeAttribute('required');
        document.getElementById('tripDestinationText')?.removeAttribute('required');

        setTimeout(() => {
            MapPicker.render('mapTripOrigin', { fieldPrefix: 'origin', addressFieldName: 'origin' });
            MapPicker.render('mapTripDestination', { fieldPrefix: 'destination', addressFieldName: 'destination' });
        }, 150);
    }

    static selectTripDriver(conductorId) {
        document.querySelectorAll('.driver-card').forEach(c => c.classList.remove('driver-card-selected'));
        document.querySelector(`[data-conductor-id="${conductorId}"]`)?.classList.add('driver-card-selected');
        document.getElementById('tripSelectedConductor').value = conductorId;
        document.getElementById('tripSelectedRoute').value = '';

        const conductor = UserPanel._tripRoutesCache.find(r => r.sin_ruta && String(r.conductor_id) === String(conductorId));
        const info = document.getElementById('tripRouteInfo');
        if (conductor) {
            info.innerHTML = `<div class="alert alert-success" style="margin-top:8px">
                <i class="fas fa-check-circle"></i> Conductor: <strong>${conductor.nombre_completo}</strong> · Indica abajo origen, destino y hora.
            </div>`;
        }

        const container = document.getElementById('tripScheduleContainer');
        container.innerHTML = `<div class="form-group"><label>Hora de salida deseada</label>${TimePicker.render('departure_time_manual')}</div>`;

        document.getElementById('tripOriginText')?.setAttribute('required', 'required');
        document.getElementById('tripDestinationText')?.setAttribute('required', 'required');

        setTimeout(() => {
            MapPicker.render('mapTripOrigin', { fieldPrefix: 'origin', addressFieldName: 'origin' });
            MapPicker.render('mapTripDestination', { fieldPrefix: 'destination', addressFieldName: 'destination' });
        }, 150);
    }

    static showTripManualForm() {
        openModal('<i class="fas fa-route"></i> Nuevo Viaje', `
        <form id="tripForm" onsubmit="UserPanel.saveTrip(event)">
            <div class="form-group">
                <label><i class="fas fa-map-marker-alt" style="color:var(--primary)"></i> Origen</label>
                <input type="text" name="origin" class="form-control" required placeholder="Dirección de recojo">
                <div id="mapTripOrigin" style="margin-top:8px"></div>
            </div>
            <div class="form-group">
                <label><i class="fas fa-map-marker-alt" style="color:var(--danger)"></i> Destino</label>
                <input type="text" name="destination" class="form-control" required placeholder="Dirección de destino">
                <div id="mapTripDestination" style="margin-top:8px"></div>
            </div>
            <div class="form-group"><label>Hora de salida</label>${TimePicker.render('departure_time_manual')}</div>
            <div class="form-group"><label>Pasajeros</label><input type="number" name="passenger_count" class="form-control" value="1" min="1"></div>
            <div class="form-group"><label>Notas (opcional)</label><textarea name="notes" class="form-control" rows="2"></textarea></div>
            <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-paper-plane"></i> Crear Viaje</button>
        </form>`);
        setTimeout(() => {
            MapPicker.render('mapTripOrigin', { fieldPrefix: 'origin', addressFieldName: 'origin' });
            MapPicker.render('mapTripDestination', { fieldPrefix: 'destination', addressFieldName: 'destination' });
        }, 300);
    }

    static async saveTrip(event) {
        event.preventDefault();
        const form = event.target;
        const formData = getFormData(form);
        const manual24h = TimePicker.readValue(form, 'departure_time_manual');
        if (manual24h) formData.departure_time = manual24h;
        delete formData.departure_time_manual_hour;
        delete formData.departure_time_manual_minute;
        delete formData.departure_time_manual_period;

        if (!formData.route_id && !formData.origin) { showToast('Selecciona un conductor o ingresa el origen','error'); return; }
        if (!formData.route_id && !formData.departure_time) { showToast('Indica la hora de salida','error'); return; }

        try {
            showLoader();
            const res = await apiCall('/orders/trips', { method:'POST', body: formData });
            hideLoader();
            closeModal();
            UserPanel.loadTrips();

            UserPanel.showWhatsAppConfirm(res.data, 'viaje', {
                pasajeros: formData.passenger_count || 1,
                notas: formData.notes
            });
        } catch(e) {
            hideLoader();
            showToast(e.message||'Error al crear viaje','error');
        }
    }

    static async deleteTrip(id) {
        if (!await confirmAction('¿Eliminar este viaje?')) return;
        try {
            await apiCall(`/orders/trips/${id}`, { method:'DELETE' });
            showToast('Viaje eliminado','success');
            UserPanel.loadTrips();
        } catch(e) { showToast(e.message,'error'); }
    }

    static showWhatsAppConfirm(pedidoData, tipo, extras) {
        const conductor = pedidoData?.conductor_contacto;
        const whatsapp = conductor?.whatsapp?.replace(/\D/g,'');
        const nombreConductor = conductor?.nombre || 'el conductor';
        const origen = pedidoData?.origen || extras?.origin || '';
        const destino = pedidoData?.destino || extras?.destination || '';
        const oLat = pedidoData?.origin_lat;
        const oLng = pedidoData?.origin_lng;
        const dLat = pedidoData?.destination_lat;
        const dLng = pedidoData?.destination_lng;

        const mapsOrigen = MapPicker.buildMapsLink(oLat, oLng);
        const mapsDestino = MapPicker.buildMapsLink(dLat, dLng);
        const user = getUser();

        let msgLines = [
            `*Nuevo ${tipo === 'encomienda' ? 'pedido de encomienda' : 'viaje'} — Ruta Express*`,
            `👤 Cliente: ${user?.username || 'Usuario'}`,
        ];

        if (tipo === 'encomienda') {
            if (extras.descripcion) msgLines.push(`Paquete: ${extras.descripcion}`);
            if (extras.receptor)    msgLines.push(`Receptor: ${extras.receptor}`);
            if (extras.contacto_receptor) msgLines.push(`Contacto receptor: ${extras.contacto_receptor}`);
        } else {
            msgLines.push(`Pasajeros: ${extras.pasajeros}`);
            if (extras.notas) msgLines.push(`Notas: ${extras.notas}`);
        }

        msgLines.push(`Origen: ${origen}${mapsOrigen ? `\n🗺️ ${mapsOrigen}` : ''}`);
        if (extras.ref_origen) msgLines.push(`   Ref. recojo: ${extras.ref_origen}`);
        msgLines.push(`Destino: ${destino}${mapsDestino ? `\n🗺️ ${mapsDestino}` : ''}`);
        if (extras.ref_destino) msgLines.push(`   Ref. entrega: ${extras.ref_destino}`);

        const mensaje = msgLines.join('\n');
        const waUrl = whatsapp
            ? `https://wa.me/${whatsapp.startsWith('51') ? whatsapp : '51'+whatsapp}?text=${encodeURIComponent(mensaje)}`
            : null;

        openModal(
            `<i class="fas fa-check-circle" style="color:var(--success)"></i> ¡${tipo === 'encomienda' ? 'Encomienda' : 'Viaje'} creado!`,
            `
            <div class="alert alert-success"><i class="fas fa-check-circle"></i> Tu pedido fue registrado correctamente.</div>
            <p style="margin-bottom:12px">Para confirmar con ${nombreConductor}, envíale los detalles por WhatsApp:</p>
            <div class="whatsapp-preview">${mensaje.replace(/\n/g,'<br>')}</div>
            ${!whatsapp ? '<div class="alert alert-warning" style="margin-top:12px"><i class="fas fa-exclamation-triangle"></i> El conductor no tiene número de WhatsApp registrado. Contáctalo por otro medio.</div>' : ''}
            `,
            `
            <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
            ${waUrl ? `<a href="${waUrl}" target="_blank" class="btn btn-whatsapp" onclick="closeModal()">
                <i class="fab fa-whatsapp"></i> Abrir WhatsApp
            </a>` : ''}
            `
        );
    }

    static getStatusHTML() {
        return `
        <div class="section-tabs">
            <button class="section-tab active" onclick="UserPanel.switchStatusTab('en_proceso',event)">En Proceso</button>
            <button class="section-tab" onclick="UserPanel.switchStatusTab('culminado',event)">Culminados</button>
        </div>
        <div id="statusContent"><div class="empty-state">Cargando...</div></div>`;
    }

    static async loadStatus() { UserPanel.switchStatusTab('en_proceso'); }

    static async switchStatusTab(status, event) {
        if (event) {
            document.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
        }
        const content = document.getElementById('statusContent');
        content.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
        try {
            const [pRes, tRes] = await Promise.all([
                apiCall(`/orders/parcels?status=${status}`).catch(()=>({data:[]})),
                apiCall(`/orders/trips?status=${status}`).catch(()=>({data:[]}))
            ]);
            const all = [
                ...(pRes.data||[]).map(x => ({...x, tipo:'Encomienda'})),
                ...(tRes.data||[]).map(x => ({...x, tipo:'Viaje'}))
            ].sort((a,b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

            if (!all.length) { content.innerHTML='<div class="empty-state"><i class="fas fa-inbox"></i><p>No hay pedidos</p></div>'; return; }

            let calificados = {};
            if (status === 'culminado') {
                const checks = await Promise.all(all.map(o =>
                    apiCall(`/ratings/check/${o.tipo==='Encomienda'?'encomienda':'viaje'}/${o.id}`)
                        .then(r => ({ id: o.id, tipo: o.tipo, data: r.data }))
                        .catch(() => ({ id: o.id, tipo: o.tipo, data: { calificado: false } }))
                ));
                checks.forEach(c => { calificados[`${c.tipo}-${c.id}`] = c.data?.calificado; });
            }

            content.innerHTML = `
            <div class="pedidos-list">
                ${all.map(o => {
                    const key = `${o.tipo}-${o.id}`;
                    const yaCalificado = calificados[key];
                    const esEncomienda = o.tipo === 'Encomienda';
                    return `
                    <div class="pedido-card">
                        <div class="pedido-card-header">
                            <span class="badge ${esEncomienda ? 'badge-primary' : 'badge-success'}">
                                <i class="fas ${esEncomienda ? 'fa-box' : 'fa-route'}"></i> ${o.tipo}
                            </span>
                            ${getStatusBadge(o.estado)}
                            <span class="text-muted" style="font-size:12px;margin-left:auto">${formatDateShort(o.fecha_creacion)}</span>
                        </div>
                        <div class="pedido-card-body">
                            <div><strong>${o.origen}</strong> → <strong>${o.destino}</strong></div>
                            ${o.origen_lat && o.origen_lng
                                ? `<a href="${MapPicker.buildMapsLink(o.origen_lat, o.origen_lng)}" target="_blank" class="maps-link"><i class="fas fa-map-marked-alt"></i> Ver en Google Maps</a>`
                                : ''}
                            ${esEncomienda && o.nombre_receptor ? `<div class="text-muted" style="font-size:13px">Receptor: ${o.nombre_receptor}</div>` : ''}
                            ${!esEncomienda && o.cantidad_pasajeros ? `<div class="text-muted" style="font-size:13px">${o.cantidad_pasajeros} pasajero(s) · ${formatTime12h(o.hora_salida)}</div>` : ''}
                        </div>
                        ${status === 'culminado' && o.conductor_id ? `
                        <div class="pedido-card-footer">
                            ${yaCalificado
                                ? `<span class="badge badge-secondary"><i class="fas fa-star"></i> Calificado</span>`
                                : `<button class="btn btn-sm btn-secondary" onclick="Ratings.openRatingModal('${esEncomienda?'encomienda':'viaje'}', ${o.id}, 'el conductor')">
                                    <i class="fas fa-star" style="color:var(--yellow)"></i> Calificar conductor
                                   </button>`}
                        </div>` : ''}
                    </div>`;
                }).join('')}
            </div>`;
        } catch(e) { content.innerHTML = '<div class="empty-state">Error al cargar</div>'; }
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
                        <button class="theme-btn ${currentTheme==='claro'?'active':''}" onclick="UserPanel.changeTheme('claro')"><i class="fas fa-sun"></i> Claro</button>
                        <button class="theme-btn ${currentTheme==='oscuro'?'active':''}" onclick="UserPanel.changeTheme('oscuro')"><i class="fas fa-moon"></i> Oscuro</button>
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
                    <div><strong>Eliminar mi cuenta</strong><p class="settings-desc">Esta acción es permanente e irreversible.</p></div>
                    <button class="btn btn-danger" onclick="UserPanel.confirmDeleteAccount()"><i class="fas fa-trash"></i> Eliminar cuenta</button>
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
            `<p>Esta acción <strong>no se puede deshacer</strong>.</p>
             <form id="deleteAccountForm" onsubmit="UserPanel.executeDeleteAccount(event)">
                <div class="form-group"><label>Confirma tu contraseña</label>
                <input type="password" name="password" class="form-control" placeholder="(déjalo vacío si entraste con Google)"></div>
                <button type="submit" class="btn btn-danger btn-block"><i class="fas fa-trash"></i> Sí, eliminar mi cuenta</button>
             </form>`
        );
    }

    static async executeDeleteAccount(event) {
        event.preventDefault();
        try {
            await apiCall('/auth/account', { method:'DELETE', body: { password: event.target.password.value } });
            closeModal();
            showToast('Tu cuenta ha sido eliminada','success');
            setTimeout(() => App.logout(), 800);
        } catch(e) { showToast(e.message,'error'); }
    }
}
