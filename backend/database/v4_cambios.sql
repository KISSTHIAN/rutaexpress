-- ============================================================
-- RUTA EXPRESS — Versión 4
-- Ejecutar TODO este archivo de una sola vez en Supabase → SQL Editor.
-- Es seguro volver a ejecutarlo: todo usa IF NOT EXISTS / OR REPLACE.
-- ============================================================

-- ------------------------------------------------------------
-- 1. SUSCRIPCIONES (S/25 mensual, simulada por ahora)
-- ------------------------------------------------------------
-- Cada usuario (cliente o conductor) tiene una sola fila aquí.
-- estado: 'pendiente' (recién creada cuenta, nunca pagó),
--         'activa' (pagó y está dentro de los 30 días),
--         'vencida' (pasó la fecha de vencimiento sin renovar).
CREATE TABLE IF NOT EXISTS suscripciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    estado VARCHAR(15) NOT NULL DEFAULT 'pendiente',
    precio NUMERIC(10,2) NOT NULL DEFAULT 25.00,
    fecha_inicio TIMESTAMP NULL,
    fecha_vencimiento TIMESTAMP NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historial de pagos de suscripción (simulados por ahora; cuando se
-- conecte una pasarela real, aquí se guardará el id de la transacción).
CREATE TABLE IF NOT EXISTS pagos_suscripcion (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    monto NUMERIC(10,2) NOT NULL,
    metodo VARCHAR(20) NOT NULL DEFAULT 'simulado',
    referencia_externa VARCHAR(100) NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. UBICACIÓN EXACTA (Google Maps) en encomiendas y viajes
-- ------------------------------------------------------------
ALTER TABLE encomiendas ADD COLUMN IF NOT EXISTS origen_lat NUMERIC(10,7) NULL;
ALTER TABLE encomiendas ADD COLUMN IF NOT EXISTS origen_lng NUMERIC(10,7) NULL;
ALTER TABLE encomiendas ADD COLUMN IF NOT EXISTS destino_lat NUMERIC(10,7) NULL;
ALTER TABLE encomiendas ADD COLUMN IF NOT EXISTS destino_lng NUMERIC(10,7) NULL;

ALTER TABLE viajes ADD COLUMN IF NOT EXISTS origen_lat NUMERIC(10,7) NULL;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS origen_lng NUMERIC(10,7) NULL;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS destino_lat NUMERIC(10,7) NULL;
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS destino_lng NUMERIC(10,7) NULL;

-- ------------------------------------------------------------
-- 3. WHATSAPP DEL CONDUCTOR
-- ------------------------------------------------------------
-- telefono_1 ya existe y se usa como número de contacto; agregamos
-- una columna específica para el número de WhatsApp por si el
-- conductor quiere usar uno distinto al de llamadas. Si la deja
-- vacía, el sistema usa telefono_1 automáticamente.
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20) NULL;

-- ------------------------------------------------------------
-- 4. VEHÍCULO LLENO (cupo de pasajeros por viaje)
-- ------------------------------------------------------------
-- Cuántos asientos pidió cada viaje ya existe (cantidad_pasajeros).
-- Lo que falta es poder saber, para una ruta, cuántos asientos están
-- ocupados AHORA por viajes en_proceso, y compararlo contra la
-- capacidad del vehículo. Eso se calcula en el backend en tiempo real
-- (no se duplica en una columna para evitar inconsistencias), así que
-- no se requiere columna nueva aquí — solo se documenta el criterio:
--
--   asientos_ocupados(ruta_config_id) =
--       SUM(cantidad_pasajeros) de viajes
--       WHERE ruta_config_id = X AND estado = 'en_proceso'
--
--   capacidad_total = vehiculos.capacidad del conductor de esa ruta
--
--   disponible_para_viajes = capacidad_total - asientos_ocupados > 0

-- ------------------------------------------------------------
-- 5. CALIFICACIONES / RESEÑAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calificaciones (
    id SERIAL PRIMARY KEY,
    conductor_id INT NOT NULL REFERENCES conductores(id) ON DELETE CASCADE,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_pedido VARCHAR(15) NOT NULL,      -- 'encomienda' | 'viaje'
    pedido_id INT NOT NULL,
    estrellas SMALLINT NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
    comentario VARCHAR(500) NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Un mismo pedido solo puede calificarse una vez
    UNIQUE (tipo_pedido, pedido_id)
);

CREATE INDEX IF NOT EXISTS idx_calificaciones_conductor ON calificaciones(conductor_id);

-- ------------------------------------------------------------
-- 6. ELIMINAR MÉTODOS DE PAGO (Yape/Plin) — ya no se usan
-- ------------------------------------------------------------
-- Se conservan las tablas por si tienes datos históricos que quieras
-- consultar más adelante, pero el backend y el frontend de la v4 ya
-- no las usan en ningún flujo. Si quieres borrarlas físicamente,
-- puedes ejecutar (opcional, irreversible):
--
--   DROP TABLE IF EXISTS metodos_pago;
--   DROP TABLE IF EXISTS metodos_pago_conductor;

-- ------------------------------------------------------------
-- 7. Inicializar una suscripción "pendiente" para cuentas que ya
--    existían antes de esta versión (para que no queden huérfanas).
-- ------------------------------------------------------------
INSERT INTO suscripciones (usuario_id, estado)
SELECT id, 'pendiente' FROM usuarios
WHERE id NOT IN (SELECT usuario_id FROM suscripciones)
  AND estado = 'activo';

-- ============================================================
-- FIN. Recuerda también (fuera de SQL):
--   1. Crear/restringir tu API key de Google Maps (ver INSTRUCCIONES_V4.md)
--   2. Revisar que cada conductor cargue su número de WhatsApp en
--      "Mis Datos" (o agregarlo manualmente vía Supabase Table editor
--      para tus conductores de prueba) antes de probar el botón de
--      WhatsApp en el flujo de encomienda/viaje.
-- ============================================================
