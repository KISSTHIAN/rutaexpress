const multer = require('multer');

// IMPORTANTE: en Vercel las funciones serverless tienen un sistema de
// archivos efímero y de solo lectura (salvo /tmp), por lo que guardar
// imágenes con multer.diskStorage() en una carpeta del proyecto NO
// persiste entre peticiones. Por eso usamos memoryStorage: el archivo
// queda disponible como buffer en req.file.buffer y desde ahí se sube
// a Supabase Storage (ver backend/utils/storage.js).
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo imágenes JPEG, PNG, GIF y WEBP'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

module.exports = upload;