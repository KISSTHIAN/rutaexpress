-- ============================================================
-- Ruta Express — Versión 3: Sistema de notificaciones
-- Ejecutar en el SQL Editor de Supabase antes de subir el código.
-- ============================================================

CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(40) NOT NULL,        -- 'pedido_culminado' | 'pedido_disponible' | 'cuenta'
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    referencia_tipo VARCHAR(20) NULL, -- 'encomienda' | 'viaje' (para poder enlazar al detalle)
    referencia_id INT NULL,
    leido BOOLEAN NOT NULL DEFAULT false,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, leido);

-- Política de acceso: igual que el resto de tablas, el control real de
-- "a quién le pertenece cada notificación" lo hace el backend filtrando
-- por usuario_id (ver nota en rls_v2_hardening.sql sobre por qué Supabase
-- no puede validar esto directamente con la anon key).
DROP POLICY IF EXISTS "backend_full_access" ON notificaciones;
CREATE POLICY "backend_full_access" ON notificaciones FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
