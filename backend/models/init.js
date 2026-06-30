const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Inicializar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltan SUPABASE_URL o SUPABASE_ANON_KEY en las variables de entorno');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initializeDatabase() {
    console.log('🔄 Conectando a Supabase...');
    console.log('📊 URL:', supabaseUrl);
    
    // Verificar conexión
    const { data, error } = await supabase.from('usuarios').select('count', { count: 'exact', head: true });
    
    if (error) {
        console.error('❌ Error conectando a Supabase:', error.message);
        console.log('⚠️  Asegúrate de crear las tablas en Supabase primero');
    } else {
        console.log('✅ Conexión a Supabase exitosa');
    }
}

function getPool() {
    return supabase;
}

module.exports = { initializeDatabase, getPool, supabase };