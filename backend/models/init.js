const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Inicializar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltan SUPABASE_URL o SUPABASE_ANON_KEY en las variables de entorno');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para adaptar consultas SQL a Supabase
async function consultar(sql, params = []) {
    // Extraer nombre de tabla de la consulta SQL (simple)
    let tableName = '';
    if (sql.toLowerCase().includes('from usuarios')) tableName = 'usuarios';
    else if (sql.toLowerCase().includes('from conductores')) tableName = 'conductores';
    else if (sql.toLowerCase().includes('from encomiendas')) tableName = 'encomiendas';
    else if (sql.toLowerCase().includes('from viajes')) tableName = 'viajes';
    else if (sql.toLowerCase().includes('from configuracion_rutas')) tableName = 'configuracion_rutas';
    else if (sql.toLowerCase().includes('from vehiculos')) tableName = 'vehiculos';
    else if (sql.toLowerCase().includes('from horarios_salida')) tableName = 'horarios_salida';
    else if (sql.toLowerCase().includes('from metodos_pago')) tableName = 'metodos_pago';
    else if (sql.toLowerCase().includes('from metodos_pago_conductor')) tableName = 'metodos_pago_conductor';
    else {
        console.log('Tabla no mapeada:', sql);
        return [];
    }

    // Hacer select a Supabase
    let query = supabase.from(tableName).select('*');
    
    // Manejar WHERE (muy básico)
    const whereMatch = sql.match(/WHERE (.+)/i);
    if (whereMatch && !sql.toLowerCase().includes('information_schema')) {
        // Advertencia: Esto es simplificado, necesitarás adaptar según tu consulta
        console.log('Consulta con WHERE:', sql);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error en consulta Supabase:', error);
        return [];
    }
    
    return data || [];
}

async function ejecutar(sql, params = []) {
    // Para INSERT, UPDATE, DELETE
    let tableName = '';
    let operation = '';
    
    if (sql.toLowerCase().startsWith('insert into usuarios')) {
        tableName = 'usuarios';
        operation = 'insert';
    } else if (sql.toLowerCase().startsWith('insert into conductores')) {
        tableName = 'conductores';
        operation = 'insert';
    } else if (sql.toLowerCase().startsWith('insert into encomiendas')) {
        tableName = 'encomiendas';
        operation = 'insert';
    } else if (sql.toLowerCase().startsWith('insert into viajes')) {
        tableName = 'viajes';
        operation = 'insert';
    } else if (sql.toLowerCase().startsWith('insert into configuracion_rutas')) {
        tableName = 'configuracion_rutas';
        operation = 'insert';
    } else if (sql.toLowerCase().startsWith('insert into vehiculos')) {
        tableName = 'vehiculos';
        operation = 'insert';
    } else if (sql.toLowerCase().startsWith('insert into horarios_salida')) {
        tableName = 'horarios_salida';
        operation = 'insert';
    } else if (sql.toLowerCase().startsWith('update ')) {
        operation = 'update';
        console.log('UPDATE no implementado directamente:', sql);
        return { insertId: 0 };
    } else if (sql.toLowerCase().startsWith('delete ')) {
        operation = 'delete';
        console.log('DELETE no implementado directamente:', sql);
        return { insertId: 0 };
    } else {
        console.log('Operación no implementada:', sql);
        return { insertId: 0 };
    }
    
    if (operation === 'insert') {
        const { data, error } = await supabase
            .from(tableName)
            .insert({})
            .select();
        
        if (error) {
            console.error('Error insert en Supabase:', error);
            return { insertId: 0 };
        }
        
        return { insertId: data?.[0]?.id || 1 };
    }
    
    return { insertId: 0 };
}

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

module.exports = { initializeDatabase, getPool, consultar, ejecutar, supabase };