const { supabase } = require('../models/init');

class RouteConfigController {
    
    
    static async obtenerHorarios(req, res) {
        try {
            const { data, error } = await supabase
                .from('horarios_salida')
                .select('*')
                .eq('conductor_id', req.user.conductor_id)
                .order('hora_salida', { ascending: true });

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true, data: data || [] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async agregarHorario(req, res) {
        try {
            const { departure_time } = req.body;
            if (!departure_time) {
                return res.status(400).json({ success: false, message: 'La hora de salida es obligatoria' });
            }

            // Verificar límite de 4 horarios
            const { count, error: countError } = await supabase
                .from('horarios_salida')
                .select('id', { count: 'exact', head: true })
                .eq('conductor_id', req.user.conductor_id);

            if (countError) {
                return res.status(500).json({ success: false, message: countError.message });
            }

            if (count >= 4) {
                return res.status(400).json({ success: false, message: 'Máximo 4 horarios permitidos' });
            }

            const { data, error } = await supabase
                .from('horarios_salida')
                .insert([{ conductor_id: req.user.conductor_id, hora_salida: departure_time }])
                .select();

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.status(201).json({ 
                success: true, 
                message: 'Horario agregado', 
                data: { id: data[0]?.id } 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async actualizarHorario(req, res) {
        try {
            const { departure_time } = req.body;
            const { error } = await supabase
                .from('horarios_salida')
                .update({ hora_salida: departure_time })
                .eq('id', req.params.id)
                .eq('conductor_id', req.user.conductor_id);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true, message: 'Horario actualizado' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async eliminarHorario(req, res) {
        try {
            const { error } = await supabase
                .from('horarios_salida')
                .delete()
                .eq('id', req.params.id)
                .eq('conductor_id', req.user.conductor_id);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true, message: 'Horario eliminado' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // ============ RUTAS ============
    
    static async obtenerRutas(req, res) {
        try {
            const { data, error } = await supabase
                .from('configuracion_rutas')
                .select('*')
                .eq('conductor_id', req.user.conductor_id)
                .eq('estado', 'activo')
                .order('fecha_creacion', { ascending: false });

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true, data: data || [] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async obtenerRutasDisponibles(req, res) {
        try {
            const { data, error } = await supabase
                .from('configuracion_rutas')
                .select(`
                    *,
                    conductores!inner (
                        id,
                        nombre_completo,
                        telefono_1,
                        disponible,
                        estado
                    ),
                    vehiculos (
                        placa,
                        marca,
                        modelo,
                        color,
                        foto_vehiculo
                    )
                `)
                .eq('estado', 'activo')
                .eq('conductores.disponible', 1)
                .eq('conductores.estado', 'activo')
                .order('fecha_creacion', { ascending: false });

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            const rutas = data || [];

            // Obtener horarios de todos los conductores presentes en estas rutas, en una sola consulta
            const conductorIds = [...new Set(rutas.map(r => r.conductores?.id).filter(Boolean))];
            let horariosPorConductor = {};

            if (conductorIds.length > 0) {
                const { data: horarios, error: horError } = await supabase
                    .from('horarios_salida')
                    .select('id, conductor_id, hora_salida')
                    .in('conductor_id', conductorIds)
                    .order('hora_salida', { ascending: true });

                if (!horError && horarios) {
                    horariosPorConductor = horarios.reduce((acc, h) => {
                        if (!acc[h.conductor_id]) acc[h.conductor_id] = [];
                        acc[h.conductor_id].push({ id: h.id, hora_salida: h.hora_salida });
                        return acc;
                    }, {});
                }
            }

            // Formatear respuesta incluyendo horarios del conductor de cada ruta
            const rutasFormateadas = rutas.map(r => ({
                ...r,
                nombre_completo: r.conductores?.nombre_completo,
                telefono_1: r.conductores?.telefono_1,
                placa: r.vehiculos?.[0]?.placa,
                marca: r.vehiculos?.[0]?.marca,
                modelo: r.vehiculos?.[0]?.modelo,
                color_vehiculo: r.vehiculos?.[0]?.color,
                foto_vehiculo: r.vehiculos?.[0]?.foto_vehiculo,
                horarios: horariosPorConductor[r.conductores?.id] || []
            }));

            res.json({ success: true, data: rutasFormateadas });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async agregarRuta(req, res) {
        try {
            const { origin, destination, price } = req.body;
            if (!origin || !destination || !price) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Origen, destino y precio son obligatorios' 
                });
            }

            // Verificar límite de 8 rutas
            const { count, error: countError } = await supabase
                .from('configuracion_rutas')
                .select('id', { count: 'exact', head: true })
                .eq('conductor_id', req.user.conductor_id)
                .eq('estado', 'activo');

            if (countError) {
                return res.status(500).json({ success: false, message: countError.message });
            }

            if (count >= 8) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Máximo 8 rutas permitidas' 
                });
            }

            const { data, error } = await supabase
                .from('configuracion_rutas')
                .insert([{ 
                    conductor_id: req.user.conductor_id, 
                    origen: origin, 
                    destino: destination, 
                    precio: parseFloat(price),
                    estado: 'activo'
                }])
                .select();

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.status(201).json({ 
                success: true, 
                message: 'Ruta agregada', 
                data: { id: data[0]?.id } 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async actualizarRuta(req, res) {
        try {
            const updates = {};
            if (req.body.origin) updates.origen = req.body.origin;
            if (req.body.destination) updates.destino = req.body.destination;
            if (req.body.price) updates.precio = parseFloat(req.body.price);

            const { error } = await supabase
                .from('configuracion_rutas')
                .update(updates)
                .eq('id', req.params.id)
                .eq('conductor_id', req.user.conductor_id);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true, message: 'Ruta actualizada' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async eliminarRuta(req, res) {
        try {
            const { error } = await supabase
                .from('configuracion_rutas')
                .update({ estado: 'inactivo' })
                .eq('id', req.params.id)
                .eq('conductor_id', req.user.conductor_id);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true, message: 'Ruta eliminada' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = RouteConfigController;
