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
                        whatsapp,
                        disponible,
                        estado
                    )
                `)
                .eq('estado', 'activo')
                .order('fecha_creacion', { ascending: false });

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            const rutasFiltradas = (data || []).filter(r =>
                r.conductores &&
                r.conductores.disponible === 1 &&
                r.conductores.estado === 'activo'
            );

            const conductorIds = [...new Set(rutasFiltradas.map(r => r.conductores?.id).filter(Boolean))];

            let vehiculoPorConductorId = {};
            if (conductorIds.length > 0) {
                const { data: vehiculosData, error: vehError } = await supabase
                    .from('vehiculos')
                    .select('conductor_id, placa, marca, modelo, color, capacidad, foto_vehiculo')
                    .in('conductor_id', conductorIds);

                if (!vehError && vehiculosData) {
                    vehiculosData.forEach(v => {
                        if (!vehiculoPorConductorId[v.conductor_id]) vehiculoPorConductorId[v.conductor_id] = v;
                    });
                }
            }

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

            const rutaIds = rutasFiltradas.map(r => r.id);
            let ocupadosPorRuta = {};
            if (rutaIds.length > 0) {
                const { data: viajesActivos, error: viajesError } = await supabase
                    .from('viajes')
                    .select('ruta_config_id, cantidad_pasajeros')
                    .in('ruta_config_id', rutaIds)
                    .eq('estado', 'en_proceso');

                if (!viajesError && viajesActivos) {
                    ocupadosPorRuta = viajesActivos.reduce((acc, v) => {
                        const cant = parseInt(v.cantidad_pasajeros, 10) || 0;
                        acc[v.ruta_config_id] = (acc[v.ruta_config_id] || 0) + cant;
                        return acc;
                    }, {});
                }
            }

            let ratingPorConductor = {};
            if (conductorIds.length > 0) {
                const { data: calificaciones, error: califError } = await supabase
                    .from('calificaciones')
                    .select('conductor_id, estrellas')
                    .in('conductor_id', conductorIds);

                if (!califError && calificaciones) {
                    const agrupado = calificaciones.reduce((acc, c) => {
                        if (!acc[c.conductor_id]) acc[c.conductor_id] = { suma: 0, total: 0 };
                        acc[c.conductor_id].suma += c.estrellas;
                        acc[c.conductor_id].total += 1;
                        return acc;
                    }, {});
                    ratingPorConductor = Object.fromEntries(
                        Object.entries(agrupado).map(([id, v]) => [
                            id,
                            { promedio: Math.round((v.suma / v.total) * 10) / 10, total: v.total }
                        ])
                    );
                }
            }

            const rutasFormateadas = rutasFiltradas.map(r => {
                const v = vehiculoPorConductorId[r.conductores?.id] || {};
                const capacidad = v.capacidad ? parseInt(v.capacidad, 10) : null;
                const ocupados = ocupadosPorRuta[r.id] || 0;
                const disponibles = capacidad !== null ? Math.max(0, capacidad - ocupados) : null;
                const rating = ratingPorConductor[r.conductores?.id] || { promedio: 0, total: 0 };

                return {
                    ...r,
                    nombre_completo: r.conductores?.nombre_completo,
                    telefono_1: r.conductores?.telefono_1,
                    whatsapp: r.conductores?.whatsapp || r.conductores?.telefono_1,
                    placa: v.placa || null,
                    marca: v.marca || null,
                    modelo: v.modelo || null,
                    color_vehiculo: v.color || null,
                    foto_vehiculo: v.foto_vehiculo || null,
                    capacidad_vehiculo: capacidad,
                    asientos_ocupados: ocupados,
                    asientos_disponibles: disponibles,
                    vehiculo_lleno: disponibles !== null && disponibles <= 0,
                    rating_promedio: rating.promedio,
                    rating_total: rating.total,
                    horarios: horariosPorConductor[r.conductores?.id] || [],
                    sin_ruta: false
                };
            });

            const { data: todosConductores, error: condError } = await supabase
                .from('conductores')
                .select('id, nombre_completo, telefono_1, whatsapp, disponible, estado')
                .eq('disponible', 1)
                .eq('estado', 'activo');

            let conductoresFormateados = [];
            if (!condError && todosConductores) {
                const conductoresConRuta = new Set(conductorIds.map(String));
                const sinRuta = todosConductores.filter(c => !conductoresConRuta.has(String(c.id)));

                if (sinRuta.length > 0) {
                    const idsSinRuta = sinRuta.map(c => c.id);

                    const { data: vehiculosSinRuta } = await supabase
                        .from('vehiculos')
                        .select('conductor_id, placa, marca, modelo, color, capacidad, foto_vehiculo')
                        .in('conductor_id', idsSinRuta);

                    const vehiculoPorConductor = {};
                    (vehiculosSinRuta || []).forEach(v => { vehiculoPorConductor[v.conductor_id] = v; });

                    const { data: calificacionesSinRuta } = await supabase
                        .from('calificaciones')
                        .select('conductor_id, estrellas')
                        .in('conductor_id', idsSinRuta);

                    const ratingSinRuta = {};
                    (calificacionesSinRuta || []).forEach(c => {
                        if (!ratingSinRuta[c.conductor_id]) ratingSinRuta[c.conductor_id] = { suma: 0, total: 0 };
                        ratingSinRuta[c.conductor_id].suma += c.estrellas;
                        ratingSinRuta[c.conductor_id].total += 1;
                    });

                    conductoresFormateados = sinRuta.map(c => {
                        const v = vehiculoPorConductor[c.id] || {};
                        const r = ratingSinRuta[c.id];
                        return {
                            id: null,
                            conductor_id: c.id,
                            origen: null,
                            destino: null,
                            nombre_completo: c.nombre_completo,
                            telefono_1: c.telefono_1,
                            whatsapp: c.whatsapp || c.telefono_1,
                            placa: v.placa || null,
                            marca: v.marca || null,
                            modelo: v.modelo || null,
                            color_vehiculo: v.color || null,
                            foto_vehiculo: v.foto_vehiculo || null,
                            capacidad_vehiculo: v.capacidad ? parseInt(v.capacidad, 10) : null,
                            asientos_ocupados: 0,
                            asientos_disponibles: v.capacidad ? parseInt(v.capacidad, 10) : null,
                            vehiculo_lleno: false,
                            rating_promedio: r ? Math.round((r.suma / r.total) * 10) / 10 : 0,
                            rating_total: r ? r.total : 0,
                            horarios: [],
                            sin_ruta: true
                        };
                    });
                }
            }

            res.json({ success: true, data: [...rutasFormateadas, ...conductoresFormateados] });
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
