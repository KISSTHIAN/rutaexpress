const { supabase } = require('../models/init');
const faqs = require('../data/chatbotFaqs');

const RESPUESTA_DEFECTO = 'No estoy seguro de cómo ayudarte con eso todavía. Puedo responder sobre: seguimiento de pedidos, cómo registrarte, tarifas, cómo enviar una encomienda o pedir un viaje, la suscripción mensual, calificaciones, cómo ser conductor, y ajustes de tu cuenta. ¿Puedes intentar con otras palabras?';

// Quita tildes y pasa a minúsculas, para que "dónde" y "donde" coincidan igual.
function normalizar(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// Encuentra la entrada de FAQ con más palabras clave coincidentes en el mensaje.
// Si ninguna entrada coincide, devuelve null.
function buscarMejorCoincidencia(mensajeUsuario) {
    const mensajeNormalizado = normalizar(mensajeUsuario);
    let mejor = null;
    let mejorPuntaje = 0;

    for (const faq of faqs) {
        let puntaje = 0;
        for (const clave of faq.palabras_clave) {
            if (mensajeNormalizado.includes(normalizar(clave))) {
                puntaje++;
            }
        }
        if (puntaje > mejorPuntaje) {
            mejorPuntaje = puntaje;
            mejor = faq;
        }
    }

    return mejorPuntaje > 0 ? mejor : null;
}

// Caso especial: si el usuario está autenticado y pregunta por el estado
// de su pedido, consultamos sus encomiendas/viajes en proceso reales en
// vez de dar una respuesta genérica.
async function manejarSeguimientoPedido(usuarioId) {
    if (!usuarioId) {
        return 'Para darte el estado de tu pedido necesito que inicies sesión primero.';
    }

    const { data: encomiendas } = await supabase
        .from('encomiendas')
        .select('id, origen, destino, estado')
        .eq('usuario_id', usuarioId)
        .eq('estado', 'en_proceso');

    const { data: viajes } = await supabase
        .from('viajes')
        .select('id, origen, destino, estado')
        .eq('usuario_id', usuarioId)
        .eq('estado', 'en_proceso');

    const pendientes = [...(encomiendas || []), ...(viajes || [])];

    if (pendientes.length === 0) {
        return 'No tienes pedidos en proceso en este momento. Si acabas de crear uno, debería aparecer en "Mis Pedidos" dentro de tu panel.';
    }

    const lista = pendientes
        .map(p => `• ${p.origen} → ${p.destino} (en proceso)`)
        .join('\n');

    return `Tienes ${pendientes.length} pedido(s) en proceso:\n${lista}\n\nPuedes ver más detalles en la sección "Mis Pedidos".`;
}

/**
 * Punto de entrada del chatbot. usuarioId es opcional (null si la persona
 * todavía no inició sesión); cuando está presente permite responder con
 * datos reales en el caso de seguimiento de pedido.
 */
async function responder(mensajeUsuario, usuarioId = null) {
    const faqEncontrada = buscarMejorCoincidencia(mensajeUsuario);

    if (!faqEncontrada) {
        return { respuesta: RESPUESTA_DEFECTO, faq_id: null };
    }

    if (faqEncontrada.especial === 'seguimiento_pedido') {
        const respuesta = await manejarSeguimientoPedido(usuarioId);
        return { respuesta, faq_id: faqEncontrada.id };
    }

    return { respuesta: faqEncontrada.respuesta, faq_id: faqEncontrada.id };
}

module.exports = { responder };
