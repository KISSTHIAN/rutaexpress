const API_URL = 'https://rutaexpress-backendv2.vercel.app/api';
function getToken() { return localStorage.getItem('ruta_express_token'); }
function setToken(token) { localStorage.setItem('ruta_express_token', token); }
function removeToken() {
    localStorage.removeItem('ruta_express_token');
    localStorage.removeItem('ruta_express_user');
}

function getUser() {
    const user = localStorage.getItem('ruta_express_user');
    if (!user) return null;
    try {
        const p = JSON.parse(user);
        return {
            id: p.id,
            username: p.username || p.nombre_usuario || '',
            email: p.email || p.correo || '',
            role: p.role || p.rol || '',
            driverId: p.driverId || p.conductor_id || null
        };
    } catch (e) { return null; }
}

function setUser(user) {
    const data = {
        id: user.id,
        username: user.username || user.nombre_usuario || '',
        email: user.email || user.correo || '',
        role: user.role || user.rol || '',
        driverId: user.driverId || user.conductor_id || null
    };
    localStorage.setItem('ruta_express_user', JSON.stringify(data));
}

async function apiCall(endpoint, options = {}) {
    const token = getToken();
    const headers = {};
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const config = { ...options, headers };
    if (config.body && !(config.body instanceof FormData) && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }
    try {
        showLoader();
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || data.mensaje || 'Error en el servidor');
        return data;
    } catch (error) {
        if (error.message && error.message.toLowerCase().includes('token')) {
            removeToken();
            window.location.reload();
        }
        throw error;
    } finally { hideLoader(); }
}

function showLoader() { const el = document.getElementById('loader'); if (el) el.classList.add('active'); }
function hideLoader() { const el = document.getElementById('loader'); if (el) el.classList.remove('active'); }

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success: 'fas fa-check-circle', error: 'fas fa-times-circle', warning: 'fas fa-exclamation-triangle', info: 'fas fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3500);
}

function openModal(title, bodyHTML, footerHTML = '') {
    document.getElementById('modalTitle').innerHTML = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modalFooter').innerHTML = footerHTML || '<button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>';
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('active'); }

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modalOverlay');
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
});

function getFormData(form) {
    const fd = new FormData(form), data = {};
    fd.forEach((v, k) => data[k] = v);
    return data;
}

function getStatusBadge(status) {
    const map = {
        'en_proceso': { cls: 'badge-warning', icon: 'clock', label: 'En Proceso' },
        'culminado': { cls: 'badge-success', icon: 'check-circle', label: 'Culminado' },
        'cancelado': { cls: 'badge-danger', icon: 'times-circle', label: 'Cancelado' },
    };
    const s = map[status] || { cls: 'badge-gray', icon: 'info-circle', label: status };
    return `<span class="badge ${s.cls}"><i class="fas fa-${s.icon}"></i> ${s.label}</span>`;
}

function formatCurrency(a) { return new Intl.NumberFormat('es-PE', { style:'currency', currency:'PEN' }).format(a || 0); }
function formatDateShort(d) { if (!d) return 'N/A'; return new Date(d).toLocaleDateString('es-PE'); }

function confirmAction(msg, danger = true) {
    return new Promise(resolve => {
        openModal(
            `<i class="fas fa-exclamation-triangle"></i> Confirmar`,
            `<p>${msg}</p>`,
            `<button class="btn btn-secondary" onclick="closeModal();window._cr(false)">Cancelar</button>
             <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" onclick="closeModal();window._cr(true)">Confirmar</button>`
        );
        window._cr = resolve;
    });
}

// ============ HORA EN FORMATO 12H (AM/PM) ============

// Convierte una hora en formato "HH:MM" o "HH:MM:SS" (24h, como la guarda la BD)
// a texto legible en 12 horas, ej: "14:30" -> "2:30 PM"
function formatTime12h(time24) {
    if (!time24) return '—';
    const [hStr, mStr] = String(time24).split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10) || 0;
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${String(m).padStart(2, '0')} ${period}`;
}

// Componente de selección de hora: hora 1-12, minutos 00-59, AM/PM.
// Genera 3 <select> independientes con name="<fieldName>_hour", "_minute", "_period".
// Usar TimePicker.readValue(form, fieldName) para obtener "HH:MM" en formato 24h al enviar.
const TimePicker = {
    render(fieldName, opts = {}) {
        const hours = Array.from({ length: 12 }, (_, i) => i + 1);
        const minutes = Array.from({ length: 60 }, (_, i) => i);
        const defaultHour = opts.hour || 8;
        const defaultMinute = opts.minute ?? 0;
        const defaultPeriod = opts.period || 'AM';

        return `
        <div class="time-picker" data-field="${fieldName}">
            <select name="${fieldName}_hour" class="form-control time-picker-select">
                ${hours.map(h => `<option value="${h}" ${h === defaultHour ? 'selected' : ''}>${h}</option>`).join('')}
            </select>
            <span class="time-picker-sep">:</span>
            <select name="${fieldName}_minute" class="form-control time-picker-select">
                ${minutes.map(m => `<option value="${m}" ${m === defaultMinute ? 'selected' : ''}>${String(m).padStart(2,'0')}</option>`).join('')}
            </select>
            <select name="${fieldName}_period" class="form-control time-picker-select time-picker-period">
                <option value="AM" ${defaultPeriod === 'AM' ? 'selected' : ''}>AM</option>
                <option value="PM" ${defaultPeriod === 'PM' ? 'selected' : ''}>PM</option>
            </select>
        </div>`;
    },

    // Lee los 3 selects de un formulario y devuelve "HH:MM" en 24h, o null si no existen
    readValue(form, fieldName) {
        const hourEl = form.querySelector(`[name="${fieldName}_hour"]`);
        const minuteEl = form.querySelector(`[name="${fieldName}_minute"]`);
        const periodEl = form.querySelector(`[name="${fieldName}_period"]`);
        if (!hourEl || !minuteEl || !periodEl) return null;

        let h = parseInt(hourEl.value, 10);
        const m = parseInt(minuteEl.value, 10);
        const period = periodEl.value;

        if (period === 'AM') { if (h === 12) h = 0; }
        else { if (h !== 12) h += 12; }

        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    },

    // Convierte "HH:MM" (24h) a { hour, minute, period } para precargar el picker al editar
    parseValue(time24) {
        if (!time24) return { hour: 8, minute: 0, period: 'AM' };
        const [hStr, mStr] = String(time24).split(':');
        let h = parseInt(hStr, 10);
        const minute = parseInt(mStr, 10) || 0;
        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return { hour: h, minute, period };
    }
};

// ============ TEMA CLARO / OSCURO ============

function applyTheme(theme) {
    const t = theme === 'oscuro' ? 'oscuro' : 'claro';
    document.documentElement.setAttribute('data-theme', t);
}

function getSavedTheme() {
    return localStorage.getItem('ruta_express_theme') || 'claro';
}

function setSavedTheme(theme) {
    localStorage.setItem('ruta_express_theme', theme);
    applyTheme(theme);
}

// Aplicar el tema guardado inmediatamente al cargar el script,
// antes de que se pinte cualquier vista (evita parpadeo de tema incorrecto)
applyTheme(getSavedTheme());

// ============ SIDEBAR MÓVIL ============

function openMobileSidebar() {
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('mobileOverlay');
    if (sidebar) sidebar.classList.add('mobile-open');
    if (overlay) overlay.classList.add('active');
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('mobileOverlay');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
}

// ============ NOTIFICACIONES ============

const Notifications = {
    _items: [],
    _loaded: false,

    // Se llama una sola vez al montar el panel (user o driver).
    // Solo registra el click-outside; NO hace fetch automático.
    init() {
        document.addEventListener('click', Notifications._handleOutsideClick);
    },

    renderBell() {
        return `
        <div class="notif-wrapper">
            <button class="notif-bell" onclick="Notifications.toggleDropdown(event)" aria-label="Notificaciones">
                <i class="fas fa-bell"></i>
                <span class="notif-badge" id="notifBadge" style="display:none">0</span>
            </button>
            <div class="notif-dropdown" id="notifDropdown">
                <div class="notif-dropdown-header">
                    <strong>Notificaciones</strong>
                    <a href="#" onclick="Notifications.markAllRead(event)">Marcar todas leídas</a>
                </div>
                <div id="notifList"><div class="empty-state" style="padding:20px">Pulsa la campana para cargar</div></div>
            </div>
        </div>`;
    },

    async fetchAndRender() {
        const list = document.getElementById('notifList');
        if (list) list.innerHTML = '<div class="empty-state" style="padding:20px"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
        try {
            const res = await apiCall('/notifications');
            Notifications._items = res.data || [];
            Notifications._loaded = true;
            Notifications._updateBadge(res.no_leidas || 0);
            Notifications._renderList();
        } catch (e) {
            if (list) list.innerHTML = '<div class="empty-state" style="padding:20px">No se pudieron cargar las notificaciones</div>';
        }
    },

    _updateBadge(count) {
        const badge = document.getElementById('notifBadge');
        if (!badge) return;
        if (count > 0) {
            badge.style.display = 'flex';
            badge.textContent = count > 9 ? '9+' : count;
        } else {
            badge.style.display = 'none';
        }
    },

    _renderList() {
        const list = document.getElementById('notifList');
        if (!list) return;
        if (Notifications._items.length === 0) {
            list.innerHTML = '<div class="empty-state" style="padding:20px">No tienes notificaciones</div>';
            return;
        }
        list.innerHTML = Notifications._items.map(n => `
            <div class="notif-item ${n.leido ? '' : 'unread'}" onclick="Notifications.markRead(${n.id})">
                <div class="notif-item-icon ${n.tipo === 'pedido_culminado' ? 'icon-success' : 'icon-info'}">
                    <i class="fas ${n.tipo === 'pedido_culminado' ? 'fa-check-circle' : 'fa-bell'}"></i>
                </div>
                <div class="notif-item-body">
                    <strong>${n.titulo}</strong>
                    <p>${n.mensaje}</p>
                    <span class="notif-item-time">${formatDateShort(n.fecha_creacion)}</span>
                </div>
            </div>`).join('');
    },

    // Al abrir el dropdown: siempre hace fetch fresco para mostrar las más recientes
    toggleDropdown(event) {
        event.stopPropagation();
        const dropdown = document.getElementById('notifDropdown');
        const estaAbierto = dropdown.classList.contains('open');
        dropdown.classList.toggle('open');
        if (!estaAbierto) {
            // Cada vez que el usuario abre la campana, carga las notificaciones
            Notifications.fetchAndRender();
        }
    },

    _handleOutsideClick(event) {
        const dropdown = document.getElementById('notifDropdown');
        const bell = document.querySelector('.notif-bell');
        if (dropdown && dropdown.classList.contains('open') && !dropdown.contains(event.target) && event.target !== bell) {
            dropdown.classList.remove('open');
        }
    },

    async markRead(id) {
        try {
            await apiCall(`/notifications/${id}/read`, { method: 'PUT' });
            Notifications.fetchAndRender();
        } catch (e) {}
    },

    async markAllRead(event) {
        event.preventDefault();
        try {
            await apiCall('/notifications/read-all', { method: 'PUT' });
            Notifications.fetchAndRender();
        } catch (e) {}
    }
};

// ============ CHATBOT (preguntas frecuentes) ============

const Chatbot = {
    _open: false,
    _history: [],

    init() {
        if (document.getElementById('chatbotWidget')) return; // ya está montado
        const wrapper = document.createElement('div');
        wrapper.id = 'chatbotWidget';
        wrapper.innerHTML = `
            <button class="chatbot-fab" onclick="Chatbot.toggle()" aria-label="Abrir chat de ayuda">
                <i class="fas fa-comment-dots"></i>
            </button>
            <div class="chatbot-panel" id="chatbotPanel">
                <div class="chatbot-header">
                    <div><i class="fas fa-robot"></i> Asistente Ruta Express</div>
                    <button onclick="Chatbot.toggle()" aria-label="Cerrar"><i class="fas fa-times"></i></button>
                </div>
                <div class="chatbot-messages" id="chatbotMessages">
                    <div class="chatbot-msg bot">¡Hola! Puedo ayudarte con preguntas sobre encomiendas, viajes, pagos, tu cuenta o el estado de tus pedidos. ¿En qué te ayudo?</div>
                </div>
                <form class="chatbot-input-row" onsubmit="Chatbot.send(event)">
                    <input type="text" id="chatbotInput" class="form-control" placeholder="Escribe tu pregunta..." autocomplete="off">
                    <button type="submit" aria-label="Enviar"><i class="fas fa-paper-plane"></i></button>
                </form>
            </div>`;
        document.body.appendChild(wrapper);
    },

    toggle() {
        Chatbot._open = !Chatbot._open;
        document.getElementById('chatbotPanel').classList.toggle('open', Chatbot._open);
        if (Chatbot._open) setTimeout(() => document.getElementById('chatbotInput')?.focus(), 100);
    },

    async send(event) {
        event.preventDefault();
        const input = document.getElementById('chatbotInput');
        const texto = input.value.trim();
        if (!texto) return;

        Chatbot._appendMessage(texto, 'user');
        input.value = '';
        Chatbot._appendMessage('...', 'bot', true);

        try {
            const res = await apiCall('/chatbot/message', { method: 'POST', body: { message: texto } });
            Chatbot._replaceLastBotMessage(res.data.respuesta);
        } catch (e) {
            Chatbot._replaceLastBotMessage('Hubo un problema al responder. Intenta de nuevo en un momento.');
        }
    },

    _appendMessage(text, who, isLoading = false) {
        const container = document.getElementById('chatbotMessages');
        const div = document.createElement('div');
        div.className = `chatbot-msg ${who}${isLoading ? ' loading' : ''}`;
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    _replaceLastBotMessage(text) {
        const container = document.getElementById('chatbotMessages');
        const loadingMsg = container.querySelector('.chatbot-msg.loading');
        if (loadingMsg) {
            loadingMsg.textContent = text;
            loadingMsg.classList.remove('loading');
        } else {
            Chatbot._appendMessage(text, 'bot');
        }
        container.scrollTop = container.scrollHeight;
    }
};
