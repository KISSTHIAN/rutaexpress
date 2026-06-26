class App {
    static init() {
        console.log('🚀 Iniciando Ruta Express...');
        const user = getUser();
        const token = getToken();
        if (user && token) {
            App.router();
        } else {
            AuthViews.renderLogin();
        }
    }

    static router() {
        const user = getUser();
        if (!user) { AuthViews.renderLogin(); return; }
        if (user.role === 'driver' || user.role === 'conductor') {
            if (typeof DriverPanel !== 'undefined') DriverPanel.render();
        } else {
            if (typeof UserPanel !== 'undefined') UserPanel.render();
        }
    }

    static logout() {
        removeToken();
        showToast('Sesión cerrada correctamente 👋', 'info');
        setTimeout(() => AuthViews.renderLogin(), 500);
    }
}

document.addEventListener('DOMContentLoaded', () => App.init());
if (document.readyState === 'complete' || document.readyState === 'interactive') App.init();