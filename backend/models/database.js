const supabase = require('../config/supabase');

async function consultar(sql, params = []) {
    // Convertir SQL a Supabase (simplificado)
    // Para producción, necesitarás adaptar todas las consultas a Supabase
    console.log('Consulta:', sql, params);
    // Por ahora, mantener MySQL para desarrollo
    const mysql = require('./init');
    return mysql.consultar(sql, params);
}

async function ejecutar(sql, params = []) {
    const mysql = require('./init');
    return mysql.ejecutar(sql, params);
}

module.exports = { consultar, ejecutar, obtenerBaseDatos: async () => ({ consultar, ejecutar }) };