async function enviarCorreo({ para, asunto, textoPlano, html }) {
    const apiKey = process.env.RESEND_API_KEY;
    const remitente = process.env.RESEND_FROM || 'Ruta Express <onboarding@resend.dev>';

    if (!apiKey || !para) return false;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                from: remitente,
                to: [para],
                subject: asunto,
                text: textoPlano,
                html: html || `<p>${textoPlano.replace(/\n/g, '<br>')}</p>`
            })
        });

        if (!response.ok) {
            const detalle = await response.text().catch(() => '');
            console.error('⚠️ Resend respondió con error:', response.status, detalle);
            return false;
        }
        return true;
    } catch (error) {
        console.error('⚠️ No se pudo enviar el correo (no crítico):', error.message);
        return false;
    }
}

// Plantilla simple y consistente para las notificaciones de la app.
// Envuelve el mensaje en un layout mínimo con el logo/nombre de Ruta
// Express, para que no llegue como texto plano pelado.
function plantillaNotificacion(titulo, mensaje) {
    return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#1e3a8a;margin:0 0 4px">🚀 Ruta Express</h2>
        <p style="color:#64748b;font-size:13px;margin:0 0 20px">Notificación de tu cuenta</p>
        <div style="background:#ffffff;border-radius:8px;padding:20px;border:1px solid #e2e8f0">
            <h3 style="margin:0 0 8px;color:#0f172a">${titulo}</h3>
            <p style="margin:0;color:#334155;line-height:1.6">${mensaje}</p>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px">
            Ingresa a la app para ver más detalles. Este es un correo automático, por favor no respondas a este mensaje.
        </p>
    </div>`;
}

async function enviarCorreoNotificacion(correoDestino, titulo, mensaje) {
    return enviarCorreo({
        para: correoDestino,
        asunto: `${titulo} — Ruta Express`,
        textoPlano: mensaje,
        html: plantillaNotificacion(titulo, mensaje)
    });
}

module.exports = { enviarCorreo, enviarCorreoNotificacion };
