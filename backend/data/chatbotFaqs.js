module.exports = [
    {
        id: 'seguimiento_pedido',
        rol: 'ambos',
        palabras_clave: ['donde esta', 'estado de mi pedido', 'seguimiento', 'mi encomienda', 'mi viaje', 'rastrear', 'mi pedido'],
        especial: 'seguimiento_pedido',
        respuesta: 'Para darte el estado de tu pedido necesito que inicies sesión. Una vez dentro, puedo decirte si está en proceso o ya fue culminado.'
    },
    {
        id: 'como_registrarse',
        rol: 'ambos',
        palabras_clave: ['como me registro', 'como crear cuenta', 'registrarme', 'crear una cuenta', 'como me uno'],
        respuesta: 'Para registrarte: entra a la pantalla de inicio, presiona "Regístrate como Usuario" (o "Como Conductor" si quieres ofrecer viajes), completa tus datos y listo. También puedes registrarte con tu cuenta de Google en un solo paso.'
    },
    {
        id: 'calificaciones_conductor_ve',
        rol: 'conductor',
        palabras_clave: ['mis resenas', 'mis calificaciones', 'que me calificaron', 'ver resenas', 'estrellas que tengo'],
        respuesta: 'En "Mis Reseñas" puedes ver todas las calificaciones y comentarios que te han dejado tus clientes. Tu promedio de estrellas es lo primero que ven los usuarios al elegir un conductor, así que entre mejor servicio, más pedidos.'
    },
    {
        id: 'calificaciones_cliente_da',
        rol: 'cliente',
        palabras_clave: ['calificar', 'calificacion', 'reseña', 'resena', 'estrellas', 'opinion del conductor', 'dejar comentario'],
        respuesta: 'Cuando un conductor culmina tu encomienda o viaje, puedes calificarlo con estrellas y dejar un comentario desde "Mis Pedidos". Esa calificación promedio la ven los demás usuarios al elegir conductor.'
    },
    {
        id: 'cambiar_tema',
        rol: 'ambos',
        palabras_clave: ['modo oscuro', 'tema oscuro', 'cambiar color', 'modo claro'],
        respuesta: 'Puedes cambiar entre tema claro y oscuro desde la sección "Ajustes" de tu panel.'
    },
    {
        id: 'eliminar_cuenta',
        rol: 'ambos',
        palabras_clave: ['eliminar mi cuenta', 'borrar cuenta', 'dar de baja', 'darme de baja'],
        respuesta: 'Puedes eliminar tu cuenta desde "Ajustes" → "Eliminar cuenta". Esta acción es permanente y te pedirá confirmar tu contraseña.'
    },
    {
        id: 'cerrar_sesion',
        rol: 'ambos',
        palabras_clave: ['cerrar sesion', 'salir de mi cuenta', 'desconectarme', 'logout'],
        respuesta: 'Para cerrar sesión, busca el botón "Cerrar Sesión" al final del menú lateral, debajo de tu nombre de usuario.'
    },
    {
        id: 'contacto_soporte',
        rol: 'ambos',
        palabras_clave: ['hablar con alguien', 'soporte', 'ayuda humana', 'contactar', 'reclamo'],
        respuesta: 'Por ahora no contamos con soporte humano integrado en la aplicación. Si tu consulta no se resuelve aquí, intenta describirla con otras palabras o contacta directamente al conductor asignado a tu pedido.'
    },

    {
        id: 'como_enviar_encomienda',
        rol: 'cliente',
        palabras_clave: ['como envio', 'enviar un paquete', 'mandar una encomienda', 'crear encomienda', 'enviar encomienda', 'nueva encomienda', 'creo una encomienda'],
        respuesta: 'Ve a "Encomiendas" → "Nueva Encomienda". Escribe el lugar de origen (ej: Piura) para ver los conductores que salen desde ahí, elige uno, indica el punto exacto de recojo (puedes usar tu ubicación actual o el mapa) y completa los datos de quien recibe el paquete — el nombre y el contacto de esa persona son obligatorios.'
    },
    {
        id: 'como_pedir_viaje',
        rol: 'cliente',
        palabras_clave: ['como pido un viaje', 'reservar viaje', 'crear viaje', 'pedir transporte', 'como viajo', 'reservar pasaje', 'nuevo viaje', 'creo un viaje', 'quiero viajar'],
        respuesta: 'Ve a "Viajes" → "Nuevo Viaje". Escribe el lugar de origen para ver los conductores que salen desde ahí (con su ruta, precio, placa, asientos disponibles y horarios), elige uno, indica cuántos pasajeros son y el punto exacto de recojo.'
    },
    {
        id: 'buscar_por_origen',
        rol: 'cliente',
        palabras_clave: ['no aparece ningun conductor', 'no encuentro conductor', 'como busco conductor', 'buscar origen'],
        respuesta: 'En Encomiendas y Viajes, escribe el lugar de origen en el buscador (ej: "Piura") y aparecerán solo los conductores cuya ruta sale desde ahí. El destino no se busca aparte: ya viene incluido en la ruta de cada conductor.'
    },
    {
        id: 'punto_exacto_recojo',
        rol: 'cliente',
        palabras_clave: ['punto exacto', 'ubicacion actual', 'usar mi ubicacion', 'donde me recogen', 'direccion de recojo'],
        respuesta: 'En el punto de recojo puedes escribir la dirección (te da sugerencias mientras escribes), presionar "Usar mi ubicación actual" para que tu celular la detecte solo, o abrir el mapa para ajustar el pin exacto arrastrándolo.'
    },
    {
        id: 'asientos_disponibles',
        rol: 'cliente',
        palabras_clave: ['asientos disponibles', 'cupos', 'vehiculo lleno', 'cuantos asientos quedan'],
        respuesta: 'Cada tarjeta de conductor en Viajes muestra cuántos asientos le quedan libres de su capacidad total. Si el vehículo ya está lleno, no podrás seleccionarlo hasta que se libere un cupo o elijas otro conductor/horario.'
    },
    {
        id: 'mis_pedidos_cliente',
        rol: 'cliente',
        palabras_clave: ['mis pedidos', 'ver mis encomiendas', 'ver mis viajes', 'historial de pedidos cliente'],
        respuesta: 'En "Mis Pedidos" ves todas tus encomiendas y viajes: los que están en proceso y los ya culminados. Desde ahí puedes cancelar un pedido (si aún no tiene conductor asignado) o calificar uno que ya terminó.'
    },
    {
        id: 'cancelar_pedido',
        rol: 'cliente',
        palabras_clave: ['cancelar', 'eliminar mi pedido', 'anular encomienda', 'anular viaje', 'cancelar encomienda', 'cancelar viaje', 'cancelar pedido'],
        respuesta: 'Puedes eliminar una encomienda o viaje desde "Mis Pedidos" siempre que todavía no tenga un conductor asignado y siga en proceso.'
    },
    {
        id: 'contactar_conductor',
        rol: 'cliente',
        palabras_clave: ['contactar conductor', 'whatsapp conductor', 'como aviso al conductor', 'hablar con el conductor'],
        respuesta: 'Al crear tu encomienda o viaje, se genera automáticamente un mensaje con los detalles (origen, destino, ubicación, etc.) listo para enviar por WhatsApp directo al conductor que elegiste.'
    },
    {
        id: 'tarifas',
        rol: 'cliente',
        palabras_clave: ['cuanto cuesta', 'precio', 'tarifa', 'costo del envio', 'cuanto cobran'],
        respuesta: 'El precio lo define cada conductor según su ruta. Al buscar por origen, vas a ver el precio de cada conductor directamente en su tarjeta antes de elegirlo.'
    },
    {
        id: 'como_pago_pedido',
        rol: 'cliente',
        palabras_clave: ['como pago', 'yape', 'plin', 'metodos de pago', 'puedo pagar con', 'como le pago al conductor'],
        respuesta: 'El pago de cada encomienda o viaje se coordina directamente con el conductor (por ejemplo Yape, Plin o efectivo); la app no procesa ese cobro.'
    },

    {
        id: 'ser_conductor',
        rol: 'ambos',
        palabras_clave: ['ser conductor', 'quiero manejar', 'ofrecer viajes', 'registrarme como conductor', 'trabajar con ustedes'],
        respuesta: 'Para ser conductor, regístrate eligiendo la opción "Como Conductor" en la pantalla de registro. Deberás indicar tu nombre completo, edad (mínimo 18 años) y teléfono. Luego podrás registrar tu vehículo y configurar tus rutas y horarios.'
    },
    {
        id: 'mi_vehiculo',
        rol: 'conductor',
        palabras_clave: ['agregar vehiculo', 'mi vehiculo', 'subir foto del carro', 'registrar mi carro', 'placa', 'editar vehiculo'],
        respuesta: 'En "Mi Vehículo" registras la placa, marca, modelo, color y capacidad de asientos, y puedes subir una foto (JPEG, PNG, WEBP o HEIC, máximo 5MB). Esta información es la que ven los clientes al elegirte.'
    },
    {
        id: 'configurar_rutas',
        rol: 'conductor',
        palabras_clave: ['crear ruta', 'configurar ruta', 'agregar ruta', 'mis rutas', 'cuantas rutas puedo tener', 'eliminar ruta'],
        respuesta: 'En "Rutas" agregas tus rutas fijas indicando origen, destino y precio por pasajero/encomienda. Puedes tener hasta 8 rutas activas a la vez, y eliminarlas cuando ya no las ofrezcas.'
    },
    {
        id: 'configurar_horarios',
        rol: 'conductor',
        palabras_clave: ['configurar horario', 'agregar horario', 'hora de salida', 'mis horarios'],
        respuesta: 'En "Horarios" defines a qué horas sales en tus rutas. Estos horarios son los que el cliente puede elegir al reservar un viaje contigo, en vez de pedirte una hora manual.'
    },
    {
        id: 'ver_pedidos_conductor',
        rol: 'conductor',
        palabras_clave: ['pedidos nuevos', 'pedidos asignados', 'tengo algun pedido', 'ver encomiendas asignadas', 'ver viajes asignados'],
        respuesta: 'En "Pedidos" ves las encomiendas y viajes que los clientes te asignaron (ya sea porque coincide con una de tus rutas, o porque te eligieron directamente). Ahí mismo los marcas como "Culminado" cuando termines el servicio.'
    },
    {
        id: 'marcar_culminado',
        rol: 'conductor',
        palabras_clave: ['marcar culminado', 'terminar pedido', 'ya entregue', 'ya complete el viaje', 'finalizar pedido'],
        respuesta: 'Desde "Pedidos", cada encomienda o viaje activo tiene un botón para marcarlo como culminado una vez completado. Al hacerlo, pasa a tu Historial y el cliente puede calificarte.'
    },
    {
        id: 'historial_ganancias',
        rol: 'conductor',
        palabras_clave: ['mi historial', 'cuanto he ganado', 'ganancias', 'pedidos completados', 'pasajeros reservados'],
        respuesta: 'En "Historial" ves todos tus pedidos culminados, el total ganado estimado, y en los viajes la cantidad de pasajeros que llevaste en cada uno.'
    },
    {
        id: 'asientos_compartidos',
        rol: 'conductor',
        palabras_clave: ['mis asientos', 'cupos de mi vehiculo', 'asientos entre rutas', 'se comparten los asientos'],
        respuesta: 'La capacidad de asientos es de tu vehículo, así que se comparte entre todas tus rutas activas: si reservan pasajeros en una ruta, esos asientos dejan de estar disponibles también en tus otras rutas, porque es el mismo vehículo.'
    },
    {
        id: 'disponibilidad_conductor',
        rol: 'conductor',
        palabras_clave: ['estar disponible', 'activarme', 'aparecer disponible', 'desactivarme', 'dejar de recibir pedidos'],
        respuesta: 'El switch "Disponible" (arriba a la derecha de tu panel) controla si los clientes pueden verte y elegirte. Actívalo cuando estés listo para recibir pedidos, y desactívalo cuando no.'
    },
    {
        id: 'suscripcion',
        rol: 'conductor',
        palabras_clave: ['suscripcion', 'mensualidad', 'cuanto cuesta la app', 'pagar la app', 'renovar', 'vencio mi suscripcion', 'plan'],
        respuesta: 'Como conductor, necesitas una suscripción activa de S/25 al mes para poder activarte y recibir pedidos. Puedes pagarla y ver tu fecha de renovación desde la sección "Suscripción" de tu panel.'
    },
    {
        id: 'suscripcion_vencida',
        rol: 'conductor',
        palabras_clave: ['no puedo activarme', 'no me deja activarme', 'suscripcion vencida', 'suscripcion pendiente'],
        respuesta: 'Si tu suscripción venció, no podrás activarte para recibir pedidos hasta renovarla. Ve a "Suscripción" para pagar y reactivar tu cuenta al instante.'
    },
    {
        id: 'mis_datos_conductor',
        rol: 'conductor',
        palabras_clave: ['mis datos', 'editar mi perfil', 'cambiar mi telefono', 'cambiar mi whatsapp'],
        respuesta: 'En "Mis Datos" puedes actualizar tu nombre, teléfono y WhatsApp — este último es el número al que te escriben los clientes cuando te eligen.'
    }
];
