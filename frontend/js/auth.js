const GOOGLE_CLIENT_ID = '940551978438-8cd0af9l24qlk14sk4hlq7mju6mdpfgd.apps.googleusercontent.com';
let googleInitialized = false;

class AuthViews {

    static renderLogin() {
        const app = document.getElementById('app');
        app.innerHTML = `
        <div class="auth-layout">
            <div class="auth-sidebar">
                <div class="auth-sidebar-content">
                    <div class="auth-sidebar-logo">🚀</div>
                    <h1>Ruta Express</h1>
                    <p>La plataforma más rápida y segura para encomiendas y viajes interprovinciales del Perú</p>
                    <ul class="auth-features">
                        <li><i class="fas fa-shield-alt"></i> Entregas 100% seguras y rastreables</li>
                        <li><i class="fas fa-clock"></i> Seguimiento en tiempo real</li>
                        <li><i class="fas fa-wallet"></i> Pago con Yape, Plin o tarjeta</li>
                        <li><i class="fas fa-star"></i> Conductores verificados</li>
                        <li><i class="fas fa-headset"></i> Soporte 24/7</li>
                    </ul>
                </div>
            </div>
            <div class="auth-form-container">
                <div class="auth-form-wrapper fade-in">
                    <div class="auth-logo-mobile">
                        <h2>🚀 Ruta Express</h2>
                    </div>
                    <h3>¡Bienvenido de vuelta!</h3>
                    <p class="subtitle">Ingresa a tu cuenta para continuar</p>

                    <div class="tabs" style="margin-bottom: 24px;">
                        <button class="tab active" onclick="AuthViews.switchLoginTab('user')" id="tabUser">
                            <i class="fas fa-user"></i> Usuario
                        </button>
                        <button class="tab" onclick="AuthViews.switchLoginTab('driver')" id="tabDriver">
                            <i class="fas fa-truck"></i> Conductor
                        </button>
                    </div>

                    <div class="google-btn-container">
                        <button class="btn btn-google" onclick="AuthViews.handleGoogleLogin()">
                            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                            Continuar con Google
                        </button>
                    </div>

                    <div class="divider">o ingresa con tu correo</div>

                    <form id="loginForm" onsubmit="AuthViews.handleLogin(event)">
                        <div class="form-group">
                            <label>Correo electrónico <span class="required">*</span></label>
                            <div class="input-icon-wrapper">
                                <i class="fas fa-envelope input-icon"></i>
                                <input type="email" name="email" class="form-control" placeholder="tu@correo.com" required autocomplete="email">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Contraseña <span class="required">*</span></label>
                            <div class="input-icon-wrapper">
                                <i class="fas fa-lock input-icon"></i>
                                <input type="password" name="password" class="form-control" placeholder="••••••••" required autocomplete="current-password">
                            </div>
                        </div>
                        <div id="loginError" class="alert alert-danger" style="display:none;">
                            <i class="fas fa-exclamation-circle"></i>
                            <span id="loginErrorMsg"></span>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block btn-lg" id="loginBtn">
                            <i class="fas fa-sign-in-alt"></i> <span>Iniciar Sesión</span>
                        </button>
                    </form>

                    <div class="auth-link" style="margin-top: 20px;">
                        ¿No tienes cuenta?
                        <a href="#" onclick="AuthViews.renderRegister('user')">Regístrate como Usuario</a> |
                        <a href="#" onclick="AuthViews.renderRegister('driver')">Como Conductor</a>
                    </div>
                </div>
            </div>
        </div>`;
        window._loginRole = 'user';
        AuthViews._initGoogle();
    }

 static _initGoogle() {
    if (googleInitialized) return;
    const init = () => {
        if (typeof google === 'undefined') return;
        googleInitialized = true;
        try {
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: AuthViews.handleGoogleCredential,
                auto_select: false,
                cancel_on_tap_outside: true
            });
        } catch(e) { console.log('Google Sign-In error:', e); }
    };
    if (typeof google !== 'undefined') { init(); }
    else { window.addEventListener('load', init); }
}

    static handleGoogleLogin() {
        if (typeof google === 'undefined') {
            showToast('Google Sign-In no cargó, espera un momento', 'warning');
            return;
        }
        try {
            google.accounts.id.prompt();
        } catch(e) {
            showToast('Error al abrir Google Sign-In', 'error');
        }
    }

    static async handleGoogleCredential(response) {
        try {
            showLoader();
            const result = await apiCall('/auth/google', {
                method: 'POST',
                body: { credential: response.credential, role: window._loginRole || 'user' }
            });
            if (result.success) {
                setToken(result.data.token);
                setUser(result.data.user);
                showToast('¡Bienvenido!', 'success');
                setTimeout(() => App.router(), 300);
            }
        } catch (error) {
            showToast('Error con Google: ' + error.message, 'error');
        } finally { hideLoader(); }
    }

    static switchLoginTab(role) {
        window._loginRole = role;
        document.getElementById('tabUser').classList.toggle('active', role === 'user');
        document.getElementById('tabDriver').classList.toggle('active', role === 'driver');
    }

    static async handleLogin(event) {
        event.preventDefault();
        const loginBtn = document.getElementById('loginBtn');
        const loginError = document.getElementById('loginError');
        const loginErrorMsg = document.getElementById('loginErrorMsg');
        const btnText = loginBtn.querySelector('span');
        loginBtn.disabled = true;
        btnText.textContent = 'Iniciando sesión...';
        loginError.style.display = 'none';

        const email = event.target.email.value.trim();
        const password = event.target.password.value;

        if (!email || !password) {
            loginErrorMsg.textContent = 'Todos los campos son obligatorios';
            loginError.style.display = 'flex';
            loginBtn.disabled = false; btnText.textContent = 'Iniciar Sesión'; return;
        }

        try {
            const data = await apiCall('/auth/login', { method: 'POST', body: { email, password } });
            if (data.success) {
                setToken(data.data.token);
                setUser(data.data.user);
                showToast('¡Bienvenido de vuelta! 🎉', 'success');
                setTimeout(() => App.router(), 400);
            }
        } catch (error) {
            loginErrorMsg.textContent = error.message || 'Error al iniciar sesión';
            loginError.style.display = 'flex';
        } finally {
            loginBtn.disabled = false;
            btnText.textContent = 'Iniciar Sesión';
        }
    }

    static renderRegister(role = 'user') {
        const app = document.getElementById('app');
        const isDriver = role === 'driver';
        app.innerHTML = `
        <div class="auth-layout">
            <div class="auth-sidebar">
                <div class="auth-sidebar-content">
                    <div class="auth-sidebar-logo">${isDriver ? '🚛' : '📦'}</div>
                    <h1>${isDriver ? 'Conviértete en Conductor' : 'Únete a Ruta Express'}</h1>
                    <p>${isDriver ? '¡Genera ingresos transportando encomiendas y pasajeros!' : '¡Envía tus paquetes de forma rápida y segura!'}</p>
                </div>
            </div>
            <div class="auth-form-container">
                <div class="auth-form-wrapper fade-in">
                    <div class="auth-logo-mobile"><h2>🚀 Ruta Express</h2></div>
                    <h3>Crear cuenta ${isDriver ? 'de Conductor' : 'de Usuario'}</h3>
                    <p class="subtitle">¡Únete a miles de usuarios!</p>

                    <form id="registerForm" onsubmit="AuthViews.handleRegister(event, '${role}')" novalidate>
                        <div class="grid-2">
                            <div class="form-group">
                                <label>Usuario <span class="required">*</span></label>
                                <input type="text" name="username" class="form-control" required minlength="3">
                            </div>
                            <div class="form-group">
                                <label>Correo <span class="required">*</span></label>
                                <input type="email" name="email" class="form-control" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Contraseña <span class="required">*</span></label>
                            <input type="password" name="password" class="form-control" required minlength="8">
                        </div>
                        <div class="form-group">
                            <label>Confirmar Contraseña <span class="required">*</span></label>
                            <input type="password" name="confirmPassword" class="form-control" required>
                        </div>
                        ${isDriver ? `
                        <div class="grid-2">
                            <div class="form-group">
                                <label>Nombre Completo <span class="required">*</span></label>
                                <input type="text" name="full_name" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Edad <span class="required">*</span></label>
                                <input type="number" name="age" class="form-control" required min="18">
                            </div>
                        </div>
                        <div class="grid-2">
                            <div class="form-group">
                                <label>Teléfono <span class="required">*</span></label>
                                <input type="tel" name="phone1" class="form-control" required>
                            </div>
                        </div>` : ''}
                        <div id="registerError" class="alert alert-danger" style="display:none;">
                            <i class="fas fa-exclamation-circle"></i>
                            <span id="registerErrorMsg"></span>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block btn-lg">
                            <i class="fas fa-user-plus"></i> Crear Cuenta
                        </button>
                    </form>
                    <div class="auth-link">
                        ¿Ya tienes cuenta? <a href="#" onclick="AuthViews.renderLogin()">Iniciar Sesión</a>
                    </div>
                </div>
            </div>
        </div>`;
    }

    static async handleRegister(event, role) {
        event.preventDefault();
        const registerError = document.getElementById('registerError');
        const registerErrorMsg = document.getElementById('registerErrorMsg');
        registerError.style.display = 'none';

        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        if (data.password !== data.confirmPassword) {
            registerErrorMsg.textContent = 'Las contraseñas no coinciden';
            registerError.style.display = 'flex';
            return;
        }

        const endpoint = role === 'driver' ? '/auth/register/driver' : '/auth/register/user';
        try {
            const result = await apiCall(endpoint, { method: 'POST', body: data });
            if (result.success) {
                setToken(result.data.token);
                setUser(result.data.user);
                showToast('¡Registro exitoso! 🚀', 'success');
                setTimeout(() => App.router(), 500);
            }
        } catch (error) {
            registerErrorMsg.textContent = error.message || 'Error al registrarse';
            registerError.style.display = 'flex';
        }
    }
}
