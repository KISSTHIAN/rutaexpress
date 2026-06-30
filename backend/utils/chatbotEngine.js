const { supabase } = require('../models/init');
const faqs = require('../data/chatbotFaqs');

const RESPUESTA_DEFECTO = 'No estoy seguro de cómo ayudarte con eso. Puedo responder sobre encomiendas, viajes, la suscripción mensual, calificaciones, cómo ser conductor y ajustes de tu cuenta.';

// Quita tildes y pasa a minúsculas para que "dónde" y "donde" coincidan igual.
function normalizar(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function buscarMejorCoincidencia(mensajeUsuario) {
    const mensajeNormalizado = normalizar(mensajeUsuario);
    let mejor = null;
    let mejorPuntaje = 0;
    for (const faq of faqs) {
        let puntaje = 0;
        for (const clave of faq.palabras_clave) {
            if (mensajeNormalizado.includes(normalizar(clave))) puntaje++;
        }
        if (puntaje > mejorPuntaje) { mejorPuntaje = puntaje; mejor = faq; }
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

// Llama a la API de Grok (xAI) cuando las FAQs locales no tienen respuesta.
// Si la GROK_API_KEY no está configurada, devuelve null silenciosamente.
async function preguntarAGrok(mensajeUsuario) {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) return null;

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
                        content: `Eres el asistente virtual de Ruta Express, una app peruana de encomiendas y viajes interprovinciales. 
Responde siempre en español, de forma breve y amigable (máximo 3 oraciones).
Solo responde sobre: encomiendas, viajes, conductores, suscripción mensual de S/25, calificaciones, registro de cuenta y soporte general de la plataforma.
Si la pregunta no tiene relación con Ruta Express, responde: "Esa pregunta está fuera de mi alcance, pero puedo ayudarte con temas de Ruta Express."`
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

async function responder(mensajeUsuario, usuarioId = null) {

    const faqEncontrada = buscarMejorCoincidencia(mensajeUsuario);

    if (faqEncontrada) {
        if (faqEncontrada.especial === 'seguimiento_pedido') {
            const respuesta = await manejarSeguimientoPedido(usuarioId);
            return { respuesta, faq_id: faqEncontrada.id };
        }
        return { respuesta: faqEncontrada.respuesta, faq_id: faqEncontrada.id };
    }
    const respuestaGrok = await preguntarAGrok(mensajeUsuario);
    if (respuestaGrok) {
        return { respuesta: respuestaGrok, faq_id: null };
    }

    return { respuesta: RESPUESTA_DEFECTO, faq_id: null };
}

module.exports = { responder };

function normalizar(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

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
