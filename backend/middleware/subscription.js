const { supabase } = require('../models/init');

const DIAS_SUSCRIPCION = 30;
const PRECIO_SUSCRIPCION = 25.00;

/**
 * Calcula si una fila de "suscripciones" sigue vigente comparando
 * fecha_vencimiento con la hora actual, y devuelve el estado real
 * (no el que tenga guardado en la columna, que puede estar desactualizado
 * si nadie volvió a entrar desde que venció).
 */
function calcularEstadoReal(suscripcion) {
    if (!suscripcion) return 'pendiente';
    if (suscripcion.estado === 'pendiente') return 'pendiente';
    if (!suscripcion.fecha_vencimiento) return 'pendiente';

    const vencimiento = new Date(suscripcion.fecha_vencimiento);
    const ahora = new Date();
    return ahora > vencimiento ? 'vencida' : 'activa';
}

/**
 * Trae (o crea si no existe) la fila de suscripción de un usuario.
 * Toda cuenta nueva debería tener una gracias al registro, pero esta
 * función es una red de seguridad para cuentas antiguas o casos raros.
 */
async function obtenerOCrearSuscripcion(usuarioId) {
    const { data: existente } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('usuario_id', usuarioId)
        .maybeSingle();

    if (existente) return existente;

    const { data: nueva } = await supabase
        .from('suscripciones')
        .insert([{ usuario_id: usuarioId, estado: 'pendiente', precio: PRECIO_SUSCRIPCION }])
        .select()
        .single();

    return nueva;
}

/**
 * Middleware: exige que la suscripción esté activa para continuar.
 * Se usa en las acciones "valiosas" de la plataforma: crear encomienda,
 * crear viaje, y que el conductor pueda activarse para recibir pedidos.
 * No bloquea acciones de solo lectura (ver historial, ajustes, etc.)
 * para que la persona siempre pueda entrar a pagar/renovar.
 */
async function requireActiveSubscription(req, res, next) {
    try {
        const suscripcion = await obtenerOCrearSuscripcion(req.user.id);
        const estadoReal = calcularEstadoReal(suscripcion);

        if (estadoReal !== 'activa') {
            return res.status(402).json({
                success: false,
                message: estadoReal === 'pendiente'
                    ? 'Activa tu suscripción de S/25 para usar esta función'
                    : 'Tu suscripción venció. Renuévala para continuar',
                code: 'SUBSCRIPTION_REQUIRED',
                data: { estado: estadoReal }
            });
        }

        req.subscription = suscripcion;
        next();
    } catch (error) {
        console.error('Error verificando suscripción:', error);
        res.status(500).json({ success: false, message: 'Error al verificar tu suscripción' });
    }
}

module.exports = {
    requireActiveSubscription,
    obtenerOCrearSuscripcion,
    calcularEstadoReal,
    DIAS_SUSCRIPCION,
    PRECIO_SUSCRIPCION
};
