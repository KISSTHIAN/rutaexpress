const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../models/init');

/**
 * Sube un archivo (recibido en memoria vía multer.memoryStorage) a un
 * bucket de Supabase Storage y devuelve su URL pública.
 *
 * Requisito en Supabase: crear los buckets como "Public" desde
 * Storage → New bucket, con los nombres usados en cada llamada
 * (por ejemplo: "vehiculos", "encomiendas").
 *
 * @param {Express.Multer.File} file - req.file entregado por multer
 * @param {string} bucket - nombre del bucket en Supabase Storage
 * @param {string} folder - subcarpeta dentro del bucket (opcional)
 * @returns {Promise<string|null>} URL pública del archivo subido
 */
async function subirImagen(file, bucket, folder = '') {
    if (!file) return null;

    const extension = file.originalname.split('.').pop();
    const nombreArchivo = `${folder ? folder + '/' : ''}${uuidv4()}.${extension}`;

    const { error } = await supabase.storage
        .from(bucket)
        .upload(nombreArchivo, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });

    if (error) {
        console.error(`❌ Error al subir imagen a Supabase Storage (${bucket}):`, error.message);
        throw new Error('No se pudo subir la imagen: ' + error.message);
    }

    const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(nombreArchivo);

    return publicUrlData.publicUrl;
}

module.exports = { subirImagen };
