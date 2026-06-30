const { supabase } = require('../models/init');
const {
    obtenerOCrearSuscripcion,
    calcularEstadoReal,
    DIAS_SUSCRIPCION,
    PRECIO_SUSCRIPCION
} = require('../middleware/subscription');

class SubscriptionController {

    // Devuelve el estado actual de la suscripción del usuario logueado,
    // incluyendo cuántos días le quedan si está activa.
    static async obtenerEstado(req, res) {
        try {
            const suscripcion = await obtenerOCrearSuscripcion(req.user.id);
            const estado = calcularEstadoReal(suscripcion);

            let diasRestantes = null;
            if (estado === 'activa' && suscripcion.fecha_vencimiento) {
                const ms = new Date(suscripcion.fecha_vencimiento) - new Date();
                diasRestantes = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
            }

            res.json({
                success: true,
                data: {
                    estado,
                    precio: suscripcion.precio || PRECIO_SUSCRIPCION,
                    fecha_inicio: suscripcion.fecha_inicio,
                    fecha_vencimiento: suscripcion.fecha_vencimiento,
                    dias_restantes: diasRestantes
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // "Paga" la suscripción. Por ahora esto SIMULA el cobro (no hay
    // pasarela real conectada todavía): activa la suscripción de
    // inmediato por 30 días y registra el pago en el historial.
    // Cuando se integre Mercado Pago / Culqi, este método es el que
    // hay que reemplazar por la confirmación real del webhook de pago,
    // sin tener que tocar el resto del flujo (frontend, middleware, etc).
    static async pagarSuscripcion(req, res) {
        try {
            const ahora = new Date();
            const vencimiento = new Date(ahora);
            vencimiento.setDate(vencimiento.getDate() + DIAS_SUSCRIPCION);

            const suscripcion = await obtenerOCrearSuscripcion(req.user.id);

            const { error: updateError } = await supabase
                .from('suscripciones')
                .update({
                    estado: 'activa',
                    precio: PRECIO_SUSCRIPCION,
                    fecha_inicio: ahora.toISOString(),
                    fecha_vencimiento: vencimiento.toISOString()
                })
                .eq('id', suscripcion.id);

            if (updateError) {
                return res.status(500).json({ success: false, message: updateError.message });
            }

            await supabase.from('pagos_suscripcion').insert([{
                usuario_id: req.user.id,
                monto: PRECIO_SUSCRIPCION,
                metodo: 'simulado',
                referencia_externa: null
            }]);

            res.json({
                success: true,
                message: '¡Suscripción activada! Válida por 30 días.',
                data: { estado: 'activa', fecha_vencimiento: vencimiento.toISOString() }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Historial de pagos de suscripción del usuario (para mostrarlo en Ajustes).
    static async obtenerHistorialPagos(req, res) {
        try {
            const { data, error } = await supabase
                .from('pagos_suscripcion')
                .select('*')
                .eq('usuario_id', req.user.id)
                .order('fecha_pago', { ascending: false });

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true, data: data || [] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = SubscriptionController;
