const { supabase } = require('../models/init');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `Eres el asistente virtual de Ruta Express, una plataforma de encomiendas y viajes en Perú.
Responde siempre en español, de forma amable, breve y clara.
Solo responde preguntas relacionadas con el servicio: encomiendas, viajes, tarifas, pagos, registro, cuenta, conductores y pedidos.
Si te preguntan algo que no tiene que ver con Ruta Express, di amablemente que solo puedes ayudar con temas del servicio.
No inventes información. Si no sabes algo específico, dile al usuario que contacte al conductor directamente.
Estos son los temas que manejas:
- Cómo registrarse como usuario o conductor
- Cómo enviar una encomienda o pedir un viaje
- Tarifas (las define cada conductor en su ruta)
- Métodos de pago: Yape, Plin u otras billeteras digitales
- Cómo cancelar un pedido
- Cómo ser conductor en la plataforma
- Ajustes de cuenta (tema claro/oscuro, eliminar cuenta)
- Estado de pedidos (solo si el sistema te proporciona esa información)`;

// Caso especial: consulta pedidos reales del usuario en Supabase
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

// Detecta si el usuario pregunta por el estado de su pedido
function esPreguntaDeSeguimiento(mensaje) {
    const palabras = ['donde esta', 'estado de mi pedido', 'seguimiento', 'mi encomienda', 'mi viaje', 'rastrear', 'mi pedido', 'en proceso'];
    const mensajeNorm = mensaje.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return palabras.some(p => mensajeNorm.includes(p));
}

// Llama a Groq con el mensaje del usuario
async function llamarGroq(mensajeUsuario, contextoExtra = '') {
    if (!GROQ_API_KEY) {
        return 'El asistente no está configurado correctamente. Contacta al administrador.';
    }

    const mensajeFinal = contextoExtra
        ? `${mensajeUsuario}\n\n[Contexto del sistema: ${contextoExtra}]`
        : mensajeUsuario;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: mensajeFinal }
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error Groq:', data);
            return 'Hubo un problema al procesar tu pregunta. Intenta de nuevo en un momento.';
        }

        return data.choices?.[0]?.message?.content?.trim() || 'No pude generar una respuesta. Intenta de nuevo.';

    } catch (error) {
        console.error('Error llamando a Groq:', error.message);
        return 'Hubo un problema de conexión. Intenta de nuevo en un momento.';
    }
}

// Punto de entrada del chatbot
async function responder(mensajeUsuario, usuarioId = null) {
    try {
        // Caso especial: seguimiento de pedido con datos reales de Supabase
        if (esPreguntaDeSeguimiento(mensajeUsuario) && usuarioId) {
            const infoPedidos = await manejarSeguimientoPedido(usuarioId);
            const respuesta = await llamarGroq(mensajeUsuario, infoPedidos);
            return { respuesta, faq_id: 'seguimiento_pedido' };
        }

        // Caso general: Groq responde libremente dentro del contexto de Ruta Express
        const respuesta = await llamarGroq(mensajeUsuario);
        return { respuesta, faq_id: null };

    } catch (error) {
        console.error('Error en chatbot:', error.message);
        return {
            respuesta: 'Hubo un problema al procesar tu pregunta. Intenta de nuevo en un momento.',
            faq_id: null
        };
    }
}

module.exports = { responder };
