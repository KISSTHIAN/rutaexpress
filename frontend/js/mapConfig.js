// ============================================================
// CONFIGURACIÓN DE GOOGLE MAPS
// ============================================================
// Reemplaza el texto de abajo por tu propia API key de Google Maps.
//
// Pasos en Google Cloud Console (console.cloud.google.com):
//   1. Crea un proyecto (o usa uno existente).
//   2. Ve a "APIs & Services" → "Library" y activa:
//        - Maps JavaScript API
//        - Places API
//   3. Ve a "APIs & Services" → "Credentials" → "Create credentials" → "API key".
//   4. MUY IMPORTANTE — restringe la key para que nadie más pueda usarla
//      con tu cuenta de facturación:
//        - "Application restrictions" → "Websites" → agrega tu(s) dominio(s),
//          por ejemplo: tudominio.com/* y *.vercel.app/* mientras pruebas.
//        - "API restrictions" → selecciona solo "Maps JavaScript API" y "Places API".
//   5. Pega la key abajo, entre las comillas.
//
// Esta key es pública por diseño (se usa en el navegador del cliente);
// la seguridad real viene de las restricciones de dominio del paso 4,
// no de mantenerla en secreto.
// ============================================================

window.GOOGLE_MAPS_API_KEY = 'TU_API_KEY_DE_GOOGLE_MAPS_AQUI';
