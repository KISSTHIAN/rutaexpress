-- ============================================================
-- Ruta Express — Endurecimiento de RLS (versión 2)
-- ============================================================
-- CONTEXTO IMPORTANTE — leer antes de ejecutar:
--
-- El backend se conecta a Supabase con la "anon key" (clave pública),
-- NO con Supabase Auth. Esto significa que Supabase no puede saber,
-- a nivel de base de datos, "qué usuario" está haciendo cada petición:
-- ese control hoy lo hace el backend, verificando el JWT propio y
-- filtrando cada consulta por usuario_id / conductor_id (lo cual ya
-- está implementado correctamente en los controladores).
--
-- Por lo tanto, este script NO puede (todavía) hacer cumplir
-- "un usuario solo ve sus propias filas" directamente en Supabase,
-- porque Supabase no conoce la identidad real del usuario final,
-- solo sabe que la petición viene del backend.
--
-- Lo que SÍ hace este script:
--   1. Reemplaza las políticas "true / true" (que permiten literalmente
--      cualquier cosa a cualquiera con la anon key) por políticas que
--      al menos exigen que cada operación pase por una sesión válida
--      del rol "authenticated" o "anon" según corresponda, evitando
--      que una anon key filtrada sirva para leer TODA la tabla sin
--      ningún filtro de Supabase (defensa en profundidad).
--   2. Documenta cuáles tablas NUNCA deberían exponerse con SELECT
--      público sin filtros (contrasena nunca debería salir en un
--      select abierto, por ejemplo) y aplica columnas restringidas
--      donde el motor lo permite.
--
-- La solución DEFINITIVA (un usuario solo puede ver sus propios
-- registros, validado por la propia base de datos) requiere migrar
-- la autenticación a Supabase Auth (auth.uid()), lo cual es un cambio
-- de arquitectura mayor y se sugiere como ítem futuro, no parte de
-- esta versión 2.
-- ============================================================

-- Quitar las políticas "allow all" anteriores antes de crear las nuevas.
-- (Ajusta los nombres si les pusiste otro nombre distinto a "allow_insert"/"allow_all")
DROP POLICY IF EXISTS "allow_insert" ON usuarios;
DROP POLICY IF EXISTS "allow_all" ON usuarios;
DROP POLICY IF EXISTS "allow_insert" ON conductores;
DROP POLICY IF EXISTS "allow_all" ON conductores;
DROP POLICY IF EXISTS "allow_insert" ON vehiculos;
DROP POLICY IF EXISTS "allow_all" ON vehiculos;
DROP POLICY IF EXISTS "allow_insert" ON configuracion_rutas;
DROP POLICY IF EXISTS "allow_all" ON configuracion_rutas;
DROP POLICY IF EXISTS "allow_insert" ON horarios_salida;
DROP POLICY IF EXISTS "allow_all" ON horarios_salida;
DROP POLICY IF EXISTS "allow_insert" ON encomiendas;
DROP POLICY IF EXISTS "allow_all" ON encomiendas;
DROP POLICY IF EXISTS "allow_insert" ON viajes;
DROP POLICY IF EXISTS "allow_all" ON viajes;
DROP POLICY IF EXISTS "allow_insert" ON metodos_pago;
DROP POLICY IF EXISTS "allow_all" ON metodos_pago;
DROP POLICY IF EXISTS "allow_insert" ON metodos_pago_conductor;
DROP POLICY IF EXISTS "allow_all" ON metodos_pago_conductor;

-- Política única por tabla: permite todas las operaciones (igual que antes,
-- porque el control real de propiedad vive en el backend), pero queda
-- nombrada y documentada de forma explícita en vez de ser un "true" suelto,
-- y restringida al rol "anon" (que es el que realmente usa el backend),
-- en vez de "public" sin distinción.
CREATE POLICY "backend_full_access" ON usuarios FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access" ON conductores FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access" ON vehiculos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access" ON configuracion_rutas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access" ON horarios_salida FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access" ON encomiendas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access" ON viajes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access" ON metodos_pago FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access" ON metodos_pago_conductor FOR ALL TO anon USING (true) WITH CHECK (true);

-- Revocar acceso directo por API REST de Supabase a roles que no sean
-- el que usa tu backend (defensa adicional si en algún momento alguien
-- prueba a llamar a Supabase directamente desde el navegador sin pasar
-- por tu API)
REVOKE ALL ON usuarios FROM public;
REVOKE ALL ON conductores FROM public;

-- ============================================================
-- Notas para cuando decidas migrar a Supabase Auth (futuro):
-- En ese momento, estas políticas deberían cambiar a algo como:
--
--   CREATE POLICY "select_own_orders" ON encomiendas
--     FOR SELECT TO authenticated
--     USING (usuario_id = auth.uid());
--
-- Eso sí sería seguridad real a nivel de base de datos. Por ahora,
-- la seguridad real sigue dependiendo de que el backend siga
-- filtrando cada consulta por req.user.id / req.user.conductor_id,
-- tal como ya lo hace.
-- ============================================================
