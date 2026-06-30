const { supabase } = require('../models/init');
const { subirImagen } = require('../utils/storage');
const { crearNotificacion, notificarConductoresPedidoNuevo } = require('../utils/notifications');

class OrderController {
    
    // ============ ENCOMIENDAS ============
    
    static async crearEncomienda(req, res) {
        try {
            const {
                description, origin, origin_reference, origin_lat, origin_lng,
                destination, destination_reference, destination_lat, destination_lng,
                receiver_name, receiver_contact, route_id, schedule_id
            } = req.body;

            let rutaImagen = null;
            if (req.file) {
                try {
                    rutaImagen = await subirImagen(req.file, 'encomiendas', String(req.user.id));
                } catch (uploadErr) {
                    return res.status(500).json({ success: false, message: uploadErr.message });
                }
            }

            if (!description || !receiver_name) {
                return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
            }

            let origenFinal = origin;
            let destinoFinal = destination;
            let rutaConfigId = null;
            let conductorContacto = null; // { nombre, whatsapp } para que el frontend arme el link de WhatsApp

            // Si el usuario eligió una ruta de un conductor, usar origen/destino de esa ruta
            if (route_id) {
                const { data: ruta, error: rutaError } = await supabase
                    .from('configuracion_rutas')
                    .select('id, origen, destino, estado, conductores(nombre_completo, telefono_1, whatsapp)')
                    .eq('id', route_id)
                    .eq('estado', 'activo')
                    .single();

                if (rutaError || !ruta) {
                    return res.status(400).json({ success: false, message: 'La ruta seleccionada ya no está disponible' });
                }

                rutaConfigId = ruta.id;
                origenFinal = ruta.origen;
                destinoFinal = ruta.destino;
                conductorContacto = {
                    nombre: ruta.conductores?.nombre_completo || null,
                    whatsapp: ruta.conductores?.whatsapp || ruta.conductores?.telefono_1 || null
                };
            }

            if (!origenFinal || !destinoFinal) {
                return res.status(400).json({ success: false, message: 'Debes indicar origen y destino, o elegir una ruta disponible' });
            }

            const { data, error } = await supabase
                .from('encomiendas')
                .insert([
                    { 
                        usuario_id: req.user.id,
                        ruta_config_id: rutaConfigId,
                        ruta_imagen: rutaImagen,
                        descripcion: description,
                        origen: origenFinal,
                        referencia_origen: origin_reference,
                        origen_lat: origin_lat || null,
                        origen_lng: origin_lng || null,
                        destino: destinoFinal,
                        referencia_destino: destination_reference,
                        destino_lat: destination_lat || null,
                        destino_lng: destination_lng || null,
                        nombre_receptor: receiver_name,
                        contacto_receptor: receiver_contact,
                        estado: 'en_proceso'
                    }
                ])
                .select();

            if (error) {
                console.error('Error crear encomienda:', error);
                return res.status(500).json({ success: false, message: error.message });
            }

            const nuevaEncomienda = data[0];

            // Avisar al conductor de esa ruta que hay un pedido nuevo (no bloquea la respuesta)
            if (rutaConfigId) {
                notificarConductoresPedidoNuevo(rutaConfigId, 'encomienda', origenFinal, destinoFinal);
            }

            res.status(201).json({ 
                success: true, 
                message: 'Encomienda creada exitosamente', 
                data: {
                    id: nuevaEncomienda?.id,
                    conductor_contacto: conductorContacto,
                    origen: origenFinal,
                    destino: destinoFinal,
                    origin_lat: origin_lat || null,
                    origin_lng: origin_lng || null,
                    destination_lat: destination_lat || null,
                    destination_lng: destination_lng || null
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async obtenerEncomiendasUsuario(req, res) {
        try {
            let query = supabase
                .from('encomiendas')
                .select('*')
                .eq('usuario_id', req.user.id)
                .order('fecha_creacion', { ascending: false });

            if (req.query.status) {
                let statusMap = {
                    'completed': 'culminado',
                    'in_process': 'en_proceso'
                };
                const dbStatus = statusMap[req.query.status] || req.query.status;
                query = query.eq('estado', dbStatus);
            }

            const { data, error } = await query;

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true, data: data || [] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async obtenerEncomiendaPorId(req, res) {
        try {
            const { data, error } = await supabase
                .from('encomiendas')
                .select('*')
                .eq('id', req.params.id)
                .eq('usuario_id', req.user.id)
                .single();

            if (error || !data) {
                return res.status(404).json({ success: false, message: 'Encomienda no encontrada' });
            }

            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async actualizarEncomienda(req, res) {
        try {
            // Verificar si existe y está en proceso
            const { data: existente, error: findError } = await supabase
                .from('encomiendas')
                .select('estado')
                .eq('id', req.params.id)
                .eq('usuario_id', req.user.id)
                .single();

            if (findError || !existente) {
                return res.status(404).json({ success: false, message: 'Encomienda no encontrada' });
            }

            if (existente.estado !== 'en_proceso') {
                return res.status(400).json({ success: false, message: 'Solo se pueden editar encomiendas en proceso' });
            }

            const updates = {};
            if (req.body.description) updates.descripcion = req.body.description;
            if (req.body.origin) updates.origen = req.body.origin;
            if (req.body.destination) updates.destino = req.body.destination;
            if (req.body.receiver_name) updates.nombre_receptor = req.body.receiver_name;
            if (req.body.receiver_contact) updates.contacto_receptor = req.body.receiver_contact;

            const { error } = await supabase
                .from('encomiendas')
                .update(updates)
                .eq('id', req.params.id);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true, message: 'Encomienda actualizada' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async eliminarEncomienda(req, res) {
        try {
            // Verificar si existe y está en proceso sin conductor asignado
            const { data: existente, error: findError } = await supabase
                .from('encomiendas')
                .select('estado, conductor_id')
                .eq('id', req.params.id)
                .eq('usuario_id', req.user.id)
                .single();

            if (findError || !existente) {
                return res.status(404).json({ success: false, message: 'Encomienda no encontrada' });
            }

            if (existente.estado !== 'en_proceso' || existente.conductor_id) {
                return res.status(400).json({ success: false, message: 'No se puede eliminar' });
            }

            const { error } = await supabase
                .from('encomiendas')
                .delete()
                .eq('id', req.params.id);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true, message: 'Encomienda eliminada' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // ============ VIAJES ============
    
    static async crearViaje(req, res) {
        try {
            const {
                origin, destination, departure_time, passenger_count, notes,
                route_id, schedule_id,
                origin_lat, origin_lng, destination_lat, destination_lng
            } = req.body;

            let origenFinal = origin;
            let destinoFinal = destination;
            let horaFinal = departure_time;
            let rutaConfigId = null;
            let conductorContacto = null;
            const cantidadSolicitada = parseInt(passenger_count, 10) || 1;

            if (route_id) {
                const { data: ruta, error: rutaError } = await supabase
                    .from('configuracion_rutas')
                    .select('id, origen, destino, conductor_id, estado, conductores(nombre_completo, telefono_1, whatsapp), vehiculos(capacidad)')
                    .eq('id', route_id)
                    .eq('estado', 'activo')
                    .single();

                if (rutaError || !ruta) {
                    return res.status(400).json({ success: false, message: 'La ruta seleccionada ya no está disponible' });
                }

                // Verificar cupo disponible: capacidad del vehículo menos los
                // asientos ya ocupados por viajes en_proceso de esta misma ruta.
                const capacidad = ruta.vehiculos?.[0]?.capacidad ? parseInt(ruta.vehiculos[0].capacidad, 10) : null;
                if (capacidad !== null) {
                    const { data: viajesActivos, error: viajesError } = await supabase
                        .from('viajes')
                        .select('cantidad_pasajeros')
                        .eq('ruta_config_id', route_id)
                        .eq('estado', 'en_proceso');

                    if (!viajesError) {
                        const ocupados = (viajesActivos || []).reduce((sum, v) => sum + (parseInt(v.cantidad_pasajeros, 10) || 0), 0);
                        const disponibles = capacidad - ocupados;
                        if (disponibles <= 0) {
                            return res.status(400).json({ success: false, message: 'Este vehículo ya está lleno. Elige otra ruta u horario.' });
                        }
                        if (cantidadSolicitada > disponibles) {
                            return res.status(400).json({
                                success: false,
                                message: `Solo quedan ${disponibles} asiento(s) disponible(s) en este vehículo.`
                            });
                        }
                    }
                }

                rutaConfigId = ruta.id;
                origenFinal = ruta.origen;
                destinoFinal = ruta.destino;
                conductorContacto = {
                    nombre: ruta.conductores?.nombre_completo || null,
                    whatsapp: ruta.conductores?.whatsapp || ruta.conductores?.telefono_1 || null
                };

                // Si además eligió un horario específico del conductor, usar esa hora
                if (schedule_id) {
                    const { data: horario } = await supabase
                        .from('horarios_salida')
                        .select('hora_salida')
                        .eq('id', schedule_id)
                        .eq('conductor_id', ruta.conductor_id)
                        .single();
                    if (horario) horaFinal = horario.hora_salida;
                }
            }

            if (!origenFinal || !destinoFinal || !horaFinal) {
                return res.status(400).json({ success: false, message: 'Debes indicar origen, destino y hora, o elegir una ruta disponible' });
            }

            const { data, error } = await supabase
                .from('viajes')
                .insert([
                    { 
                        usuario_id: req.user.id,
                        ruta_config_id: rutaConfigId,
                        origen: origenFinal,
                        origen_lat: origin_lat || null,
                        origen_lng: origin_lng || null,
                        destino: destinoFinal,
                        destino_lat: destination_lat || null,
                        destino_lng: destination_lng || null,
                        hora_salida: horaFinal,
                        cantidad_pasajeros: cantidadSolicitada,
                        notas: notes || null,
                        estado: 'en_proceso'
                    }
                ])
                .select();

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            if (rutaConfigId) {
                notificarConductoresPedidoNuevo(rutaConfigId, 'viaje', origenFinal, destinoFinal);
            }

            res.status(201).json({ 
                success: true, 
                message: 'Viaje creado', 
                data: {
                    id: data[0]?.id,
                    conductor_contacto: conductorContacto,
                    origen: origenFinal,
                    destino: destinoFinal,
                    origin_lat: origin_lat || null,
                    origin_lng: origin_lng || null,
                    destination_lat: destination_lat || null,
                    destination_lng: destination_lng || null
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async obtenerViajesUsuario(req, res) {
        try {
            let query = supabase
                .from('viajes')
                .select('*')
                .eq('usuario_id', req.user.id)
                .order('fecha_creacion', { ascending: false });

            if (req.query.status) {
                let statusMap = {
                    'completed': 'culminado',
                    'in_process': 'en_proceso'
                };
                const dbStatus = statusMap[req.query.status] || req.query.status;
                query = query.eq('estado', dbStatus);
            }

            const { data, error } = await query;

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true, data: data || [] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async actualizarViaje(req, res) {
        try {
            // Verificar si existe y está en proceso
            const { data: existente, error: findError } = await supabase
                .from('viajes')
                .select('estado, conductor_id')
                .eq('id', req.params.id)
                .eq('usuario_id', req.user.id)
                .single();

            if (findError || !existente) {
                return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
            }

            if (existente.estado !== 'en_proceso' || existente.conductor_id) {
                return res.status(400).json({ success: false, message: 'No editable' });
            }

            const updates = {};
            if (req.body.origin) updates.origen = req.body.origin;
            if (req.body.destination) updates.destino = req.body.destination;
            if (req.body.departure_time) updates.hora_salida = req.body.departure_time;
            if (req.body.passenger_count) updates.cantidad_pasajeros = req.body.passenger_count;
            if (req.body.notes) updates.notas = req.body.notes;

            const { error } = await supabase
                .from('viajes')
                .update(updates)
                .eq('id', req.params.id);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true, message: 'Viaje actualizado' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async eliminarViaje(req, res) {
        try {
            // Verificar si existe y está en proceso
            const { data: existente, error: findError } = await supabase
                .from('viajes')
                .select('estado, conductor_id')
                .eq('id', req.params.id)
                .eq('usuario_id', req.user.id)
                .single();

            if (findError || !existente) {
                return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
            }

            if (existente.estado !== 'en_proceso' || existente.conductor_id) {
                return res.status(400).json({ success: false, message: 'No eliminable' });
            }

            const { error } = await supabase
                .from('viajes')
                .delete()
                .eq('id', req.params.id);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true, message: 'Viaje eliminado' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // ============ CONDUCTOR ============
    
    static async obtenerPedidosConductor(req, res) {
        try {
            // Obtener las rutas del conductor
            const { data: rutas, error: rutasError } = await supabase
                .from('configuracion_rutas')
                .select('id')
                .eq('conductor_id', req.user.conductor_id);

            if (rutasError) {
                return res.status(500).json({ success: false, message: rutasError.message });
            }

            const rutaIds = rutas?.map(r => r.id) || [];

            if (rutaIds.length === 0) {
                return res.json({ success: true, data: { encomiendas: [], viajes: [] } });
            }

            // Obtener encomiendas que coinciden con las rutas del conductor
            const { data: encomiendas, error: encError } = await supabase
                .from('encomiendas')
                .select(`
                    *,
                    usuarios!inner (nombre_usuario)
                `)
                .in('ruta_config_id', rutaIds)
                .eq('estado', 'en_proceso')
                .order('fecha_creacion', { ascending: false });

            // Obtener viajes que coinciden con las rutas del conductor
            const { data: viajes, error: viajesError } = await supabase
                .from('viajes')
                .select(`
                    *,
                    usuarios!inner (nombre_usuario)
                `)
                .in('ruta_config_id', rutaIds)
                .eq('estado', 'en_proceso')
                .order('fecha_creacion', { ascending: false });

            const formatearEncomiendas = (encomiendas || []).map(e => ({
                ...e,
                nombre_usuario: e.usuarios?.nombre_usuario,
                tipo_pedido: 'encomienda'
            }));

            const formatearViajes = (viajes || []).map(v => ({
                ...v,
                nombre_usuario: v.usuarios?.nombre_usuario,
                tipo_pedido: 'viaje'
            }));

            res.json({ 
                success: true, 
                data: { 
                    encomiendas: formatearEncomiendas, 
                    viajes: formatearViajes,
                    todos: [...formatearEncomiendas, ...formatearViajes]
                } 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async culminarEncomienda(req, res) {
        try {
            // Verificar que existe y está en proceso
            const { data: existente, error: findError } = await supabase
                .from('encomiendas')
                .select('estado, usuario_id, origen, destino')
                .eq('id', req.params.id)
                .single();

            if (findError || !existente) {
                return res.status(404).json({ success: false, message: 'Encomienda no encontrada' });
            }

            if (existente.estado !== 'en_proceso') {
                return res.status(400).json({ success: false, message: 'Ya fue culminada' });
            }

            const { error } = await supabase
                .from('encomiendas')
                .update({ 
                    estado: 'culminado', 
                    conductor_id: req.user.conductor_id,
                    fecha_culminacion: new Date().toISOString()
                })
                .eq('id', req.params.id);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            crearNotificacion(
                existente.usuario_id,
                'pedido_culminado',
                'Tu encomienda fue entregada',
                `Tu encomienda de ${existente.origen} a ${existente.destino} fue marcada como culminada.`,
                { tipo: 'encomienda', id: req.params.id }
            );

            res.json({ success: true, message: 'Encomienda culminada exitosamente' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async culminarViaje(req, res) {
        try {
            // Verificar que existe y está en proceso
            const { data: existente, error: findError } = await supabase
                .from('viajes')
                .select('estado, usuario_id, origen, destino')
                .eq('id', req.params.id)
                .single();

            if (findError || !existente) {
                return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
            }

            if (existente.estado !== 'en_proceso') {
                return res.status(400).json({ success: false, message: 'Ya fue culminado' });
            }

            const { error } = await supabase
                .from('viajes')
                .update({ 
                    estado: 'culminado', 
                    conductor_id: req.user.conductor_id,
                    fecha_culminacion: new Date().toISOString()
                })
                .eq('id', req.params.id);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            crearNotificacion(
                existente.usuario_id,
                'pedido_culminado',
                'Tu viaje fue completado',
                `Tu viaje de ${existente.origen} a ${existente.destino} fue marcado como culminado.`,
                { tipo: 'viaje', id: req.params.id }
            );

            res.json({ success: true, message: 'Viaje culminado exitosamente' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async obtenerHistorialCulminados(req, res) {
        try {
            // Obtener encomiendas culminadas
            const { data: encomiendas, error: encError } = await supabase
                .from('encomiendas')
                .select(`
                    *,
                    usuarios!inner (nombre_usuario),
                    configuracion_rutas!left (precio)
                `)
                .eq('conductor_id', req.user.conductor_id)
                .eq('estado', 'culminado')
                .order('fecha_culminacion', { ascending: false });

            // Obtener viajes culminados
            const { data: viajes, error: viajesError } = await supabase
                .from('viajes')
                .select(`
                    *,
                    usuarios!inner (nombre_usuario),
                    configuracion_rutas!left (precio)
                `)
                .eq('conductor_id', req.user.conductor_id)
                .eq('estado', 'culminado')
                .order('fecha_culminacion', { ascending: false });

            const formatearEncomiendas = (encomiendas || []).map(e => ({
                ...e,
                tipo_pedido: 'encomienda',
                nombre_usuario: e.usuarios?.nombre_usuario,
                precio: e.configuracion_rutas?.precio
            }));

            const formatearViajes = (viajes || []).map(v => ({
                ...v,
                tipo_pedido: 'viaje',
                nombre_usuario: v.usuarios?.nombre_usuario,
                precio: v.configuracion_rutas?.precio
            }));

            const todos = [...formatearEncomiendas, ...formatearViajes];
            const total = todos.reduce((sum, o) => sum + (parseFloat(o.precio) || 0), 0);

            res.json({ 
                success: true, 
                data: { 
                    pedidos: todos, 
                    totalGanancias: total 
                } 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = OrderController;