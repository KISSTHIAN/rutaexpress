const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { responder } = require('../utils/chatbotEngine');

// No requiere estar logueado (para que alguien pueda preguntar "cómo me
// registro" antes de tener cuenta), pero si hay token válido lo usamos
// para responder con datos reales en preguntas de seguimiento de pedido.
router.post('/message', optionalAuth, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Escribe una pregunta' });
        }

        const usuarioId = req.user ? req.user.id : null;
        const resultado = await responder(message, usuarioId);

        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
