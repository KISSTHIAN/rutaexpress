const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/ratingController');
const { authenticateToken, isUser, isDriver } = require('../middleware/auth');

// Usuario califica un pedido culminado
router.post('/', authenticateToken, isUser, RatingController.calificar);
router.get('/check/:tipo_pedido/:pedido_id', authenticateToken, isUser, RatingController.verificarCalificado);

// Resumen público de un conductor (promedio + total) — cualquier
// usuario autenticado puede verlo al elegir conductor para su pedido.
router.get('/driver/:conductorId/summary', authenticateToken, RatingController.obtenerResumenConductor);

// El conductor ve sus propias reseñas con comentarios
router.get('/driver/mine', authenticateToken, isDriver, RatingController.obtenerMisResenas);

module.exports = router;
