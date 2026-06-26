require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Configuración CORS correcta para Vercel
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
// Nota: ya no se sirve una carpeta /uploads local — las imágenes (foto
// de vehículo, foto de encomienda) se guardan en Supabase Storage y se
// acceden directamente por su URL pública. Ver backend/utils/storage.js.

// Rutas
const authRoutes = require('./routes/auth');
const driverRoutes = require('./routes/drivers');
const driverPaymentsRoutes = require('./routes/driverPayments');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const routeConfigRoutes = require('./routes/routeConfig');
const notificationRoutes = require('./routes/notifications');
const chatbotRoutes = require('./routes/chatbot');

app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/driver/payments', driverPaymentsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/route-config', routeConfigRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Ruta Express API funcionando 🚀' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API funcionando correctamente' });
});

module.exports = app;
