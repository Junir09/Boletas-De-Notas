const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const app = express();
app.use(cors({ origin: '*'}));
app.use(express.json());

// Test de conexión al inicio
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conexión a BD exitosa');
    conn.release();
  } catch (e) {
    console.error('❌ Error fatal al conectar a BD:', e);
  }
})();

// Servir archivos estáticos del frontend (React)
app.use(express.static(path.join(__dirname, '../build')));

async function initDB() {
  try {
    console.log('🔄 Iniciando verificación de base de datos...');

    // 1. Tablas base (sin dependencias)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grados (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(50) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_grados_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS secciones (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(10) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_secciones_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cursos (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(120) NOT NULL,
        descripcion VARCHAR(255) NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_cursos_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS docente (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        dni VARCHAR(20) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        descripcion VARCHAR(255) NULL,
        password VARCHAR(255) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_docente_dni (dni)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 2. Tablas con dependencias simples
    await pool.query(`
      CREATE TABLE IF NOT EXISTS estudiantes (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        dni VARCHAR(20) NOT NULL,
        apellidos VARCHAR(150) NOT NULL,
        nombres VARCHAR(150) NOT NULL,
        grado TINYINT UNSIGNED NULL,
        seccion VARCHAR(10) NULL,
        grado_id INT UNSIGNED NULL,
        seccion_id INT UNSIGNED NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_estudiantes_dni (dni),
        KEY idx_estudiantes_grado_id (grado_id),
        KEY idx_estudiantes_seccion_id (seccion_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS docente_curso (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        dni VARCHAR(20) NOT NULL,
        curso_id INT UNSIGNED NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_docente_curso (dni, curso_id),
        KEY idx_docente_curso_dni (dni),
        KEY idx_docente_curso_curso (curso_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS curso_grado (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        curso_id INT UNSIGNED NOT NULL,
        grado_id INT UNSIGNED NOT NULL,
        seccion_id INT UNSIGNED NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_curso_grado_seccion (curso_id, grado_id, seccion_id),
        KEY idx_curso_grado_curso (curso_id),
        KEY idx_curso_grado_grado (grado_id),
        KEY idx_curso_grado_seccion (seccion_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 3. Tablas de actividades y notas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS curso_actividad (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        curso_id INT UNSIGNED NOT NULL,
        grado_id INT UNSIGNED NOT NULL,
        seccion_id INT UNSIGNED NULL,
        nombre VARCHAR(120) NOT NULL,
        orden INT UNSIGNED NOT NULL DEFAULT 1,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_ca_curso (curso_id),
        KEY idx_ca_grado (grado_id),
        KEY idx_ca_seccion (seccion_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS actividad_nota (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        actividad_id INT UNSIGNED NOT NULL,
        estudiante_dni VARCHAR(20) NOT NULL,
        nota DECIMAL(5,2) NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_act_est (actividad_id, estudiante_dni),
        KEY idx_an_actividad (actividad_id),
        KEY idx_an_estudiante (estudiante_dni)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS promedio_detalle (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        promedio_id INT UNSIGNED NOT NULL,
        actividad_id INT UNSIGNED NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_promedio_detalle (promedio_id, actividad_id),
        KEY idx_promedio_detalle_promedio (promedio_id),
        KEY idx_promedio_detalle_actividad (actividad_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS nota_historial (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        nota_id INT UNSIGNED NOT NULL,
        valor_anterior DECIMAL(5,2) NULL,
        valor_nuevo DECIMAL(5,2) NULL,
        fecha TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_nh_nota (nota_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 4. Datos iniciales básicos (si están vacíos)
    const [grados] = await pool.query('SELECT COUNT(*) AS cnt FROM grados');
    if ((grados[0] && grados[0].cnt) === 0) {
      await pool.query('INSERT INTO grados (nombre) VALUES ("1°"), ("2°"), ("3°"), ("4°"), ("5°"), ("6°")');
      console.log('✅ Grados insertados');
    }
    const [secciones] = await pool.query('SELECT COUNT(*) AS cnt FROM secciones');
    if ((secciones[0] && secciones[0].cnt) === 0) {
      await pool.query('INSERT INTO secciones (nombre) VALUES ("A"), ("B"), ("C")');
      console.log('✅ Secciones insertadas');
    }

    console.log('✅ Estructura de base de datos verificada/creada correctamente');

  } catch (e) {
    console.error('❌ Error fatal inicializando base de datos:', e);
  }
}

initDB();

// Healthcheck API (movido de raíz)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, name: 'Boletas API', version: '1.0.0' });
});

// Servir frontend para cualquier ruta no manejada por API
app.get(/(.*)/, (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Docentes
app.get('/api/docentes', async (req, res) => {
  try {
    const sql = 'SELECT d.dni, d.nombre, d.descripcion, x.cursos FROM docente d LEFT JOIN (SELECT dc.dni, GROUP_CONCAT(c.nombre ORDER BY c.nombre SEPARATOR ", ") AS cursos FROM docente_curso dc JOIN cursos c ON c.id = dc.curso_id GROUP BY dc.dni) x ON x.dni COLLATE utf8mb4_unicode_ci = d.dni COLLATE utf8mb4_unicode_ci ORDER BY d.nombre';
    const [rows] = await pool.query(sql);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});



app.get('/api/docentes/:dni', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  if (!dni) return res.status(400).json({ ok: false, error: 'Falta dni' });
  try {
    const [rows] = await pool.query('SELECT dni, nombre FROM docente WHERE dni = ? LIMIT 1', [dni]);
    if (!rows || rows.length === 0) return res.status(404).json({ ok: false, error: 'Docente no encontrado' });
    res.json({ ok: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Cursos por docente con conteo de alumnos
app.get('/api/docentes/:dni/cursos', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  if (!dni) return res.status(400).json({ ok: false, error: 'Falta dni' });
  try {
    try { await pool.query("SET collation_connection = 'utf8mb4_unicode_ci'"); } catch (_) {}
    const sql = `
      SELECT c.id, c.nombre, c.descripcion,
             COALESCE(cnt.alumnos, 0) AS alumnos
      FROM docente_curso dc
      JOIN cursos c ON c.id = dc.curso_id
      LEFT JOIN (
        SELECT cg.curso_id, COUNT(DISTINCT e.dni) AS alumnos
        FROM curso_grado cg
        LEFT JOIN estudiantes e
          ON e.grado_id = cg.grado_id AND (cg.seccion_id IS NULL OR e.seccion_id = cg.seccion_id)
        GROUP BY cg.curso_id
      ) AS cnt ON cnt.curso_id = c.id
      WHERE CAST(dc.dni AS UNSIGNED) = CAST(? AS UNSIGNED)
      GROUP BY c.id, c.nombre, c.descripcion, cnt.alumnos
      ORDER BY c.nombre`;
    const [rows] = await pool.query(sql, [dni]);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/docentes/:dni/cursos/asignaciones', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  if (!dni) return res.status(400).json({ ok: false, error: 'Falta dni' });
  try {
    try { await pool.query("SET collation_connection = 'utf8mb4_unicode_ci'"); } catch (_) {}
    const sql = `
      SELECT c.id AS curso_id, c.nombre AS curso,
             g.id AS grado_id, g.nombre AS grado,
             s.id AS seccion_id, s.nombre AS seccion,
             COUNT(DISTINCT e.dni) AS alumnos
      FROM docente_curso dc
      JOIN cursos c ON c.id = dc.curso_id
      JOIN curso_grado cg ON cg.curso_id = c.id
      JOIN grados g ON g.id = cg.grado_id
      LEFT JOIN secciones s ON s.id = cg.seccion_id
      LEFT JOIN estudiantes e
        ON e.grado_id = g.id AND (cg.seccion_id IS NULL OR e.seccion_id = cg.seccion_id)
      WHERE CAST(dc.dni AS UNSIGNED) = CAST(? AS UNSIGNED)
      GROUP BY c.id, c.nombre, g.id, g.nombre, s.id, s.nombre
      ORDER BY c.nombre, g.nombre, s.nombre`;
    const [rows] = await pool.query(sql, [dni]);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});


app.get('/api/promedio-detalle', async (req, res) => {
  const cursoId = Number(req.query.curso_id || 0);
  const gradoId = Number(req.query.grado_id || 0);
  const seccionId = req.query.seccion_id ? Number(req.query.seccion_id) : null;
  if (!cursoId || !gradoId) return res.status(400).json({ ok: false, error: 'Falta curso_id o grado_id' });
  try {
    let sql = `
      SELECT pd.promedio_id, pd.actividad_id
      FROM promedio_detalle pd
      JOIN curso_actividad ca ON ca.id = pd.promedio_id
      WHERE ca.curso_id = ? AND ca.grado_id = ?
    `;
    const params = [cursoId, gradoId];
    if (seccionId) { sql += ' AND ca.seccion_id = ?'; params.push(seccionId); }
    else { sql += ' AND ca.seccion_id IS NULL'; }
    const [rows] = await pool.query(sql, params);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/promedio-detalle', async (req, res) => {
  const { promedio_id, actividades_ids } = req.body;
  if (!promedio_id || !Array.isArray(actividades_ids)) return res.status(400).json({ ok: false, error: 'Datos inválidos' });
  try {
    const values = actividades_ids.map(aid => [promedio_id, aid]);
    if (values.length > 0) {
      await pool.query('INSERT IGNORE INTO promedio_detalle (promedio_id, actividad_id) VALUES ?', [values]);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Estudiantes por curso asignado al docente
app.get('/api/docentes/:dni/cursos/:cursoId/estudiantes', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  const cursoId = Number(req.params.cursoId || 0);
  if (!dni || !cursoId) return res.status(400).json({ ok: false, error: 'Faltan dni y cursoId' });
  try {
    const [asig] = await pool.query('SELECT 1 FROM docente_curso WHERE CAST(dni AS UNSIGNED) = CAST(? AS UNSIGNED) AND curso_id = ? LIMIT 1', [dni, cursoId]);
    if (!asig || asig.length === 0) return res.status(404).json({ ok: false, error: 'Curso no asignado al docente' });
    const gradoId = req.query && req.query.grado_id ? Number(req.query.grado_id) : null;
    const seccionId = req.query && req.query.seccion_id ? Number(req.query.seccion_id) : null;
    let sql = `
      SELECT DISTINCT e.dni, e.apellidos, e.nombres, e.grado, e.seccion
      FROM estudiantes e
      JOIN curso_grado cg
        ON e.grado_id = cg.grado_id AND (cg.seccion_id IS NULL OR e.seccion_id = cg.seccion_id)
      WHERE cg.curso_id = ?`;
    const params = [cursoId];
    if (gradoId) { sql += ' AND cg.grado_id = ?'; params.push(gradoId); }
    if (seccionId) { sql += ' AND cg.seccion_id = ?'; params.push(seccionId); }
    sql += ' ORDER BY e.apellidos, e.nombres';
    const [rows] = await pool.query(sql, params);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Docentes asignados a un curso
app.get('/api/cursos/:id/docentes', async (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  try {
    try { await pool.query("SET collation_connection = 'utf8mb4_unicode_ci'"); } catch (_) {}
    const sql = `
      SELECT d.dni, d.nombre
      FROM docente_curso dc
      JOIN docente d ON CAST(d.dni AS UNSIGNED) = CAST(dc.dni AS UNSIGNED)
      WHERE dc.curso_id = ?
      ORDER BY d.nombre`;
    const [rows] = await pool.query(sql, [id]);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/curso-actividades', async (req, res) => {
  const cursoId = Number(req.query.curso_id || 0);
  const gradoId = Number(req.query.grado_id || 0);
  const seccionId = req.query.seccion_id ? Number(req.query.seccion_id) : null;
  if (!cursoId || !gradoId) return res.status(400).json({ ok: false, error: 'Falta curso_id o grado_id' });
  try {
    const params = [cursoId, gradoId];
    let sql = 'SELECT id, nombre, orden, created_at FROM curso_actividad WHERE curso_id = ? AND grado_id = ?';
    if (seccionId) { sql += ' AND seccion_id = ?'; params.push(seccionId); } else { sql += ' AND seccion_id IS NULL'; }
    sql += ' ORDER BY orden, id';
    const [rows] = await pool.query(sql, params);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/curso-actividades', async (req, res) => {
  const { curso_id, grado_id, seccion_id, nombre } = req.body || {};
  const c = Number(curso_id || 0);
  const g = Number(grado_id || 0);
  const s = seccion_id ? Number(seccion_id) : null;
  const n = String(nombre || '').trim();
  if (!c || !g || !n) return res.status(400).json({ ok: false, error: 'Faltan datos' });
  try {
    const [ord] = await pool.query('SELECT COALESCE(MAX(orden),0)+1 AS next FROM curso_actividad WHERE curso_id = ? AND grado_id = ? AND ' + (s ? 'seccion_id = ?' : 'seccion_id IS NULL'), s ? [c, g, s] : [c, g]);
    const next = (ord[0] && ord[0].next) ? Number(ord[0].next) : 1;
    const [ins] = await pool.query('INSERT INTO curso_actividad (curso_id, grado_id, seccion_id, nombre, orden) VALUES (?,?,?,?,?)', [c, g, s, n, next]);
    res.json({ ok: true, id: ins.insertId, orden: next });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.delete('/api/curso-actividades/:id', async (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  try {
    await pool.query('DELETE FROM actividad_nota WHERE actividad_id = ?', [id]);
    await pool.query('DELETE FROM promedio_detalle WHERE promedio_id = ? OR actividad_id = ?', [id, id]);
    const [del] = await pool.query('DELETE FROM curso_actividad WHERE id = ?', [id]);
    if (del.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Actividad no existe' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/actividad-notas', async (req, res) => {
  const actividadId = Number(req.query.actividad_id || 0);
  if (!actividadId) return res.status(400).json({ ok: false, error: 'Falta actividad_id' });
  try {
    const [rows] = await pool.query('SELECT actividad_id, estudiante_dni, nota FROM actividad_nota WHERE actividad_id = ? ORDER BY estudiante_dni', [actividadId]);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/actividad-notas/bulk', async (req, res) => {
  const { actividad_id, notas } = req.body || {};
  const a = Number(actividad_id || 0);
  if (!a || !Array.isArray(notas)) return res.status(400).json({ ok: false, error: 'Faltan datos' });
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      // 1. Obtener notas existentes para comparar
      const [existingRows] = await conn.query('SELECT id, estudiante_dni, nota FROM actividad_nota WHERE actividad_id = ?', [a]);
      const existingMap = {}; // dni -> { id, nota }
      for (const row of existingRows) {
        existingMap[row.estudiante_dni] = row;
      }

      for (const item of notas) {
        const dni = String(item.dni || '').trim();
        const val = item.nota != null ? Number(item.nota) : null;
        if (!dni) continue;

        const current = existingMap[dni];

        if (current) {
          // Existe: Verificar si cambió
          const currentVal = current.nota != null ? Number(current.nota) : null;
          // Comparar considerando nulls y tolerancia float
          const changed = (val !== currentVal);
          
          if (changed) {
             // Guardar historial
             await conn.query('INSERT INTO nota_historial (nota_id, valor_anterior, valor_nuevo) VALUES (?, ?, ?)', [current.id, currentVal, val]);
             // Actualizar nota
             await conn.query('UPDATE actividad_nota SET nota = ? WHERE id = ?', [val, current.id]);
          }
        } else {
          // No existe: Insertar
          await conn.query('INSERT INTO actividad_nota (actividad_id, estudiante_dni, nota) VALUES (?,?,?)', [a, dni, val]);
        }
      }
      
      await conn.commit();
      conn.release();
      res.json({ ok: true });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/actividad-notas/historial', async (req, res) => {
  const actividadId = Number(req.query.actividad_id || 0);
  const dni = String(req.query.dni || '').trim();
  if (!actividadId || !dni) return res.status(400).json({ ok: false, error: 'Falta actividad_id o dni' });
  try {
    const [notaRows] = await pool.query('SELECT id, created_at, updated_at FROM actividad_nota WHERE actividad_id = ? AND estudiante_dni = ?', [actividadId, dni]);
    if (notaRows.length === 0) return res.json({ ok: true, data: null }); // No existe nota aún

    const nota = notaRows[0];
    const [histRows] = await pool.query('SELECT valor_anterior, valor_nuevo, fecha FROM nota_historial WHERE nota_id = ? ORDER BY fecha DESC', [nota.id]);
    
    // Obtener created_at de la actividad también, por si acaso
    const [actRows] = await pool.query('SELECT created_at FROM curso_actividad WHERE id = ?', [actividadId]);
    const actividadCreatedAt = actRows[0] ? actRows[0].created_at : null;

    res.json({ 
      ok: true, 
      data: {
        actividad_created_at: actividadCreatedAt,
        nota_created_at: nota.created_at,
        nota_updated_at: nota.updated_at,
        historial: histRows
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Cursos
app.get('/api/cursos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, descripcion FROM cursos ORDER BY nombre');
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/cursos/disponibles', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, descripcion FROM cursos WHERE id NOT IN (SELECT curso_id FROM docente_curso) ORDER BY nombre');
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/cursos', async (req, res) => {
  const { nombre, descripcion } = req.body || {};
  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ ok: false, error: 'Falta nombre' });
  }
  try {
    const [result] = await pool.query('INSERT INTO cursos (nombre, descripcion) VALUES (?, ?)', [String(nombre).trim(), descripcion ? String(descripcion).trim() : null]);
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Curso ya existe' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

// Actualizar curso
app.put('/api/cursos/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, descripcion } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  const updates = [];
  const params = [];
  if (typeof nombre === 'string' && nombre.trim()) { updates.push('nombre = ?'); params.push(nombre.trim()); }
  if (typeof descripcion === 'string') { updates.push('descripcion = ?'); params.push(descripcion.trim() || null); }
  if (updates.length === 0) return res.status(400).json({ ok: false, error: 'No hay campos para actualizar' });
  try {
    params.push(id);
    const [result] = await pool.query(`UPDATE cursos SET ${updates.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Curso no existe' });
    res.json({ ok: true, affected: result.affectedRows });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Nombre de curso ya existe' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

// Eliminar curso (incluye limpieza de asignaciones)
app.delete('/api/cursos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  try {
    await pool.query('DELETE FROM docente_curso WHERE curso_id = ?', [id]);
    const [result] = await pool.query('DELETE FROM cursos WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Curso no existe' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Asignaciones (ver cursos por docente) -> ver versión enriquecida más abajo

app.post('/api/asignaciones', async (req, res) => {
  const { dni, curso_id } = req.body || {};
  const d = String(dni || '').trim();
  const c = Number(curso_id);
  if (!d || !c) return res.status(400).json({ ok: false, error: 'Faltan dni y curso_id' });
  try {
    const [docRows] = await pool.query('SELECT dni FROM docente WHERE dni = ? LIMIT 1', [d]);
    if (docRows.length === 0) return res.status(404).json({ ok: false, error: 'Docente no existe' });
    const [curRows] = await pool.query('SELECT id FROM cursos WHERE id = ? LIMIT 1', [c]);
    if (curRows.length === 0) return res.status(404).json({ ok: false, error: 'Curso no existe' });
    const [result] = await pool.query('INSERT INTO docente_curso (dni, curso_id) VALUES (?, ?)', [d, c]);
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Asignación ya existe para este docente' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

app.delete('/api/asignaciones', async (req, res) => {
  const { dni, curso_id } = req.body || {};
  const d = String(dni || '').trim();
  const c = Number(curso_id);
  if (!d || !c) return res.status(400).json({ ok: false, error: 'Faltan dni y curso_id' });
  try {
    const [result] = await pool.query('DELETE FROM docente_curso WHERE dni = ? AND curso_id = ?', [d, c]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: 'Asignación no existe' });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/docentes', async (req, res) => {
  const { dni, nombre, descripcion } = req.body || {};
  if (!dni || !nombre) {
    return res.status(400).json({ ok: false, error: 'Faltan dni y nombre' });
  }
  // Generar contraseña: Primer nombre (primera palabra) + 2 primeros dígitos del DNI
  const primerNombre = nombre.trim().split(' ')[0];
  const plainPassword = (primerNombre + String(dni).substring(0, 2)) || String(dni).slice(-6);
  
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const [result] = await pool.query('INSERT INTO docente (dni, nombre, descripcion, password) VALUES (?, ?, ?, ?)', [dni, nombre, descripcion || null, hashedPassword]);
    res.json({ ok: true, id: result.insertId, password: plainPassword });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'DNI ya registrado' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

// Actualizar docente
app.put('/api/docentes/:dni', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  const { nombre, descripcion, password } = req.body || {};
  if (!dni) return res.status(400).json({ ok: false, error: 'Falta dni' });
  try {
    const [rows] = await pool.query('SELECT dni FROM docente WHERE dni = ? LIMIT 1', [dni]);
    if (rows.length === 0) return res.status(404).json({ ok: false, error: 'Docente no existe' });
    const fields = [];
    const params = [];
    if (typeof nombre === 'string' && nombre.trim()) { fields.push('nombre = ?'); params.push(nombre.trim()); }
    if (typeof descripcion === 'string') { fields.push('descripcion = ?'); params.push(descripcion.trim() || null); }
    if (typeof password === 'string' && password.trim()) { 
      fields.push('password = ?'); 
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      params.push(hashedPassword); 
    }
    if (fields.length === 0) return res.status(400).json({ ok: false, error: 'No hay campos para actualizar' });
    params.push(dni);
    const [result] = await pool.query(`UPDATE docente SET ${fields.join(', ')} WHERE dni = ?`, params);
    res.json({ ok: true, affected: result.affectedRows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Eliminar docente (incluye limpieza de asignaciones)
app.delete('/api/docentes/:dni', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  if (!dni) return res.status(400).json({ ok: false, error: 'Falta dni' });
  try {
    await pool.query('DELETE FROM docente_curso WHERE dni = ?', [dni]);
    const [result] = await pool.query('DELETE FROM docente WHERE dni = ?', [dni]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Docente no existe' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});



// Estudiantes
app.get('/api/estudiantes', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.dni, e.apellidos, e.nombres, 
             COALESCE(g.nombre, CAST(e.grado AS CHAR)) as grado, 
             COALESCE(s.nombre, e.seccion) as seccion,
             e.grado_id, e.seccion_id
      FROM estudiantes e
      LEFT JOIN grados g ON g.id = e.grado_id
      LEFT JOIN secciones s ON s.id = e.seccion_id
      ORDER BY e.apellidos, e.nombres
    `);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Crear estudiante (individual)
app.post('/api/estudiantes', async (req, res) => {
  const { dni, apellidos, nombres, grado, seccion } = req.body || {};
  const d = String(dni || '').trim();
  const a = String(apellidos || '').trim();
  const n = String(nombres || '').trim();
  
  if (!d || !a || !n) return res.status(400).json({ ok: false, error: 'Faltan dni, apellidos y nombres' });

  // Helpers (replicados de bulk para consistencia)
  const normalizeGrado = (g) => {
       if (!g) return null;
       const s = String(g).trim();
       if (/^\d+$/.test(s)) return `${s}°`; 
       return s;
  };
  const normalizeSeccion = (s) => (s ? String(s).trim().toUpperCase() : null);

  const getOrCreateId = async (table, name) => {
      if (!name) return null;
      // Buscar
      let query = `SELECT id, nombre FROM ${table} WHERE nombre = ?`;
      let params = [name];
      if (table === 'grados') {
        const clean = name.replace('°', '');
        const withDegree = `${clean}°`;
        query = `SELECT id, nombre FROM ${table} WHERE nombre = ? OR nombre = ? ORDER BY LENGTH(nombre) DESC LIMIT 1`;
        params = [clean, withDegree];
      } else {
        query += ' LIMIT 1';
      }
      const [rows] = await pool.query(query, params);
      if (rows.length > 0) return rows[0].id;
      
      // Crear
      try {
        const [res] = await pool.query(`INSERT INTO ${table} (nombre) VALUES (?)`, [name]);
        return res.insertId;
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
           const [rowsRetry] = await pool.query(`SELECT id FROM ${table} WHERE nombre = ? LIMIT 1`, [name]);
           if (rowsRetry.length > 0) return rowsRetry[0].id;
        }
        throw e;
      }
  };

  try {
    const normGrado = normalizeGrado(grado);
    const normSeccion = normalizeSeccion(seccion);

    let gradoId = null;
    let seccionId = null;

    if (normGrado) gradoId = await getOrCreateId('grados', normGrado);
    if (normSeccion) seccionId = await getOrCreateId('secciones', normSeccion);

    let legacyGrado = null;
    if (normGrado) {
       const match = String(normGrado).match(/(\d+)/);
       if (match) legacyGrado = parseInt(match[1], 10);
    }
    const legacySeccion = normSeccion || null;

    const [result] = await pool.query(
      'INSERT INTO estudiantes (dni, apellidos, nombres, grado_id, seccion_id, grado, seccion) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [d, a, n, gradoId, seccionId, legacyGrado, legacySeccion]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'DNI ya registrado' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

app.post('/api/estudiantes/bulk', async (req, res) => {
  const { estudiantes } = req.body || {};
  if (!Array.isArray(estudiantes)) {
    return res.status(400).json({ ok: false, error: 'Formato inválido: se esperaba { estudiantes: [...] }' });
  }

  // 1. Filtrar estudiantes válidos
  const validStudents = estudiantes.filter(s => s.dni && s.apellidos && s.nombres);
  if (validStudents.length === 0) {
    return res.status(400).json({ ok: false, error: 'No hay estudiantes válidos para insertar' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 2. Procesar Grados y Secciones (Crear si no existen)
    const gradoMap = new Map(); // Nombre -> ID
    const seccionMap = new Map(); // Nombre -> ID

    // Helper para normalizar nombre de grado
    const normalizeGrado = (g) => {
       if (!g) return null;
       const s = String(g).trim();
       // Si es solo número, agregar símbolo de grado
       if (/^\d+$/.test(s)) return `${s}°`; 
       return s;
    };

    const normalizeSeccion = (s) => {
        if (!s) return null;
        return String(s).trim().toUpperCase();
    };

    // Helper para obtener o crear ID
    const getOrCreateId = async (table, name, map) => {
      if (!name) return null;
      if (map.has(name)) return map.get(name);

      console.log(`[Bulk] Buscando/Creando ${table}: "${name}"`);

      // Buscar por nombre exacto
      let query = `SELECT id, nombre FROM ${table} WHERE nombre = ?`;
      let params = [name];

      // Lógica especial para grados: buscar "1" y "1°" como equivalentes
      if (table === 'grados') {
        const clean = name.replace('°', '');
        const withDegree = `${clean}°`;
        query = `SELECT id, nombre FROM ${table} WHERE nombre = ? OR nombre = ? ORDER BY LENGTH(nombre) DESC LIMIT 1`;
        params = [clean, withDegree];
      } else {
        query += ' LIMIT 1';
      }

      const [rows] = await connection.query(query, params);
      
      if (rows.length > 0) {
        console.log(`[Bulk] Encontrado ${table}: "${rows[0].nombre}" (buscado: "${name}") -> ID ${rows[0].id}`);
        map.set(name, rows[0].id); // Mapeamos el nombre buscado al ID encontrado
        return rows[0].id;
      }

      // Crear si no existe
      try {
        console.log(`[Bulk] Creando nuevo ${table}: "${name}"`);
        const [res] = await connection.query(`INSERT INTO ${table} (nombre) VALUES (?)`, [name]);
        map.set(name, res.insertId);
        return res.insertId;
      } catch (e) {
        // Manejar condición de carrera si otro proceso lo insertó
        if (e.code === 'ER_DUP_ENTRY') {
           const [rowsRetry] = await connection.query(`SELECT id FROM ${table} WHERE nombre = ? LIMIT 1`, [name]);
           if (rowsRetry.length > 0) {
             map.set(name, rowsRetry[0].id);
             return rowsRetry[0].id;
           }
        }
        throw e;
      }
    };

    // Pre-procesar todos los estudiantes para llenar los mapas
    // Usamos un Set para iterar solo valores únicos primero
    const uniqueGrados = new Set();
    const uniqueSecciones = new Set();

    validStudents.forEach(s => {
        const g = normalizeGrado(s.grado);
        const sec = normalizeSeccion(s.seccion);
        if (g) uniqueGrados.add(g);
        if (sec) uniqueSecciones.add(sec);
    });

    for (const g of uniqueGrados) await getOrCreateId('grados', g, gradoMap);
    for (const s of uniqueSecciones) await getOrCreateId('secciones', s, seccionMap);

    // 3. Preparar Bulk Insert
    const values = validStudents.map(s => {
      const normGrado = normalizeGrado(s.grado);
      const normSeccion = normalizeSeccion(s.seccion);

      const gradoId = normGrado ? gradoMap.get(normGrado) : null;
      const seccionId = normSeccion ? seccionMap.get(normSeccion) : null;
      
      // Intentar derivar valores legacy (solo numérico para grado)
      let legacyGrado = null;
      if (normGrado) {
          const match = String(normGrado).match(/(\d+)/);
          if (match) legacyGrado = parseInt(match[1], 10);
      }
      const legacySeccion = normSeccion || null;

      return [
        String(s.dni).trim(),
        String(s.apellidos).trim(),
        String(s.nombres).trim(),
        gradoId,
        seccionId,
        legacyGrado,
        legacySeccion
      ];
    });

    const sql = `
      INSERT INTO estudiantes (dni, apellidos, nombres, grado_id, seccion_id, grado, seccion) 
      VALUES ? 
      ON DUPLICATE KEY UPDATE 
        apellidos=VALUES(apellidos), 
        nombres=VALUES(nombres),
        grado_id=COALESCE(VALUES(grado_id), grado_id),
        seccion_id=COALESCE(VALUES(seccion_id), seccion_id),
        grado=COALESCE(VALUES(grado), grado),
        seccion=COALESCE(VALUES(seccion), seccion)
    `;

    await connection.query(sql, [values]);

    await connection.commit();
    res.json({ ok: true, count: values.length });

  } catch (e) {
    await connection.rollback();
    res.status(500).json({ ok: false, error: e.message });
  } finally {
    connection.release();
  }
});

// Estudiantes sin grado
app.get('/api/estudiantes/sin-grado', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT dni, apellidos, nombres FROM estudiantes WHERE grado IS NULL ORDER BY apellidos, nombres');
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Asignación masiva de grado y sección
app.post('/api/estudiantes/grados/bulk', async (req, res) => {
  const { grado, seccion, dnis, grado_id, seccion_id } = req.body || {};
  // Si envían ID, usamos eso. Si envían texto/número legacy, intentamos resolver.
  
  const list = Array.isArray(dnis) ? dnis.map(d => String(d || '').trim()).filter(Boolean) : [];
  if (list.length === 0) return res.status(400).json({ ok: false, error: 'Lista de DNI vacía' });

  try {
    const fields = [];
    const params = [];

    // Resolver Grado
    if (grado_id) {
        fields.push('grado_id = ?'); params.push(grado_id);
        const [gRows] = await pool.query('SELECT nombre FROM grados WHERE id = ?', [grado_id]);
        if (gRows.length > 0) {
            const gNum = parseInt(gRows[0].nombre);
            fields.push('grado = ?'); params.push(isNaN(gNum) ? null : gNum);
        }
    } else if (grado) {
        // Legacy support
        const gNum = Number(grado);
        // Si es 1-6, asumimos legacy directo si no hay ID
        if (!isNaN(gNum) && gNum >= 1 && gNum <= 6) {
            fields.push('grado = ?'); params.push(gNum);
            // Intentar buscar ID
            const [gRows] = await pool.query('SELECT id FROM grados WHERE nombre = ? OR nombre = ? LIMIT 1', [gNum + '°', String(gNum)]);
            if (gRows.length > 0) {
                fields.push('grado_id = ?'); params.push(gRows[0].id);
            } else {
                fields.push('grado_id = NULL');
            }
        } else {
             return res.status(400).json({ ok: false, error: 'Grado inválido (use ID para grados personalizados)' });
        }
    }

    // Resolver Sección
    if (seccion_id) {
        fields.push('seccion_id = ?'); params.push(seccion_id);
        const [sRows] = await pool.query('SELECT nombre FROM secciones WHERE id = ?', [seccion_id]);
        if (sRows.length > 0) {
            fields.push('seccion = ?'); params.push(sRows[0].nombre);
        }
    } else if (seccion) {
        const secName = String(seccion).trim();
        fields.push('seccion = ?'); params.push(secName);
        const [sRows] = await pool.query('SELECT id FROM secciones WHERE nombre = ? LIMIT 1', [secName]);
        if (sRows.length > 0) {
            fields.push('seccion_id = ?'); params.push(sRows[0].id);
        } else {
            fields.push('seccion_id = NULL');
        }
    }

    if (fields.length === 0) return res.status(400).json({ ok: false, error: 'Nada que actualizar' });

    const placeholders = list.map(() => '?').join(',');
    const sql2 = `UPDATE estudiantes SET ${fields.join(', ')} WHERE dni IN (${placeholders})`;
    const [result] = await pool.query(sql2, [...params, ...list]);
    res.json({ ok: true, affected: result.affectedRows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Actualizar estudiante
app.put('/api/estudiantes/:dni', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  const { apellidos, nombres, grado, seccion, grado_id, seccion_id } = req.body || {};
  if (!dni) return res.status(400).json({ ok: false, error: 'Falta dni' });
  try {
    const [rows] = await pool.query(`
      SELECT e.dni, e.grado_id, e.seccion_id, e.grado, e.seccion,
             g.nombre as grado_nombre
      FROM estudiantes e
      LEFT JOIN grados g ON g.id = e.grado_id
      WHERE e.dni = ? LIMIT 1
    `, [dni]);
    if (rows.length === 0) return res.status(404).json({ ok: false, error: 'Estudiante no existe' });
    const current = rows[0];
    
    const fields = [];
    const params = [];
    
    if (typeof apellidos === 'string' && apellidos.trim()) { fields.push('apellidos = ?'); params.push(apellidos.trim()); }
    if (typeof nombres === 'string' && nombres.trim()) { fields.push('nombres = ?'); params.push(nombres.trim()); }
    
    // Lógica para Grado
    let skipGrado = false;
    const currentGradoId = current.grado_id || null;
    const newGradoId = grado_id || null;
    
    // Construir valor de visualización actual tal como lo hace el GET
    const currentGradoDisplay = current.grado_nombre || (current.grado ? String(current.grado) : '');
    const newGradoDisplay = grado !== undefined && grado !== null ? String(grado) : '';

    // Si IDs son iguales (y definidos) O (IDs son nulos Y textos coinciden)
    // Nota: Comparar newGradoDisplay con currentGradoDisplay cubre el caso de legacy "7" vs "7"
    if (grado !== undefined) {
        if (currentGradoId && newGradoId && currentGradoId === newGradoId) {
            skipGrado = true;
        } else if (!currentGradoId && !newGradoId && newGradoDisplay == currentGradoDisplay) {
            skipGrado = true;
        }
    }

    if (!skipGrado) {
        if (grado_id) {
          // Si envían ID explícito
          fields.push('grado_id = ?'); params.push(grado_id);
          // Buscar el nombre para mantener consistencia legacy
          const [gRows] = await pool.query('SELECT nombre FROM grados WHERE id = ?', [grado_id]);
          if (gRows.length > 0) {
            const gName = gRows[0].nombre;
            const gNum = parseInt(gName);
            fields.push('grado = ?'); params.push(isNaN(gNum) ? null : gNum);
          }
        } else if (grado !== undefined) {
          // Fallback legacy o si limpian el grado
          if (grado === null || grado === '') {
            fields.push('grado = NULL');
            fields.push('grado_id = NULL');
          } else {
            // Intentar resolver ID desde el valor (puede ser número o string "1°")
            // Primero buscar en grados por nombre
            let gName = String(grado).trim();
            // Normalizar "1" a "1°" para búsqueda
            if (/^\d+$/.test(gName)) gName += '°';
            
            const [gRows] = await pool.query('SELECT id, nombre FROM grados WHERE nombre = ? OR nombre = ? LIMIT 1', [gName, String(grado).trim()]);
            
            if (gRows.length > 0) {
              fields.push('grado_id = ?'); params.push(gRows[0].id);
              const gNum = parseInt(gRows[0].nombre);
              fields.push('grado = ?'); params.push(isNaN(gNum) ? null : gNum);
            } else {
                // Si no existe el grado, permitirlo legacy si es 1-6, sino error o null
                const gNum = Number(grado);
                if (!isNaN(gNum) && gNum >= 1 && gNum <= 6) {
                    fields.push('grado = ?'); params.push(gNum);
                    fields.push('grado_id = NULL'); // No tiene ID asociado
                } else {
                    // Rechazar si no coincide con el actual (que ya validamos con skipGrado)
                    return res.status(400).json({ ok: false, error: 'Grado inválido o no registrado' });
                }
            }
          }
        }
    }

    // Lógica para Sección
    let skipSeccion = false;
    const currentSeccionId = current.seccion_id || null;
    const newSeccionId = seccion_id || null;
    const currentSeccionDisplay = current.seccion || '';
    const newSeccionDisplay = seccion !== undefined && seccion !== null ? String(seccion) : '';

    if (seccion !== undefined) {
        if (currentSeccionId && newSeccionId && currentSeccionId === newSeccionId) {
            skipSeccion = true;
        } else if (!currentSeccionId && !newSeccionId && newSeccionDisplay == currentSeccionDisplay) {
            skipSeccion = true;
        }
    }

    if (!skipSeccion) {
        if (seccion_id) {
          fields.push('seccion_id = ?'); params.push(seccion_id);
          const [sRows] = await pool.query('SELECT nombre FROM secciones WHERE id = ?', [seccion_id]);
          if (sRows.length > 0) {
            fields.push('seccion = ?'); params.push(sRows[0].nombre);
          }
        } else if (seccion !== undefined) {
          if (seccion === null || seccion === '') {
            fields.push('seccion = NULL');
            fields.push('seccion_id = NULL');
          } else {
            const sName = String(seccion).trim().toUpperCase();
            const [sRows] = await pool.query('SELECT id FROM secciones WHERE nombre = ? LIMIT 1', [sName]);
            if (sRows.length > 0) {
                fields.push('seccion_id = ?'); params.push(sRows[0].id);
                fields.push('seccion = ?'); params.push(sName);
            } else {
                // Permitir guardar texto legacy, pero sin ID
                fields.push('seccion = ?'); params.push(sName);
                fields.push('seccion_id = NULL');
            }
          }
        }
    }

    if (fields.length === 0) return res.status(400).json({ ok: false, error: 'No hay campos para actualizar' });
    params.push(dni);
    const [result] = await pool.query(`UPDATE estudiantes SET ${fields.join(', ')} WHERE dni = ?`, params);
    res.json({ ok: true, affected: result.affectedRows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Eliminar estudiante
app.delete('/api/estudiantes-masivo', async (req, res) => {
  const grado = req.query.grado ? Number(req.query.grado) : null;
  const seccion = req.query.seccion ? String(req.query.seccion).trim() : null;

  if (!grado && !seccion) {
    return res.status(400).json({ ok: false, error: 'Debe especificar grado o sección para eliminar' });
  }

  try {
    const conditions = [];
    const params = [];

    if (grado) {
      conditions.push('grado = ?');
      params.push(grado);
    }
    if (seccion) {
      conditions.push('seccion = ?');
      params.push(seccion);
    }

    const sql = `DELETE FROM estudiantes WHERE ${conditions.join(' AND ')}`;
    const [result] = await pool.query(sql, params);
    
    res.json({ ok: true, affected: result.affectedRows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.delete('/api/estudiantes/:dni', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  if (!dni) return res.status(400).json({ ok: false, error: 'Falta dni' });
  try {
    const [result] = await pool.query('DELETE FROM estudiantes WHERE dni = ?', [dni]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Estudiante no existe' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Login Docente
app.post('/api/login/docente', async (req, res) => {
  const { dni, password } = req.body || {};
  if (!dni || !password) {
    return res.status(400).json({ ok: false, error: 'Faltan credenciales' });
  }
  try {
    const [rows] = await pool.query('SELECT dni, password FROM docente WHERE dni = ? LIMIT 1', [dni]);
    if (rows.length === 0) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }
    const user = rows[0];
    const storedPassword = user.password;
    
    // Check if stored password is a hash (bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 chars long)
    const isHash = storedPassword.startsWith('$2') && storedPassword.length === 60;

    let valid = false;
    if (isHash) {
      valid = await bcrypt.compare(password, storedPassword);
    } else {
      // Legacy plain text check
      if (password === storedPassword) {
        valid = true;
        // Lazy migration: hash and update
        const newHash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE docente SET password = ? WHERE dni = ?', [newHash, dni]);
      }
    }

    if (!valid) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }
    
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Login Alumno
app.post('/api/login/alumno', async (req, res) => {
  const { dni } = req.body || {};
  try {
    if (dni) {
      const [rows] = await pool.query('SELECT dni FROM estudiantes WHERE dni = ? LIMIT 1', [dni]);
      if (rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'DNI inválido' });
      }
      return res.json({ ok: true });
    }
    return res.status(400).json({ ok: false, error: 'Falta dni' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});



// Promover grado (+1, máx 6)
app.post('/api/estudiantes/grados/promover', async (req, res) => {
  const { dnis } = req.body || {};
  const list = Array.isArray(dnis) ? dnis.map(d => String(d || '').trim()).filter(Boolean) : [];
  if (list.length === 0) return res.status(400).json({ ok: false, error: 'Lista de DNI vacía' });
  try {
    // 1. Obtener mapa de grados (ID <-> Número)
    const [grados] = await pool.query('SELECT id, nombre FROM grados');
    const numToId = new Map();
    const idToNum = new Map();
    
    grados.forEach(g => {
      const m = String(g.nombre).match(/(\d+)/);
      if (m) {
        const n = parseInt(m[1], 10);
        numToId.set(n, g.id);
        idToNum.set(g.id, n);
      }
    });

    // 2. Obtener estudiantes actuales
    const placeholders = list.map(() => '?').join(',');
    const [students] = await pool.query(`SELECT dni, grado, grado_id FROM estudiantes WHERE dni IN (${placeholders})`, list);

    let affected = 0;
    
    // 3. Calcular y actualizar (Optimizado por lotes)
    const updates = new Map(); // Key: "nextVal|nextId" -> Set of DNIs

    for (const s of students) {
      let current = null;
      if (s.grado_id && idToNum.has(s.grado_id)) {
        current = idToNum.get(s.grado_id);
      } else {
        current = s.grado;
      }
      
      if (!current) continue;

      const nextVal = Math.min(6, current + 1);
      if (nextVal === current) continue;

      const nextId = numToId.get(nextVal) || null;
      const key = `${nextVal}|${nextId !== null ? nextId : 'NULL'}`;
      
      if (!updates.has(key)) {
        updates.set(key, { nextVal, nextId, dnis: [] });
      }
      updates.get(key).dnis.push(s.dni);
    }

    // Ejecutar actualizaciones por lote
    for (const [key, data] of updates) {
       const { nextVal, nextId, dnis } = data;
       if (dnis.length > 0) {
         const placeholders = dnis.map(() => '?').join(',');
         const params = [nextVal, nextId, ...dnis];
         const [res] = await pool.query(`UPDATE estudiantes SET grado = ?, grado_id = ? WHERE dni IN (${placeholders})`, params);
         affected += res.affectedRows;
       }
    }

    res.json({ ok: true, affected });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Bajar grado (-1, mín 1)
app.post('/api/estudiantes/grados/bajar', async (req, res) => {
  const { dnis } = req.body || {};
  const list = Array.isArray(dnis) ? dnis.map(d => String(d || '').trim()).filter(Boolean) : [];
  if (list.length === 0) return res.status(400).json({ ok: false, error: 'Lista de DNI vacía' });
  try {
    // 1. Obtener mapa de grados
    const [grados] = await pool.query('SELECT id, nombre FROM grados');
    const numToId = new Map();
    const idToNum = new Map();
    
    grados.forEach(g => {
      const m = String(g.nombre).match(/(\d+)/);
      if (m) {
        const n = parseInt(m[1], 10);
        numToId.set(n, g.id);
        idToNum.set(g.id, n);
      }
    });

    // 2. Obtener estudiantes
    const placeholders = list.map(() => '?').join(',');
    const [students] = await pool.query(`SELECT dni, grado, grado_id FROM estudiantes WHERE dni IN (${placeholders})`, list);

    let affected = 0;
    
    // 3. Calcular y actualizar (Optimizado por lotes)
    const updates = new Map();

    for (const s of students) {
      let current = null;
      if (s.grado_id && idToNum.has(s.grado_id)) {
        current = idToNum.get(s.grado_id);
      } else {
        current = s.grado;
      }
      
      if (!current) continue;

      const nextVal = Math.max(1, current - 1);
      if (nextVal === current) continue;

      const nextId = numToId.get(nextVal) || null;
      const key = `${nextVal}|${nextId !== null ? nextId : 'NULL'}`;

      if (!updates.has(key)) {
        updates.set(key, { nextVal, nextId, dnis: [] });
      }
      updates.get(key).dnis.push(s.dni);
    }

    // Ejecutar actualizaciones por lote
    for (const [key, data] of updates) {
       const { nextVal, nextId, dnis } = data;
       if (dnis.length > 0) {
         const placeholders = dnis.map(() => '?').join(',');
         const params = [nextVal, nextId, ...dnis];
         const [res] = await pool.query(`UPDATE estudiantes SET grado = ?, grado_id = ? WHERE dni IN (${placeholders})`, params);
         affected += res.affectedRows;
       }
    }

    res.json({ ok: true, affected });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// === GRADOS ===
app.get('/api/grados', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM grados ORDER BY nombre');
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/grados', async (req, res) => {
  const { nombre } = req.body || {};
  const nom = String(nombre || '').trim();
  if (!nom) return res.status(400).json({ ok: false, error: 'Falta nombre' });
  try {
    const [result] = await pool.query('INSERT INTO grados (nombre) VALUES (?)', [nom]);
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Nombre de grado ya existe' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

app.put('/api/grados/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nombre } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  const nom = typeof nombre === 'string' ? nombre.trim() : '';
  if (!nom) return res.status(400).json({ ok: false, error: 'No hay campos para actualizar' });
  try {
    const [result] = await pool.query('UPDATE grados SET nombre = ? WHERE id = ?', [nom, id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Grado no existe' });
    res.json({ ok: true, affected: result.affectedRows });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Nombre de grado ya existe' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

app.delete('/api/grados/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  try {
    // 1. Desasignar estudiantes
    await pool.query('UPDATE estudiantes SET grado_id = NULL, grado = NULL WHERE grado_id = ?', [id]);
    // 2. Eliminar grado
    const [result] = await pool.query('DELETE FROM grados WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Grado no existe' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// === SECCIONES ===
app.get('/api/secciones', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM secciones ORDER BY nombre');
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/secciones', async (req, res) => {
  const { nombre } = req.body || {};
  const nom = String(nombre || '').trim();
  if (!nom) return res.status(400).json({ ok: false, error: 'Falta nombre' });
  try {
    const [result] = await pool.query('INSERT INTO secciones (nombre) VALUES (?)', [nom]);
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Sección ya existe' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

app.put('/api/secciones/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nombre } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  if (typeof nombre !== 'string' || !nombre.trim()) return res.status(400).json({ ok: false, error: 'Falta nombre' });
  try {
    const [result] = await pool.query('UPDATE secciones SET nombre = ? WHERE id = ?', [nombre.trim(), id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Sección no existe' });
    res.json({ ok: true, affected: result.affectedRows });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Nombre de sección ya existe' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

app.delete('/api/secciones/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  try {
    // 1. Desasignar estudiantes
    await pool.query('UPDATE estudiantes SET seccion_id = NULL, seccion = NULL WHERE seccion_id = ?', [id]);
    // 2. Eliminar sección
    const [result] = await pool.query('DELETE FROM secciones WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Sección no existe' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// === CURSO POR GRADO/SECCION ===
app.get('/api/curso-grado', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT cg.id, cg.curso_id, c.nombre AS curso, cg.grado_id, g.nombre AS grado, cg.seccion_id, s.nombre AS seccion
      FROM curso_grado cg
      JOIN cursos c ON c.id = cg.curso_id
      JOIN grados g ON g.id = cg.grado_id
      LEFT JOIN secciones s ON s.id = cg.seccion_id
      ORDER BY g.nombre, c.nombre, s.nombre
    `);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/curso-grado', async (req, res) => {
  const { curso_id, grado_id, seccion_id } = req.body || {};
  const cid = Number(curso_id || 0);
  const gid = Number(grado_id || 0);
  const sid = seccion_id != null ? Number(seccion_id) : null;
  if (!cid || !gid) return res.status(400).json({ ok: false, error: 'Falta curso y grado' });
  try {
    const [result] = await pool.query('INSERT INTO curso_grado (curso_id, grado_id, seccion_id) VALUES (?, ?, ?)', [cid, gid, sid]);
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Asignación duplicada' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

app.delete('/api/curso-grado/:id', async (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  try {
    const [result] = await pool.query('DELETE FROM curso_grado WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Asignación no existe' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// === SERVIR REACT APP (CATCH-ALL) ===
// Cualquier petición que no sea API, devuelve el index.html de React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
