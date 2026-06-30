const express = require('express');
const router = express.Router();
const RouteConfigController = require('../controllers/routeConfigController');
const { authenticateToken, isDriver } = require('../middleware/auth');

// Horarios
router.get('/schedules', authenticateToken, isDriver, RouteConfigController.obtenerHorarios);
router.post('/schedules', authenticateToken, isDriver, RouteConfigController.agregarHorario);
router.put('/schedules/:id', authenticateToken, isDriver, RouteConfigController.actualizarHorario);
router.delete('/schedules/:id', authenticateToken, isDriver, RouteConfigController.eliminarHorario);

// Rutas y tarifas
router.get('/routes', authenticateToken, isDriver, RouteConfigController.obtenerRutas);
router.get('/routes/available', authenticateToken, RouteConfigController.obtenerRutasDisponibles);
router.post('/routes', authenticateToken, isDriver, RouteConfigController.agregarRuta);
router.put('/routes/:id', authenticateToken, isDriver, RouteConfigController.actualizarRuta);
router.delete('/routes/:id', authenticateToken, isDriver, RouteConfigController.eliminarRuta);

module.exports = router;