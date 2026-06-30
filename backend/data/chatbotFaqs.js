// Base de preguntas frecuentes del chatbot de Ruta Express.
//
// Cómo funciona el emparejamiento (ver backend/utils/chatbotEngine.js):
// cada entrada tiene una lista de "palabras_clave". Cuando el usuario
// escribe un mensaje, se cuenta cuántas palabras clave de cada entrada
// aparecen en el mensaje (sin distinguir mayúsculas/acentos) y se elige
// la entrada con más coincidencias. Si ninguna entrada tiene al menos
// una coincidencia, se devuelve una respuesta por defecto.
//
// Para agregar una pregunta nueva: copia un bloque, cambia el id,
// las palabras_clave (en minúsculas, sin tildes) y la respuesta.

module.exports = [
    {
        id: 'seguimiento_pedido',
        palabras_clave: ['donde esta', 'estado de mi pedido', 'seguimiento', 'mi encomienda', 'mi viaje', 'rastrear', 'mi pedido'],
        // Esta entrada es especial: antes de responder con texto fijo,
        // el motor del chatbot intenta consultar los pedidos reales del
        // usuario autenticado. Ver chatbotEngine.js -> manejarSeguimiento().
        especial: 'seguimiento_pedido',
        respuesta: 'Para darte el estado de tu pedido necesito que inicies sesión. Una vez dentro, puedo decirte si está en proceso o ya fue culminado.'
    },
    {
        id: 'como_registrarse',
        palabras_clave: ['como me registro', 'como crear cuenta', 'registrarme', 'crear una cuenta', 'como me uno'],
        respuesta: 'Para registrarte: entra a la pantalla de inicio, presiona "Regístrate como Usuario" (o "Como Conductor" si quieres ofrecer viajes), completa tus datos y listo. También puedes registrarte con tu cuenta de Google en un solo paso.'
    },
    {
        id: 'tarifas',
        palabras_clave: ['cuanto cuesta', 'precio', 'tarifa', 'costo del envio', 'cuanto cobran'],
        respuesta: 'El precio lo define cada conductor según su ruta. Cuando elijas una ruta disponible al crear tu encomienda o viaje, vas a ver el precio exacto antes de confirmar.'
    },
    {
        id: 'como_enviar_encomienda',
        palabras_clave: ['como envio', 'enviar un paquete', 'mandar una encomienda', 'crear encomienda', 'enviar encomienda'],
        respuesta: 'Ve a la sección "Encomiendas" de tu panel, presiona "Nueva Encomienda", elige una ruta con conductor disponible (o escribe origen/destino manualmente) y completa los datos de quien recibe el paquete.'
    },
    {
        id: 'como_pedir_viaje',
        palabras_clave: ['como pido un viaje', 'reservar viaje', 'crear viaje', 'pedir transporte', 'como viajo'],
        respuesta: 'Ve a la sección "Viajes", presiona "Nuevo Viaje", elige una ruta disponible y selecciona el horario de salida del conductor (o indica la hora que prefieras si no hay rutas disponibles).'
    },
    {
        id: 'suscripcion',
        palabras_clave: ['suscripcion', 'mensualidad', 'cuanto cuesta la app', 'pagar la app', 'renovar', 'vencio mi suscripcion', 'plan'],
        respuesta: 'Ruta Express tiene una suscripción de S/25 al mes para poder crear encomiendas y viajes (o, si eres conductor, para poder activarte y recibir pedidos). Puedes pagarla y ver tu fecha de renovación desde la sección "Suscripción" de tu panel.'
    },
    {
        id: 'como_pago_pedido',
        palabras_clave: ['como pago', 'yape', 'plin', 'metodos de pago', 'puedo pagar con', 'como le pago al conductor'],
        respuesta: 'El pago de cada encomienda o viaje se coordina directamente con el conductor (por ejemplo Yape, Plin o efectivo); la app no procesa ese cobro. Lo único que se paga dentro de la app es la suscripción mensual de S/25.'
    },
    {
        id: 'calificaciones',
        palabras_clave: ['calificar', 'calificacion', 'reseña', 'resena', 'estrellas', 'opinion del conductor'],
        respuesta: 'Cuando un conductor culmina tu encomienda o viaje, puedes calificarlo con estrellas y dejar un comentario desde "Mis Pedidos". Esa calificación promedio la ven los demás usuarios al elegir conductor.'
    },
    {
        id: 'cancelar_pedido',
        palabras_clave: ['cancelar', 'eliminar mi pedido', 'anular encomienda', 'anular viaje'],
        respuesta: 'Puedes eliminar una encomienda o viaje desde "Mis Pedidos" siempre que todavía no tenga un conductor asignado y siga en proceso.'
    },
    {
        id: 'ser_conductor',
        palabras_clave: ['ser conductor', 'quiero manejar', 'ofrecer viajes', 'registrarme como conductor', 'trabajar con ustedes'],
        respuesta: 'Para ser conductor, regístrate eligiendo la opción "Como Conductor" en la pantalla de registro. Deberás indicar tu nombre completo, edad (mínimo 18 años) y teléfono. Luego podrás registrar tu vehículo y configurar tus rutas y horarios.'
    },
    {
        id: 'cambiar_tema',
        palabras_clave: ['modo oscuro', 'tema oscuro', 'cambiar color', 'modo claro'],
        respuesta: 'Puedes cambiar entre tema claro y oscuro desde la sección "Ajustes" de tu panel.'
    },
    {
        id: 'eliminar_cuenta',
        palabras_clave: ['eliminar mi cuenta', 'borrar cuenta', 'dar de baja', 'darme de baja'],
        respuesta: 'Puedes eliminar tu cuenta desde "Ajustes" → "Eliminar cuenta". Esta acción es permanente y te pedirá confirmar tu contraseña.'
    },
    {
        id: 'contacto_soporte',
        palabras_clave: ['hablar con alguien', 'soporte', 'ayuda humana', 'contactar', 'reclamo'],
        respuesta: 'Por ahora no contamos con soporte humano integrado en la aplicación. Si tu consulta no se resuelve aquí, intenta describirla con otras palabras o contacta directamente al conductor asignado a tu pedido.'
    }
];
