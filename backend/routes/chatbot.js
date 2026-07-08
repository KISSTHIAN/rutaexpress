const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { responder } = require('../utils/chatbotEngine');

router.post('/message', optionalAuth, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Escribe una pregunta' });
        }

        const usuarioId = req.user ? req.user.id : null;
        const rol = req.user ? (req.user.rol || req.user.role) : null;
        const resultado = await responder(message, usuarioId, rol);

        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
