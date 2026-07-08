const { supabase } = require('../models/init');
const faqs = require('../data/chatbotFaqs');

const RESPUESTA_DEFECTO = 'No estoy seguro de cómo ayudarte con eso. Puedo responder sobre encomiendas, viajes, la suscripción mensual, calificaciones, cómo ser conductor y ajustes de tu cuenta.';

function normalizar(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function normalizarRol(rol) {
    const r = normalizar(rol || '');
    if (r.includes('conduc') || r.includes('driver')) return 'conductor';
    if (r.includes('client') || r.includes('usuario') || r.includes('user')) return 'cliente';
    return null; // no autenticado / rol desconocido
}

function buscarMejorCoincidencia(mensajeUsuario, rol) {
    const mensajeNormalizado = normalizar(mensajeUsuario);
    let mejor = null;
    let mejorPuntaje = 0;
    let mejorEsDeSuRol = false;

    for (const faq of faqs) {
        let puntaje = 0;
        for (const clave of faq.palabras_clave) {
            if (mensajeNormalizado.includes(normalizar(clave))) puntaje++;
        }
        if (puntaje === 0) continue;

        const esDeSuRol = !rol || faq.rol === 'ambos' || faq.rol === rol;

        const esMejor =
            puntaje > mejorPuntaje ||
            (puntaje === mejorPuntaje && esDeSuRol && !mejorEsDeSuRol);

        if (esMejor) {
            mejor = faq;
            mejorPuntaje = puntaje;
            mejorEsDeSuRol = esDeSuRol;
        }
    }
    return mejorPuntaje > 0 ? mejor : null;
}

async function manejarSeguimientoPedido(usuarioId) {
    if (!usuarioId) return 'Para darte el estado de tu pedido necesito que inicies sesión primero.';
    const { data: encomiendas } = await supabase.from('encomiendas').select('id, origen, destino, estado').eq('usuario_id', usuarioId).eq('estado', 'en_proceso');
    const { data: viajes } = await supabase.from('viajes').select('id, origen, destino, estado').eq('usuario_id', usuarioId).eq('estado', 'en_proceso');
    const pendientes = [...(encomiendas || []), ...(viajes || [])];
    if (pendientes.length === 0) return 'No tienes pedidos en proceso en este momento.';
    const lista = pendientes.map(p => `• ${p.origen} → ${p.destino} (en proceso)`).join('\n');
    return `Tienes ${pendientes.length} pedido(s) en proceso:\n${lista}\n\nPuedes ver detalles en "Mis Pedidos".`;
}

async function preguntarAGrok(mensajeUsuario, rol) {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) return null;
    
    const contextoRol = rol === 'conductor'
        ? `Le estás hablando a un CONDUCTOR de Ruta Express. Como conductor puede: configurar su vehículo (Mi Vehículo), crear hasta 8 rutas fijas con precio (Rutas), definir horarios de salida (Horarios), ver y culminar los pedidos que le asignen (Pedidos), ver su historial de ganancias y pasajeros transportados (Historial), ver sus reseñas (Mis Reseñas), pagar su suscripción mensual de S/25 (Suscripción) y activarse/desactivarse con el switch "Disponible". NO le hables de cómo crear encomiendas o viajes como si fuera cliente.`
        : rol === 'cliente'
        ? `Le estás hablando a un CLIENTE de Ruta Express. Como cliente puede: crear encomiendas y viajes buscando conductores por lugar de origen (el destino ya viene fijo en la ruta de cada conductor), indicar su punto exacto de recojo (con GPS o mapa), ver y cancelar sus pedidos, calificar a los conductores al terminar, y contactarlos por WhatsApp. Los clientes NO pagan ninguna suscripción (solo los conductores). NO le hables de vehículos, rutas propias u horarios como si fuera conductor.`
        : `No sabes si quien pregunta es cliente o conductor (no inició sesión), así que da una respuesta general sobre Ruta Express sin asumir un rol específico.`;

    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'grok-3-mini',
                max_tokens: 300,
                messages: [
                    {
                        role: 'system',
                        content: `Eres el asistente virtual de Ruta Express, una app peruana de encomiendas y viajes interprovinciales que opera en Piura.
Responde siempre en español, de forma breve y amigable (máximo 3 oraciones).
${contextoRol}
Solo responde sobre temas de Ruta Express. Si la pregunta no tiene relación con la app, responde: "Esa pregunta está fuera de mi alcance, pero puedo ayudarte con temas de Ruta Express."`
                    },
                    {
                        role: 'user',
                        content: mensajeUsuario
                    }
                ]
            })
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || null;
    } catch (e) {
        console.error('Error llamando a Grok:', e.message);
        return null;
    }
}

async function responder(mensajeUsuario, usuarioId = null, rolCrudo = null) {
    const rol = normalizarRol(rolCrudo);
    const faqEncontrada = buscarMejorCoincidencia(mensajeUsuario, rol);

    if (faqEncontrada) {
        if (faqEncontrada.especial === 'seguimiento_pedido') {
            const respuesta = await manejarSeguimientoPedido(usuarioId);
            return { respuesta, faq_id: faqEncontrada.id };
        }
        return { respuesta: faqEncontrada.respuesta, faq_id: faqEncontrada.id };
    }

    const respuestaGrok = await preguntarAGrok(mensajeUsuario, rol);
    if (respuestaGrok) {
        return { respuesta: respuestaGrok, faq_id: null };
    }

    return { respuesta: RESPUESTA_DEFECTO, faq_id: null };
}

module.exports = { responder };
