-- Tabla de métodos de pago para conductores
CREATE TABLE IF NOT EXISTS metodos_pago_conductor (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conductor_id INT NOT NULL,
    tipo_billetera ENUM('yape', 'plin') NOT NULL,
    numero_billetera VARCHAR(15) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conductor_id) REFERENCES conductores(id) ON DELETE CASCADE
);

-- Asegurar que tabla metodos_pago exista para usuarios (opcional)
CREATE TABLE IF NOT EXISTS metodos_pago (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'billetera',
    tipo_billetera ENUM('yape', 'plin') NOT NULL,
    numero_billetera VARCHAR(15) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Agregar columna google_id a usuarios si no existe
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_id VARCHAR(100) NULL;

-- ============================================================
-- Mejoras v2: emparejamiento de pedidos, foto de vehículo,
-- tema de pantalla y eliminación de cuenta.
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- Asegurar que encomiendas y viajes puedan referenciar la ruta
-- configurada por el conductor (para el emparejamiento automático)
ALTER TABLE encomiendas ADD COLUMN IF NOT EXISTS ruta_config_id INT NULL REFERENCES configuracion_rutas(id);
ALTER TABLE viajes ADD COLUMN IF NOT EXISTS ruta_config_id INT NULL REFERENCES configuracion_rutas(id);

-- Foto del vehículo (guarda la URL pública del archivo en Supabase Storage)
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS foto_vehiculo VARCHAR(500) NULL;

-- Preferencia de tema de pantalla del usuario (claro/oscuro)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tema VARCHAR(10) DEFAULT 'claro';

-- Nota sobre "eliminar cuenta": en vez de borrar el registro físicamente,
-- se reutiliza la columna "estado" ya existente en usuarios y conductores,
-- marcándola como 'eliminado'. Esto preserva el historial de pedidos
-- (encomiendas/viajes) que referencian ese usuario_id/conductor_id.

-- ============================================================
-- IMPORTANTE — Supabase Storage (fuera de SQL, hacerlo desde el panel):
-- Vercel no permite guardar archivos en disco de forma persistente,
-- así que las fotos (vehículo, encomienda) ahora se suben a Supabase
-- Storage. Antes de usar esa función debes crear los buckets:
--
--   1. Ve a tu proyecto Supabase → Storage → "New bucket"
--   2. Crea un bucket llamado "vehiculos" → marca "Public bucket"
--   3. Crea un bucket llamado "encomiendas" → marca "Public bucket"
--
-- Sin estos buckets, subir una foto de vehículo o de encomienda
-- devolverá un error 500 ("Bucket not found").
-- ============================================================