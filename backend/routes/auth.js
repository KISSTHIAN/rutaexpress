const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Rutas de autenticación tradicionales
router.post('/register/user', AuthController.registrarUsuario);
router.post('/register/driver', AuthController.registrarConductor);
router.post('/login', AuthController.iniciarSesion);
router.get('/profile', authenticateToken, AuthController.obtenerPerfil);
router.put('/profile', authenticateToken, AuthController.actualizarPerfil);
router.put('/theme', authenticateToken, AuthController.actualizarTema);
router.delete('/account', authenticateToken, AuthController.eliminarCuenta);

// Google Sign-In
router.post('/google', AuthController.loginConGoogle);

module.exports = router;
