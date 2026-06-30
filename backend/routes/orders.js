const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { authenticateToken, isUser, isDriver } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/parcels', authenticateToken, isUser, upload.single('image'), OrderController.crearEncomienda);
router.get('/parcels', authenticateToken, isUser, OrderController.obtenerEncomiendasUsuario);
router.get('/parcels/:id', authenticateToken, isUser, OrderController.obtenerEncomiendaPorId);
router.put('/parcels/:id', authenticateToken, isUser, OrderController.actualizarEncomienda);
router.delete('/parcels/:id', authenticateToken, isUser, OrderController.eliminarEncomienda);

router.post('/trips', authenticateToken, isUser, OrderController.crearViaje);
router.get('/trips', authenticateToken, isUser, OrderController.obtenerViajesUsuario);
router.put('/trips/:id', authenticateToken, isUser, OrderController.actualizarViaje);
router.delete('/trips/:id', authenticateToken, isUser, OrderController.eliminarViaje);

router.get('/driver/orders', authenticateToken, isDriver, OrderController.obtenerPedidosConductor);
router.post('/driver/parcels/:id/complete', authenticateToken, isDriver, OrderController.culminarEncomienda);
router.post('/driver/trips/:id/complete', authenticateToken, isDriver, OrderController.culminarViaje);
router.get('/driver/completed', authenticateToken, isDriver, OrderController.obtenerHistorialCulminados);

module.exports = router;
