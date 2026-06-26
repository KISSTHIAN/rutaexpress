const { supabase } = require('../models/init');

class NotificationController {

    // Lista las notificaciones del usuario autenticado (usuario o conductor,
    // ambos tienen fila en "usuarios" así que req.user.id sirve para ambos).
    // Por defecto trae las últimas 30, más recientes primero.
    static async listar(req, res) {
        try {
            const { data, error } = await supabase
                .from('notificaciones')
                .select('*')
                .eq('usuario_id', req.user.id)
                .order('fecha_creacion', { ascending: false })
                .limit(30);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            const noLeidas = (data || []).filter(n => !n.leido).length;

            res.json({ success: true, data: data || [], no_leidas: noLeidas });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async marcarLeida(req, res) {
        try {
            const { error } = await supabase
                .from('notificaciones')
                .update({ leido: true })
                .eq('id', req.params.id)
                .eq('usuario_id', req.user.id);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async marcarTodasLeidas(req, res) {
        try {
            const { error } = await supabase
                .from('notificaciones')
                .update({ leido: true })
                .eq('usuario_id', req.user.id)
                .eq('leido', false);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = NotificationController;
