
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

(async () => {
  try {
    console.log('🔄 Iniciando migración de contraseñas a Bcrypt...');
    
    const [docentes] = await pool.query('SELECT id, dni, nombre, password FROM docente');
    console.log(`📊 Total docentes encontrados: ${docentes.length}`);

    let updated = 0;
    let skipped = 0;

    for (const d of docentes) {
      const pwd = d.password;
      // Verificar si ya es un hash bcrypt válido (empieza con $2 y tiene 60 caracteres)
      const isHash = pwd && pwd.startsWith('$2') && pwd.length === 60;

      if (isHash) {
        skipped++;
        continue;
      }

      // Si no es hash, encriptarlo
      if (pwd) {
        const newHash = await bcrypt.hash(pwd, 10);
        await pool.query('UPDATE docente SET password = ? WHERE id = ?', [newHash, d.id]);
        console.log(`✅ Docente ${d.dni} (${d.nombre}): Contraseña encriptada.`);
        updated++;
      }
    }

    console.log('-----------------------------------');
    console.log(`🏁 Migración completada.`);
    console.log(`✨ Encriptados ahora: ${updated}`);
    console.log(`⏭️ Ya estaban encriptados: ${skipped}`);
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Error en migración:', e);
    process.exit(1);
  }
})();
