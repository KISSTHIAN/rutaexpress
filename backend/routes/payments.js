const express = require('express');
const router = express.Router();
const { authenticateToken, isUser } = require('../middleware/auth');
const { supabase } = require('../models/init');

// Obtener métodos de pago del usuario
router.get('/', authenticateToken, isUser, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('metodos_pago')
            .select('*')
            .eq('usuario_id', req.user.id);

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Agregar método de pago
router.post('/', authenticateToken, isUser, async (req, res) => {
    try {
        const { wallet_type, wallet_number } = req.body;
        const { data, error } = await supabase
            .from('metodos_pago')
            .insert([{
                usuario_id: req.user.id,
                tipo: 'billetera',
                tipo_billetera: wallet_type,
                numero_billetera: wallet_number
            }])
            .select();

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.status(201).json({ 
            success: true, 
            message: 'Método de pago agregado', 
            data: { id: data[0]?.id } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Eliminar método de pago
router.delete('/:id', authenticateToken, isUser, async (req, res) => {
    try {
        const { error } = await supabase
            .from('metodos_pago')
            .delete()
            .eq('id', req.params.id)
            .eq('usuario_id', req.user.id);

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({ success: true, message: 'Método de pago eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;