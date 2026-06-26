# Ruta Express — Instrucciones para desplegar la versión 2

Esta versión agrega 6 mejoras al proyecto. Antes de subir el código a GitHub,
hay 3 pasos manuales que debes hacer en Supabase. Si los saltas, el código
nuevo dará error 500 en las funciones que dependen de ellos.

## 1. Ejecutar el SQL de columnas nuevas

Ve a Supabase → tu proyecto → **SQL Editor** → pega y ejecuta el contenido de:

```
backend/database/fix_tables.sql
```

Esto agrega las columnas que faltaban:
- `encomiendas.ruta_config_id` y `viajes.ruta_config_id` (para que el usuario
  pueda elegir una ruta/conductor disponible al crear un pedido)
- `vehiculos.foto_vehiculo` (para guardar la foto del vehículo)
- `usuarios.tema` (para guardar si el usuario prefiere modo claro u oscuro)

Es seguro ejecutarlo aunque ya hayas corrido este archivo antes: usa
`ADD COLUMN IF NOT EXISTS`, así que no falla si la columna ya existe.

## 2. Crear los buckets de Supabase Storage (para fotos)

Vercel no permite guardar archivos en disco de forma permanente, así que las
fotos del vehículo ahora se guardan en Supabase Storage en vez de en una
carpeta del proyecto.

Ve a Supabase → tu proyecto → **Storage** → **New bucket**:

1. Crea un bucket llamado exactamente `vehiculos` → marca la opción **Public bucket**
2. Crea un bucket llamado exactamente `encomiendas` → marca la opción **Public bucket**

Si no marcas "Public bucket", las fotos se subirán pero no se podrán ver
desde la aplicación (la URL pública no funcionará).

## 3. (Opcional, recomendado) Aplicar el endurecimiento de RLS

Este paso es opcional pero recomendado. Ve a Supabase → **SQL Editor** → pega
y ejecuta:

```
backend/database/rls_v2_hardening.sql
```

Lee los comentarios al inicio del archivo: explica honestamente qué sí
mejora (organiza y documenta las políticas, restringe el acceso al rol
"anon" en vez de "public" sin restricción) y qué NO puede resolver todavía
(seguridad real por usuario a nivel de base de datos, que requeriría migrar
a Supabase Auth — eso queda fuera de esta versión 2).

## 4. Subir el código

Reemplaza en tu repositorio de GitHub los archivos que están dentro de este
ZIP (mantén la misma estructura de carpetas `backend/` y `frontend/`). Los
archivos nuevos o modificados son:

**Backend:**
- `controllers/authController.js` — eliminar cuenta, guardar tema
- `controllers/orderController.js` — emparejamiento con rutas, fotos vía Storage
- `controllers/routeConfigController.js` — rutas disponibles ahora incluyen horarios
- `routes/auth.js` — rutas nuevas: `PUT /theme`, `DELETE /account`
- `routes/drivers.js` — subida de foto de vehículo, validación de propiedad
- `middleware/upload.js` — cambiado a memoria (compatible con Vercel)
- `utils/storage.js` — **archivo nuevo**, sube imágenes a Supabase Storage
- `server.js` — ya no sirve `/uploads` (innecesario ahora)
- `database/fix_tables.sql` — columnas nuevas (ver paso 1)
- `database/rls_v2_hardening.sql` — **archivo nuevo** (ver paso 3)

**Frontend:**
- `js/utils.js` — `TimePicker`, `formatTime12h`, tema claro/oscuro, sidebar móvil
- `js/userPanel.js` — selector de rutas/horarios al pedir, sección de Ajustes
- `js/driverPanel.js` — selector de hora 12h, foto de vehículo, sección de Ajustes
- `css/style.css` — variables de tema oscuro, responsive completo, nuevos componentes

Después de subir, espera el redeploy automático de Vercel (o dispáralo
manualmente desde Deployments si no ocurre solo) y prueba:

1. Crear una encomienda/viaje y verificar que aparezcan las rutas/conductores disponibles
2. Agregar un horario o crear un viaje manual con el selector de hora 12h
3. Entrar a Ajustes y cambiar el tema claro/oscuro
4. Como conductor, subir una foto al registrar/editar un vehículo
5. Abrir la aplicación desde el celular y verificar que el menú aparece como botón ☰
6. (Con mucho cuidado, en una cuenta de prueba) probar "Eliminar cuenta"
