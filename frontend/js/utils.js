const API_URL = 'https://rutaexpress-backendv2.vercel.app/';
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
