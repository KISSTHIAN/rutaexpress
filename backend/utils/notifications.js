const { supabase } = require('../models/init');

/**
 * Crea una notificación para un usuario. Se usa "fire and forget":
 * si falla, se registra en consola pero NUNCA debe interrumpir el
 * flujo principal (crear un pedido o culminarlo es más importante
 * que poder avisarlo). Por eso esta función no lanza errores hacia
 * arriba, los atrapa internamente.
 *
 * @param {number} usuarioId - a quién va dirigida
 * @param {string} tipo - 'pedido_culminado' | 'pedido_disponible' | 'cuenta'
 * @param {string} titulo
 * @param {string} mensaje
 * @param {{tipo: string, id: number}} [referencia] - opcional, para enlazar al pedido
 */
async function crearNotificacion(usuarioId, tipo, titulo, mensaje, referencia = null) {
    try {
        if (!usuarioId) return;
        await supabase.from('notificaciones').insert([{
            usuario_id: usuarioId,
            tipo,
            titulo,
            mensaje,
            referencia_tipo: referencia?.tipo || null,
            referencia_id: referencia?.id || null
        }]);
    } catch (error) {
        console.error('⚠️ No se pudo crear la notificación (no crítico):', error.message);
    }
}

/**
 * Notifica a todos los conductores cuyas rutas (configuracion_rutas)
 * coinciden con ruta_config_id de que apareció un pedido nuevo.
 * Se llama justo después de crear una encomienda o viaje con ruta elegida.
 */
async function notificarConductoresPedidoNuevo(rutaConfigId, tipoPedido, origen, destino) {
    try {
        if (!rutaConfigId) return;

        const { data: ruta, error } = await supabase
            .from('configuracion_rutas')
            .select('conductor_id, conductores(usuario_id)')
            .eq('id', rutaConfigId)
            .single();

        if (error || !ruta?.conductores?.usuario_id) return;

        await crearNotificacion(
            ruta.conductores.usuario_id,
            'pedido_disponible',
            tipoPedido === 'encomienda' ? 'Nueva encomienda disponible' : 'Nuevo viaje disponible',
            `Hay un nuevo pedido de ${origen} a ${destino} en una de tus rutas.`,
            { tipo: tipoPedido, id: null }
        );
    } catch (error) {
        console.error('⚠️ No se pudo notificar al conductor (no crítico):', error.message);
    }
}

module.exports = { crearNotificacion, notificarConductoresPedidoNuevo };
