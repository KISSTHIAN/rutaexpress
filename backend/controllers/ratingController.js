const { supabase } = require('../models/init');

class RatingController {

    // El usuario califica al conductor de un pedido ya culminado.
    // Solo se puede calificar una vez por pedido (UNIQUE en la BD).
    static async calificar(req, res) {
        try {
            const { tipo_pedido, pedido_id, estrellas, comentario } = req.body;

            if (!['encomienda', 'viaje'].includes(tipo_pedido)) {
                return res.status(400).json({ success: false, message: 'Tipo de pedido inválido' });
            }
            const estrellasNum = parseInt(estrellas, 10);
            if (!estrellasNum || estrellasNum < 1 || estrellasNum > 5) {
                return res.status(400).json({ success: false, message: 'La calificación debe ser de 1 a 5 estrellas' });
            }

            const tabla = tipo_pedido === 'encomienda' ? 'encomiendas' : 'viajes';

            // Verificar que el pedido es del usuario logueado, está culminado,
            // y tiene un conductor asignado.
            const { data: pedido, error: findError } = await supabase
                .from(tabla)
                .select('id, usuario_id, conductor_id, estado')
                .eq('id', pedido_id)
                .eq('usuario_id', req.user.id)
                .single();

            if (findError || !pedido) {
                return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
            }
            if (pedido.estado !== 'culminado') {
                return res.status(400).json({ success: false, message: 'Solo puedes calificar pedidos culminados' });
            }
            if (!pedido.conductor_id) {
                return res.status(400).json({ success: false, message: 'Este pedido no tiene conductor asignado' });
            }

            const { error: insertError } = await supabase
                .from('calificaciones')
                .insert([{
                    conductor_id: pedido.conductor_id,
                    usuario_id: req.user.id,
                    tipo_pedido,
                    pedido_id,
                    estrellas: estrellasNum,
                    comentario: comentario || null
                }]);

            if (insertError) {
                // Violación de UNIQUE = ya fue calificado antes
                if (insertError.code === '23505') {
                    return res.status(400).json({ success: false, message: 'Ya calificaste este pedido' });
                }
                return res.status(500).json({ success: false, message: insertError.message });
            }

            res.status(201).json({ success: true, message: '¡Gracias por tu calificación!' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Verifica si un pedido específico ya fue calificado (para que el
    // frontend sepa si debe mostrar el formulario de calificación o no).
    static async verificarCalificado(req, res) {
        try {
            const { tipo_pedido, pedido_id } = req.params;
            const { data, error } = await supabase
                .from('calificaciones')
                .select('id, estrellas, comentario')
                .eq('tipo_pedido', tipo_pedido)
                .eq('pedido_id', pedido_id)
                .maybeSingle();

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true, data: { calificado: !!data, calificacion: data || null } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Calificación promedio y total de reseñas de un conductor. Se usa
    // tanto en el panel del conductor (sus propias estadísticas) como
    // en las tarjetas de "conductores disponibles" que ve el usuario.
    static async obtenerResumenConductor(req, res) {
        try {
            const conductorId = req.params.conductorId;
            const { data, error } = await supabase
                .from('calificaciones')
                .select('estrellas')
                .eq('conductor_id', conductorId);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            const total = (data || []).length;
            const promedio = total > 0
                ? data.reduce((sum, c) => sum + c.estrellas, 0) / total
                : 0;

            res.json({
                success: true,
                data: { promedio: Math.round(promedio * 10) / 10, total }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Últimas reseñas recibidas por el conductor logueado, con comentario.
    static async obtenerMisResenas(req, res) {
        try {
            const { data, error } = await supabase
                .from('calificaciones')
                .select(`*, usuarios!inner(nombre_usuario)`)
                .eq('conductor_id', req.user.conductor_id)
                .order('fecha_creacion', { ascending: false })
                .limit(50);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            const resenas = (data || []).map(r => ({
                ...r,
                nombre_usuario: r.usuarios?.nombre_usuario
            }));

            res.json({ success: true, data: resenas });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = RatingController;
