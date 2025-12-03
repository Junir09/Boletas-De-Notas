import React from 'react';
import '../assets/css/alumnos/cursos.css';

export default function Cursos({ alumno, cursos, onIrBoletines }) {
  const grupos = (() => {
    const map = {};
    (Array.isArray(cursos) ? cursos : []).forEach(c => {
      const ds = Array.isArray(c.docentes) ? c.docentes : [];
      if (ds.length === 0) {
        const key = '__sin_docente__';
        if (!map[key]) map[key] = { nombre: 'Docente: (no asignado)', cursos: [] };
        map[key].cursos.push(c);
      } else {
        ds.forEach(d => {
          const key = typeof d === 'string' ? d : (d.dni || d.nombre);
          const nombre = typeof d === 'string' ? d : d.nombre;
          if (!map[key]) map[key] = { nombre, cursos: [] };
          map[key].cursos.push(c);
        });
      }
    });
    return Object.values(map);
  })();

  return (
    <div>
      {alumno ? (
        <h1>Bienvenido {alumno.apellidos} {alumno.nombres}</h1>
      ) : (
        <h1>Mis cursos</h1>
      )}
      {alumno && (<h2>Mis cursos</h2>)}
      {(!cursos || cursos.length === 0) && <p>No tienes cursos asignados.</p>}
      {(cursos && cursos.length > 0) && (
        <div>
          {grupos.map((g, idx) => (
            <div key={idx} style={{ marginBottom: 16 }}>
              <h3>{`Docente: ${g.nombre}`}</h3>
              <div className="cursos-grid">
                {g.cursos.map(c => (
                  <div key={c.id} className="curso-card" onClick={() => onIrBoletines && onIrBoletines(c.id)}>
                    <h3>{c.nombre}</h3>
                    {alumno ? (<p>{`${alumno.grado}°${alumno.seccion ? ` ${alumno.seccion}` : ''}`}</p>) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
