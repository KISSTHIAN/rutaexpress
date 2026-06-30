const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/auth');

router.get('/status', authenticateToken, SubscriptionController.obtenerEstado);
router.post('/pay', authenticateToken, SubscriptionController.pagarSuscripcion);
router.get('/history', authenticateToken, SubscriptionController.obtenerHistorialPagos);

module.exports = router;
