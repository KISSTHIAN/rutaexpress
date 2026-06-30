const express = require('express');
const router = express.Router();
const { authenticateToken, isDriver } = require('../middleware/auth');
const { supabase } = require('../models/init');
const upload = require('../middleware/upload');
const { subirImagen } = require('../utils/storage');
const { requireActiveSubscription, calcularEstadoReal, obtenerOCrearSuscripcion } = require('../middleware/subscription');

// Perfil conductor
router.get('/profile', authenticateToken, isDriver, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('conductores')
            .select('*')
            .eq('usuario_id', req.user.id)
            .single();

        if (error || !data) {
            return res.status(404).json({ success: false, message: 'No encontrado' });
        }

        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.put('/profile', authenticateToken, isDriver, async (req, res) => {
    try {
        const updates = {};
        if (req.body.full_name) updates.nombre_completo = req.body.full_name;
        if (req.body.age) updates.edad = parseInt(req.body.age);
        if (req.body.phone1) updates.telefono_1 = req.body.phone1;
        if (req.body.phone2) updates.telefono_2 = req.body.phone2;
        if (req.body.whatsapp) updates.whatsapp = req.body.whatsapp;

        const { error } = await supabase
            .from('conductores')
            .update(updates)
            .eq('usuario_id', req.user.id);

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({ success: true, message: 'Actualizado' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.put('/availability', authenticateToken, isDriver, async (req, res) => {
    try {
        const quiereActivarse = !!req.body.available;

        // Solo se exige suscripción activa para ACTIVARSE. Desactivarse
        // siempre debe poder hacerse, sin importar el estado de la
        // suscripción, para que el conductor nunca quede "atrapado".
        if (quiereActivarse) {
            const suscripcion = await obtenerOCrearSuscripcion(req.user.id);
            const estado = calcularEstadoReal(suscripcion);
            if (estado !== 'activa') {
                return res.status(402).json({
                    success: false,
                    message: estado === 'pendiente'
                        ? 'Activa tu suscripción de S/25 para poder recibir pedidos'
                        : 'Tu suscripción venció. Renuévala para poder activarte',
                    code: 'SUBSCRIPTION_REQUIRED'
                });
            }
        }

        const { error } = await supabase
            .from('conductores')
            .update({ disponible: quiereActivarse ? 1 : 0 })
            .eq('usuario_id', req.user.id);

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({ success: true, message: 'OK' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Vehículos
router.get('/vehicles', authenticateToken, isDriver, async (req, res) => {
    try {
        // Obtener conductor_id
        const { data: conductor, error: condError } = await supabase
            .from('conductores')
            .select('id')
            .eq('usuario_id', req.user.id)
            .single();

        if (condError || !conductor) {
            return res.json({ success: true, data: [] });
        }

        const { data, error } = await supabase
            .from('vehiculos')
            .select('*')
            .eq('conductor_id', conductor.id);

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({ success: true, data: data || [] });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/vehicles', authenticateToken, isDriver, upload.single('photo'), async (req, res) => {
    try {
        // Obtener conductor_id
        const { data: conductor, error: condError } = await supabase
            .from('conductores')
            .select('id')
            .eq('usuario_id', req.user.id)
            .single();

        if (condError || !conductor) {
            return res.status(404).json({ success: false, message: 'Conductor no encontrado' });
        }

        let fotoUrl = null;
        if (req.file) {
            try {
                fotoUrl = await subirImagen(req.file, 'vehiculos', String(conductor.id));
            } catch (uploadErr) {
                return res.status(500).json({ success: false, message: uploadErr.message });
            }
        }

        const { plate, brand, model, color, capacity } = req.body;
        const { data, error } = await supabase
            .from('vehiculos')
            .insert([{
                conductor_id: conductor.id,
                placa: plate,
                marca: brand,
                modelo: model,
                color: color,
                capacidad: capacity,
                foto_vehiculo: fotoUrl
            }])
            .select();

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.status(201).json({ success: true, data: { id: data[0]?.id } });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.put('/vehicles/:id', authenticateToken, isDriver, upload.single('photo'), async (req, res) => {
    try {
        const { data: conductor, error: condError } = await supabase
            .from('conductores')
            .select('id')
            .eq('usuario_id', req.user.id)
            .single();

        if (condError || !conductor) {
            return res.status(404).json({ success: false, message: 'Conductor no encontrado' });
        }

        const updates = {};
        if (req.body.plate) updates.placa = req.body.plate;
        if (req.body.brand) updates.marca = req.body.brand;
        if (req.body.model) updates.modelo = req.body.model;
        if (req.body.color) updates.color = req.body.color;
        if (req.body.capacity) updates.capacidad = req.body.capacity;

        if (req.file) {
            try {
                updates.foto_vehiculo = await subirImagen(req.file, 'vehiculos', String(conductor.id));
            } catch (uploadErr) {
                return res.status(500).json({ success: false, message: uploadErr.message });
            }
        }

        const { error } = await supabase
            .from('vehiculos')
            .update(updates)
            .eq('id', req.params.id)
            .eq('conductor_id', conductor.id);

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({ success: true, message: 'Actualizado' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.delete('/vehicles/:id', authenticateToken, isDriver, async (req, res) => {
    try {
        const { data: conductor, error: condError } = await supabase
            .from('conductores')
            .select('id')
            .eq('usuario_id', req.user.id)
            .single();

        if (condError || !conductor) {
            return res.status(404).json({ success: false, message: 'Conductor no encontrado' });
        }

        const { error } = await supabase
            .from('vehiculos')
            .delete()
            .eq('id', req.params.id)
            .eq('conductor_id', conductor.id);

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        res.json({ success: true, message: 'Eliminado' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;