require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
    origin: ['https://rutaexpress-frontend.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.sendStatus(204);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/auth');
const driverRoutes = require('./routes/drivers');
const orderRoutes = require('./routes/orders');
const routeConfigRoutes = require('./routes/routeConfig');
const notificationRoutes = require('./routes/notifications');
const chatbotRoutes = require('./routes/chatbot');
const subscriptionRoutes = require('./routes/subscription');
const ratingRoutes = require('./routes/ratings');

app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/route-config', routeConfigRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/ratings', ratingRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Ruta Express API funcionando 🚀' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API funcionando correctamente' });
});
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
    console.error('❌ Error no controlado:', err);

    if (err && err.name === 'MulterError') {
        const mensajes = {
            LIMIT_FILE_SIZE: 'La imagen supera el tamaño máximo permitido (5MB).',
            LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado.'
        };
        return res.status(400).json({
            success: false,
            message: mensajes[err.code] || `Error al subir el archivo: ${err.message}`
        });
    }

    if (err && /tipo de archivo no permitido/i.test(err.message || '')) {
        return res.status(400).json({ success: false, message: err.message });
    }

    if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({ success: false, message: 'El cuerpo de la petición no es JSON válido.' });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor'
    });
});

module.exports = app;

