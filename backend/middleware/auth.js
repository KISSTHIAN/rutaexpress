const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ruta_express_secret_key_2026';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token inválido o expirado' });
        }
        // Normalizar el rol
        if (user.rol === 'conductor') user.role = 'driver';
        if (user.role === 'driver') user.rol = 'conductor';
        req.user = user;
        next();
    });
}

function isUser(req, res, next) {
    const role = req.user.rol || req.user.role;
    if (role !== 'usuario' && role !== 'user') {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de usuario' });
    }
    next();
}

function isDriver(req, res, next) {
    const role = req.user.rol || req.user.role;
    if (role !== 'conductor' && role !== 'driver') {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de conductor' });
    }
    // Asegurar que conductor_id esté disponible
    if (!req.user.conductor_id && req.user.driverId) {
        req.user.conductor_id = req.user.driverId;
    }
    next();
}

module.exports = { authenticateToken, isUser, isDriver };