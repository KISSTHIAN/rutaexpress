const { supabase } = require('../models/init');
const { enviarCorreoNotificacion } = require('./emailSender');

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

        const { data: usuario } = await supabase
            .from('usuarios')
            .select('correo')
            .eq('id', usuarioId)
            .single();

        if (usuario?.correo) {
            enviarCorreoNotificacion(usuario.correo, titulo, mensaje);
        }
    } catch (error) {
        console.error('⚠️ No se pudo crear la notificación (no crítico):', error.message);
    }
}

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

async function notificarConductorDirecto(conductorId, tipoPedido, origen, destino, pedidoId) {
    try {
        if (!conductorId) return;

        const { data: conductor, error } = await supabase
            .from('conductores')
            .select('usuario_id')
            .eq('id', conductorId)
            .single();

        if (error || !conductor?.usuario_id) return;

        await crearNotificacion(
            conductor.usuario_id,
            'pedido_disponible',
            tipoPedido === 'encomienda' ? 'Nueva encomienda asignada' : 'Nuevo viaje asignado',
            `Un cliente te eligió directamente para un pedido de ${origen} a ${destino}.`,
            { tipo: tipoPedido, id: pedidoId || null }
        );
    } catch (error) {
        console.error('⚠️ No se pudo notificar al conductor (no crítico):', error.message);
    }
}

module.exports = { crearNotificacion, notificarConductoresPedidoNuevo, notificarConductorDirecto };
