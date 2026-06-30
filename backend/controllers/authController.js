const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { supabase } = require('../models/init');

// Crea la fila de suscripción "pendiente" para una cuenta nueva.
// No bloquea el registro si falla (se auto-crea más tarde igual,
// ver middleware/subscription.js → obtenerOCrearSuscripcion).
async function crearSuscripcionPendiente(usuarioId) {
    try {
        await supabase.from('suscripciones').insert([{ usuario_id: usuarioId, estado: 'pendiente' }]);
    } catch (e) {
        console.error('⚠️ No se pudo crear la suscripción pendiente (no crítico):', e.message);
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'ruta_express_secret_key_2026';

function validarContrasena(contrasena) {
    const errores = [];
    if (contrasena.length < 8) errores.push('mínimo 8 caracteres');
    if (contrasena.length > 20) errores.push('máximo 20 caracteres');
    if (!/[A-Z]/.test(contrasena)) errores.push('una mayúscula');
    if (!/[0-9]/.test(contrasena)) errores.push('un número');
    if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(contrasena)) errores.push('un carácter especial');
    return errores;
}

class AuthController {
    
    static async registrarUsuario(req, res) {
        try {
            const nombre_usuario = req.body.username;
            const correo = req.body.email;
            const contrasena = req.body.password;

            console.log('📝 Registrando usuario:', { nombre_usuario, correo });

            if (!nombre_usuario || !correo || !contrasena) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Todos los campos son obligatorios' 
                });
            }

            const erroresContrasena = validarContrasena(contrasena);
            if (erroresContrasena.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `La contraseña debe tener: ${erroresContrasena.join(', ')}` 
                });
            }

            // Verificar si el usuario ya existe
            const { data: existente, error: findError } = await supabase
                .from('usuarios')
                .select('id')
                .or(`correo.eq.${correo},nombre_usuario.eq.${nombre_usuario}`);

            if (findError) {
                console.error('Error al buscar usuario:', findError);
                return res.status(500).json({ success: false, message: findError.message });
            }

            if (existente && existente.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'El correo o nombre de usuario ya está registrado' 
                });
            }

            const contrasenaHash = bcrypt.hashSync(contrasena, 10);

            // Insertar nuevo usuario
            const { data: nuevoUsuario, error: insertError } = await supabase
                .from('usuarios')
                .insert([
                    { 
                        nombre_usuario, 
                        correo, 
                        contrasena: contrasenaHash, 
                        rol: 'usuario',
                        estado: 'activo'
                    }
                ])
                .select();

            if (insertError) {
                console.error('Error al insertar usuario:', insertError);
                return res.status(500).json({ success: false, message: insertError.message });
            }

            const usuario = nuevoUsuario[0];

            await crearSuscripcionPendiente(usuario.id);

            const token = jwt.sign(
                { 
                    id: usuario.id, 
                    username: usuario.nombre_usuario, 
                    email: usuario.correo, 
                    role: 'user',
                    rol: usuario.rol 
                },
                JWT_SECRET, 
                { expiresIn: '24h' }
            );

            console.log('✅ Usuario registrado:', usuario.id);

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: { 
                    token, 
                    user: { 
                        id: usuario.id, 
                        username: usuario.nombre_usuario, 
                        email: usuario.correo, 
                        role: 'user' 
                    } 
                }
            });
        } catch (error) {
            console.error('❌ Error al registrar:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async registrarConductor(req, res) {
        try {
            const nombre_usuario = req.body.username;
            const correo = req.body.email;
            const contrasena = req.body.password;
            const nombre_completo = req.body.full_name;
            const edad = parseInt(req.body.age);
            const telefono_1 = req.body.phone1;
            const telefono_2 = req.body.phone2 || null;

            console.log('📝 Registrando conductor:', { nombre_usuario, correo, nombre_completo });

            if (!nombre_usuario || !correo || !contrasena || !nombre_completo || !edad || !telefono_1) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Faltan campos obligatorios' 
                });
            }

            const erroresContrasena = validarContrasena(contrasena);
            if (erroresContrasena.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `La contraseña debe tener: ${erroresContrasena.join(', ')}` 
                });
            }

            if (edad < 18) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'El conductor debe ser mayor de edad (18 años)' 
                });
            }

            // Verificar si el usuario ya existe
            const { data: existente, error: findError } = await supabase
                .from('usuarios')
                .select('id')
                .or(`correo.eq.${correo},nombre_usuario.eq.${nombre_usuario}`);

            if (existente && existente.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'El correo o nombre de usuario ya está registrado' 
                });
            }

            const contrasenaHash = bcrypt.hashSync(contrasena, 10);

            // Insertar usuario
            const { data: nuevoUsuario, error: insertUserError } = await supabase
                .from('usuarios')
                .insert([
                    { 
                        nombre_usuario, 
                        correo, 
                        contrasena: contrasenaHash, 
                        rol: 'conductor',
                        estado: 'activo'
                    }
                ])
                .select();

            if (insertUserError) {
                console.error('Error al insertar usuario:', insertUserError);
                return res.status(500).json({ success: false, message: insertUserError.message });
            }

            const usuario = nuevoUsuario[0];

            // Insertar conductor
            const { data: nuevoConductor, error: insertDriverError } = await supabase
                .from('conductores')
                .insert([
                    { 
                        usuario_id: usuario.id, 
                        nombre_completo, 
                        edad, 
                        telefono_1, 
                        telefono_2,
                        disponible: 0,
                        estado: 'activo'
                    }
                ])
                .select();

            if (insertDriverError) {
                console.error('Error al insertar conductor:', insertDriverError);
                return res.status(500).json({ success: false, message: insertDriverError.message });
            }

            const conductor = nuevoConductor[0];

            await crearSuscripcionPendiente(usuario.id);

            const token = jwt.sign(
                { 
                    id: usuario.id, 
                    username: usuario.nombre_usuario, 
                    email: usuario.correo, 
                    role: 'driver',
                    rol: 'conductor',
                    driverId: conductor.id,
                    conductor_id: conductor.id
                },
                JWT_SECRET, 
                { expiresIn: '24h' }
            );

            console.log('✅ Conductor registrado:', usuario.id);

            res.status(201).json({
                success: true,
                message: 'Conductor registrado exitosamente',
                data: { 
                    token, 
                    user: { 
                        id: usuario.id, 
                        username: usuario.nombre_usuario, 
                        email: usuario.correo, 
                        role: 'driver', 
                        driverId: conductor.id 
                    } 
                }
            });
        } catch (error) {
            console.error('❌ Error al registrar conductor:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async iniciarSesion(req, res) {
        try {
            const correo = req.body.email;
            const contrasena = req.body.password;

            console.log('🔑 Intento de login:', correo);

            if (!correo || !contrasena) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Correo y contraseña son obligatorios' 
                });
            }

            // Buscar usuario por correo
            const { data: usuarios, error: findError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('correo', correo);

            if (findError) {
                console.error('Error al buscar usuario:', findError);
                return res.status(500).json({ success: false, message: findError.message });
            }

            if (!usuarios || usuarios.length === 0) {
                console.log('❌ Usuario no encontrado');
                return res.status(401).json({ 
                    success: false, 
                    message: 'Credenciales inválidas' 
                });
            }

            const usuario = usuarios[0];
            console.log('👤 Usuario encontrado:', usuario.nombre_usuario, 'Rol:', usuario.rol);

            if (usuario.estado !== 'activo') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Cuenta desactivada. Contacte al administrador' 
                });
            }

            const contrasenaValida = bcrypt.compareSync(contrasena, usuario.contrasena);
            console.log('🔐 Contraseña válida:', contrasenaValida);
            
            if (!contrasenaValida) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Credenciales inválidas' 
                });
            }

            const payloadToken = {
                id: usuario.id,
                username: usuario.nombre_usuario,
                email: usuario.correo,
                role: usuario.rol === 'conductor' ? 'driver' : 'user',
                rol: usuario.rol,
                nombre_usuario: usuario.nombre_usuario,
                correo: usuario.correo
            };

            // Si es conductor, obtener su ID
            if (usuario.rol === 'conductor') {
                const { data: conductores, error: driverError } = await supabase
                    .from('conductores')
                    .select('id')
                    .eq('usuario_id', usuario.id);

                if (!driverError && conductores && conductores.length > 0) {
                    payloadToken.driverId = conductores[0].id;
                    payloadToken.conductor_id = conductores[0].id;
                }
            }

            const token = jwt.sign(payloadToken, JWT_SECRET, { expiresIn: '24h' });

            console.log('✅ Login exitoso');

            res.json({
                success: true,
                message: 'Inicio de sesión exitoso',
                data: {
                    token,
                    user: {
                        id: usuario.id,
                        username: usuario.nombre_usuario,
                        email: usuario.correo,
                        role: usuario.rol === 'conductor' ? 'driver' : 'user',
                        driverId: payloadToken.driverId || null
                    }
                }
            });
        } catch (error) {
            console.error('❌ Error en login:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async obtenerPerfil(req, res) {
        try {
            const { data: usuarios, error: findError } = await supabase
                .from('usuarios')
                .select('id, nombre_usuario, correo, rol, tema, fecha_creacion')
                .eq('id', req.user.id);

            if (findError) {
                return res.status(500).json({ success: false, message: findError.message });
            }

            if (!usuarios || usuarios.length === 0) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            const respuesta = { 
                id: usuarios[0].id,
                username: usuarios[0].nombre_usuario,
                email: usuarios[0].correo,
                role: usuarios[0].rol === 'conductor' ? 'driver' : 'user',
                ...usuarios[0]
            };

            if (respuesta.rol === 'conductor') {
                const { data: conductores, error: driverError } = await supabase
                    .from('conductores')
                    .select('*')
                    .eq('usuario_id', req.user.id);

                if (!driverError && conductores && conductores.length > 0) {
                    respuesta.driver = conductores[0];
                }
            }

            res.json({ success: true, data: respuesta });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async actualizarPerfil(req, res) {
        try {
            const updates = {};
            if (req.body.username) updates.nombre_usuario = req.body.username;
            if (req.body.email) updates.correo = req.body.email;

            const { error: updateError } = await supabase
                .from('usuarios')
                .update(updates)
                .eq('id', req.user.id);

            if (updateError) {
                return res.status(500).json({ success: false, message: updateError.message });
            }

            res.json({ success: true, message: 'Perfil actualizado exitosamente' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async loginConGoogle(req, res) {
        try {
            const { credential, role = 'user' } = req.body;

            if (!credential) {
                return res.status(400).json({ success: false, message: 'Token de Google requerido' });
            }

            // Verificar el token con Google
            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            const correo = payload.email;
            const nombre_usuario = payload.name.replace(/\s+/g, '_').toLowerCase();

            // Buscar si el usuario ya existe
            const { data: existente, error: findError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('correo', correo);

            if (findError) {
                console.error('Error al buscar usuario:', findError);
                return res.status(500).json({ success: false, message: findError.message });
            }

            let usuario;

            if (existente && existente.length > 0) {
                usuario = existente[0];
                console.log('👤 Usuario existente:', usuario.nombre_usuario);
            } else {
                // Crear nuevo usuario con Google
                const { data: nuevo, error: insertError } = await supabase
                    .from('usuarios')
                    .insert([{ 
                        nombre_usuario, 
                        correo, 
                        contrasena: '', 
                        rol: role === 'driver' ? 'conductor' : 'usuario', 
                        estado: 'activo' 
                    }])
                    .select();

                if (insertError) {
                    console.error('Error al insertar usuario:', insertError);
                    return res.status(500).json({ success: false, message: insertError.message });
                }
                
                usuario = nuevo[0];
                console.log('✅ Nuevo usuario creado con Google:', usuario.nombre_usuario);

                await crearSuscripcionPendiente(usuario.id);

                // Si es conductor, crear el registro correspondiente
                if (role === 'driver') {
                    const { error: driverInsertError } = await supabase
                        .from('conductores')
                        .insert([{ 
                            usuario_id: usuario.id,
                            nombre_completo: payload.name,
                            edad: 18, // Edad por defecto
                            telefono_1: '',
                            telefono_2: '',
                            disponible: 0,
                            estado: 'activo'
                        }]);

                    if (driverInsertError) {
                        console.error('Error al insertar conductor:', driverInsertError);
                        // No fallamos el registro, solo logueamos el error
                    }
                }
            }

            // Verificar estado del usuario
            if (usuario.estado !== 'activo') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Cuenta desactivada. Contacte al administrador' 
                });
            }

            const payloadToken = {
                id: usuario.id,
                username: usuario.nombre_usuario,
                email: usuario.correo,
                role: usuario.rol === 'conductor' ? 'driver' : 'user',
                rol: usuario.rol,
                nombre_usuario: usuario.nombre_usuario,
                correo: usuario.correo
            };

            // Si es conductor, obtener su ID
            if (usuario.rol === 'conductor') {
                const { data: conductores, error: driverError } = await supabase
                    .from('conductores')
                    .select('id')
                    .eq('usuario_id', usuario.id);

                if (!driverError && conductores && conductores.length > 0) {
                    payloadToken.driverId = conductores[0].id;
                    payloadToken.conductor_id = conductores[0].id;
                }
            }

            const token = jwt.sign(payloadToken, JWT_SECRET, { expiresIn: '24h' });

            console.log('✅ Login con Google exitoso para:', usuario.nombre_usuario);

            res.json({ 
                success: true, 
                message: 'Inicio de sesión con Google exitoso',
                data: { 
                    token, 
                    user: { 
                        id: usuario.id, 
                        username: usuario.nombre_usuario, 
                        email: usuario.correo, 
                        role: usuario.rol === 'conductor' ? 'driver' : 'user',
                        driverId: payloadToken.driverId || null
                    } 
                } 
            });

        } catch (error) {
            console.error('❌ Error en Google Sign-In:', error);
            if (error.message.includes('audience')) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Configuración de Google inválida. Verifica GOOGLE_CLIENT_ID.' 
                });
            }
            res.status(401).json({ 
                success: false, 
                message: 'Token de Google inválido o expirado' 
            });
        }
    }

    // ============ AJUSTES ============

    static async actualizarTema(req, res) {
        try {
            const { theme } = req.body;
            if (theme !== 'claro' && theme !== 'oscuro') {
                return res.status(400).json({ success: false, message: 'Tema inválido' });
            }

            const { error } = await supabase
                .from('usuarios')
                .update({ tema: theme })
                .eq('id', req.user.id);

            if (error) {
                return res.status(500).json({ success: false, message: error.message });
            }

            res.json({ success: true, message: 'Tema actualizado' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async eliminarCuenta(req, res) {
        try {
            const { password } = req.body;

            const { data: usuarios, error: findError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', req.user.id)
                .single();

            if (findError || !usuarios) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            // Si la cuenta tiene contraseña propia (no es solo de Google), exigir confirmación
            if (usuarios.contrasena) {
                if (!password) {
                    return res.status(400).json({ success: false, message: 'Debes ingresar tu contraseña para eliminar la cuenta' });
                }
                const valida = bcrypt.compareSync(password, usuarios.contrasena);
                if (!valida) {
                    return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
                }
            }

            // Borrado lógico: se preserva el historial de pedidos ya culminados,
            // pero la cuenta queda inutilizable y se anonimiza el correo/usuario
            // para permitir que la persona pueda registrarse de nuevo con el mismo correo.
            const correoAnonimizado = `eliminado_${usuarios.id}_${Date.now()}@rutaexpress.pe`;

            const { error: updateError } = await supabase
                .from('usuarios')
                .update({
                    estado: 'eliminado',
                    correo: correoAnonimizado,
                    nombre_usuario: `eliminado_${usuarios.id}`,
                    contrasena: ''
                })
                .eq('id', req.user.id);

            if (updateError) {
                return res.status(500).json({ success: false, message: updateError.message });
            }

            // Si es conductor, marcar también su registro como inactivo y no disponible
            if (usuarios.rol === 'conductor') {
                await supabase
                    .from('conductores')
                    .update({ estado: 'inactivo', disponible: 0 })
                    .eq('usuario_id', usuarios.id);
            }

            res.json({ success: true, message: 'Tu cuenta ha sido eliminada' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = AuthController;
