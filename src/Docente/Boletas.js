import React, { useEffect, useState, useRef, useCallback } from 'react';
import '../assets/css/docente/boletas.css';
import { api } from '../api';

export default function Boletas({ seleccion }) {
  const [alumnos, setAlumnos] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [notas, setNotas] = useState({});
  const [loading, setLoading] = useState(false);
  const [actividadSel, setActividadSel] = useState(null);
  const [promOpen, setPromOpen] = useState(false);
  const [promNombre, setPromNombre] = useState('');
  const [promSeleccion, setPromSeleccion] = useState([]);
  const [delOpen, setDelOpen] = useState(false);
  const [promLinks, setPromLinks] = useState({});

  // Estados para Modales (Reemplazo de alerts/prompts)
  const [alertInfo, setAlertInfo] = useState({ open: false, title: 'Mensaje', msg: '' });
  const [addActOpen, setAddActOpen] = useState(false);
  const [addActName, setAddActName] = useState('');

  const cargarAlumnos = useCallback(async () => {
    setLoading(true);
    try {
      const dni = localStorage.getItem('dni') || '';
      const qs = `?grado_id=${seleccion.gradoId}` + (seleccion.seccionId ? `&seccion_id=${seleccion.seccionId}` : '');
      const resp = await fetch(api(`/api/docentes/${dni}/cursos/${seleccion.cursoId}/estudiantes${qs}`));
      const json = await resp.json();
      setAlumnos(json.ok && Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setAlumnos([]);
    } finally {
      setLoading(false);
    }
  }, [seleccion]);

  const cargarActividades = useCallback(async () => {
    try {
      const qs = `?curso_id=${seleccion.cursoId}&grado_id=${seleccion.gradoId}` + (seleccion.seccionId ? `&seccion_id=${seleccion.seccionId}` : '');
      const resp = await fetch(api(`/api/curso-actividades${qs}`));
      const json = await resp.json();
      const list = (resp.ok && json.ok && Array.isArray(json.data)) ? json.data : [];
      setActividades(list);
      if (list.length > 0 && (!actividadSel || !list.find(a => a.id === actividadSel))) {
        setActividadSel(list[0].id);
      }
      const notasInicial = {};
      for (const act of list) {
        const r = await fetch(api(`/api/actividad-notas?actividad_id=${act.id}`));
        const j = await r.json();
        const m = {};
        if (r.ok && j.ok && Array.isArray(j.data)) {
          for (const row of j.data) { m[row.estudiante_dni] = row.nota ?? ''; }
        }
        notasInicial[act.id] = m;
      }
      setNotas(notasInicial);

      // Cargar dependencias de promedios
      const rD = await fetch(api(`/api/promedio-detalle${qs}`));
      const jD = await rD.json();
      const links = {};
      if (jD.ok && Array.isArray(jD.data)) {
        for (const row of jD.data) {
          const pid = Number(row.promedio_id);
          const aid = Number(row.actividad_id);
          if (pid && aid) {
            if (!links[pid]) links[pid] = [];
            links[pid].push(aid);
          }
        }
      }
      setPromLinks(links);
    } catch (e) {
      setActividades([]);
      setNotas({});
    }
  }, [seleccion, actividadSel]);

  useEffect(() => {
    if (!seleccion || !seleccion.cursoId || !seleccion.gradoId) return;
    cargarAlumnos();
    cargarActividades();
  }, [seleccion, cargarAlumnos, cargarActividades]);

  

  const agregarActividad = () => {
    setAddActName('');
    setAddActOpen(true);
  };

  const confirmarAgregarActividad = async () => {
    if (!addActName.trim()) return;
    try {
      const resp = await fetch(api('/api/curso-actividades'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curso_id: seleccion.cursoId, grado_id: seleccion.gradoId, seccion_id: seleccion.seccionId, nombre: addActName.trim() })
      });
      const json = await resp.json();
      if (resp.ok && json.ok) { await cargarActividades(); setAddActOpen(false); }
    } catch (e) {}
  };

  const abrirPromedios = () => {
    setPromNombre('');
    setPromSeleccion([]);
    setPromOpen(true);
  };

  const toggleSeleccion = (id) => {
    setPromSeleccion(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const calcularPromedio = async () => {
    if (!promNombre.trim()) { setAlertInfo({ open: true, title: 'Atención', msg: 'Ingresa un nombre para el promedio' }); return; }
    if (promSeleccion.length === 0) { setAlertInfo({ open: true, title: 'Atención', msg: 'Selecciona al menos una actividad' }); return; }
    try {
      const resp = await fetch(api('/api/curso-actividades'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curso_id: seleccion.cursoId, grado_id: seleccion.gradoId, seccion_id: seleccion.seccionId, nombre: promNombre.trim() })
      });
      const json = await resp.json();
      if (!(resp.ok && json.ok && json.id)) { setAlertInfo({ open: true, title: 'Error', msg: 'No se pudo crear la actividad de promedio' }); return; }
      const nuevaId = json.id;
      const payload = [];
      for (const a of alumnos) {
        let suma = 0;
        for (const actId of promSeleccion) {
          const raw = (notas[actId] && notas[actId][a.dni]) !== undefined ? notas[actId][a.dni] : '';
          const n = raw === '' || raw == null ? 0 : Number(raw);
          suma += isNaN(n) ? 0 : n;
        }
        const denom = promSeleccion.length;
        const prom = denom > 0 ? Math.round((suma / denom) * 100) / 100 : 0;
        payload.push({ dni: a.dni, nota: prom });
      }
      await fetch(api('/api/actividad-notas/bulk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actividad_id: nuevaId, notas: payload })
      });

      // Guardar dependencias en BD
      await fetch(api('/api/promedio-detalle'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promedio_id: nuevaId, actividades_ids: promSeleccion })
      });

      setPromLinks(prev => ({ ...prev, [nuevaId]: [...promSeleccion] }));
      setPromOpen(false);
      await cargarActividades();
    } catch (e) {
      setAlertInfo({ open: true, title: 'Error', msg: 'Error calculando promedio' });
    }
  };

  const esPromedioPorNombre = (nombre) => {
    const s = String(nombre || '').trim().toUpperCase();
    if (!s) return false;
    if (s.includes('PROMEDIO')) return true;
    return /^UNIDAD\s*\d+$/i.test(s);
  };

  const onChangeNota = (actividadId, dni, val) => {
    // Validar solo números y punto decimal
    if (!/^\d*\.?\d*$/.test(val)) return;

    // Validar rango 0-20
    if (val !== '') {
      const n = parseFloat(val);
      if (n > 20) val = '20';
    }

    setNotas(prev => {
      const next = { ...prev, [actividadId]: { ...(prev[actividadId] || {}), [dni]: val } };
      for (const [pid, srcs] of Object.entries(promLinks)) {
        if (srcs.includes(actividadId)) {
          let suma = 0;
          for (const srcId of srcs) {
            const raw = (srcId === actividadId ? val : (next[srcId] && next[srcId][dni]));
            const n = (raw === '' || raw == null) ? 0 : Number(raw);
            suma += isNaN(n) ? 0 : n;
          }
          const denom = srcs.length;
          const prom = denom > 0 ? Math.round((suma / denom) * 100) / 100 : 0;
          next[Number(pid)] = { ...(next[Number(pid)] || {}), [dni]: prom };
        }
      }
      return next;
    });
  };

  const guardarNotas = async () => {
    for (const act of actividades) {
      const m = notas[act.id] || {};
      const payload = [];
      for (const a of alumnos) {
        const v = m[a.dni];
        if (v !== undefined) payload.push({ dni: a.dni, nota: v === '' ? null : Number(v) });
      }
      if (payload.length > 0) {
        await fetch(api('/api/actividad-notas/bulk'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actividad_id: act.id, notas: payload })
        });
      }
    }
    setAlertInfo({ open: true, title: 'Éxito', msg: 'Notas guardadas correctamente' });
  };

  const confirmarEliminarActividad = async () => {
    if (!actividadSel) { setDelOpen(false); return; }

    try {
      const resp = await fetch(api(`/api/curso-actividades/${actividadSel}`), { method: 'DELETE' });
      const json = await resp.json();
      
      if (resp.ok && json.ok) {
        // Simulación de estado para recálculo en cascada
        const currentNotas = { ...notas };
        const changesToSave = {}; // { pid: payload[] }
        let queue = [actividadSel];
        const processed = new Set();

        let head = 0;
        while(head < queue.length) {
          const changedId = queue[head++];
          if (processed.has(changedId) && changedId !== actividadSel) continue;
          if (changedId !== actividadSel) processed.add(changedId);

          for (const [pidStr, srcs] of Object.entries(promLinks)) {
            const pid = Number(pidStr);
            if (srcs.includes(changedId)) {
              // Filtrar la actividad eliminada (si es la que se eliminó)
              const effectiveSrcs = srcs.filter(id => id !== actividadSel);
              
              const newVals = {};
              let hasChanges = false;
              
              for (const a of alumnos) {
                let suma = 0;
                for (const srcId of effectiveSrcs) {
                  const raw = (currentNotas[srcId] && currentNotas[srcId][a.dni]);
                  const n = (raw === '' || raw == null) ? 0 : Number(raw);
                  suma += isNaN(n) ? 0 : n;
                }
                const denom = effectiveSrcs.length;
                const prom = denom > 0 ? Math.round((suma / denom) * 100) / 100 : 0;
                
                newVals[a.dni] = prom;
                
                const prev = (currentNotas[pid] && currentNotas[pid][a.dni]);
                if (prev !== prom) hasChanges = true;
              }
              
              // Si hubo cambios o es dependencia directa del eliminado (para asegurar consistencia)
              if (hasChanges || changedId === actividadSel) {
                const payload = [];
                for (const [dni, nota] of Object.entries(newVals)) {
                   payload.push({ dni, nota });
                }
                changesToSave[pid] = payload;
                currentNotas[pid] = newVals;
                if (!queue.includes(pid)) queue.push(pid);
              }
            }
          }
        }

        // Guardar todos los cambios acumulados
        for (const [pid, payload] of Object.entries(changesToSave)) {
           if (payload.length > 0) {
            await fetch(api('/api/actividad-notas/bulk'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ actividad_id: Number(pid), notas: payload })
            });
           }
        }

        setDelOpen(false);
        await cargarActividades();
      } else {
        setDelOpen(false);
      }
    } catch (e) { setDelOpen(false); }
  };

  const focusInput = (actividadId, dni) => {
    const el = document.getElementById(`nota-${actividadId}-${dni}`);
    if (el) el.focus();
  };

  return (
    <>
      <h1>Registro de Notas</h1>
      <p>{seleccion ? `${seleccion.cursoNombre} - ${seleccion.gradoNombre}${seleccion.seccionNombre ? ` ${seleccion.seccionNombre}` : ''}` : ''}</p>
      <div className="notas-form">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={agregarActividad} disabled={loading}>Agregar actividad/práctica</button>
          <span>
            <label style={{ marginRight: 8 }}>Actividad:</label>
            <select value={actividadSel || ''} onChange={e => setActividadSel(Number(e.target.value) || null)}>
              {actividades.map(a => (<option key={a.id} value={a.id}>{a.nombre}</option>))}
            </select>
          </span>
          <button onClick={() => setDelOpen(true)} disabled={!actividadSel || loading}>Eliminar actividad</button>
          <button onClick={abrirPromedios} disabled={actividades.length === 0 || loading}>Promedios</button>
          <button onClick={guardarNotas} disabled={loading}>Guardar notas</button>
        </div>
        <div className="estudiantes-table" style={{ marginTop: 16 }}>
          <div className="table-scroll">
            <div className={`scroll-area${actividades.length === 0 ? ' no-activities' : ''}`}>
              <table>
                <thead>
                  <tr>
                    <th className="sticky-col sticky-col-1">DNI</th>
                    <th className="sticky-col sticky-col-2">Apellidos</th>
                    <th className="sticky-col sticky-col-3">Nombres</th>
                    {actividades.map(act => (<th key={act.id}>{act.nombre}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map((a, rowIndex) => (
                    <tr key={a.dni}>
                      <td className="sticky-col sticky-col-1">{a.dni}</td>
                      <td className="sticky-col sticky-col-2">{a.apellidos}</td>
                      <td className="sticky-col sticky-col-3">{a.nombres}</td>
                      {actividades.map(act => (
                        <td key={act.id + ':' + a.dni}>
                          <input
                            id={`nota-${act.id}-${a.dni}`}
                            type="text"
                            inputMode="decimal"
                            value={(notas[act.id] && notas[act.id][a.dni]) !== undefined ? notas[act.id][a.dni] : ''}
                            onChange={e => onChangeNota(act.id, a.dni, e.target.value)}
                            className="nota-input"
                            disabled={Boolean(promLinks[act.id]) || esPromedioPorNombre(act.nombre)}
                            autoComplete="off"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const next = alumnos[rowIndex + 1];
                                if (next) focusInput(act.id, next.dni);
                              }
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {alumnos.length === 0 && (
                    <tr><td colSpan={3 + actividades.length}>Sin alumnos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {promOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Crear promedio</h3>
              <button className="close" onClick={() => setPromOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <label style={{ marginRight: 8 }}>Nombre del promedio:</label>
                <input type="text" value={promNombre} onChange={e => setPromNombre(e.target.value)} />
              </div>
              <div>
                <p>Selecciona actividades a promediar:</p>
                <div className="activities-list">
                  {actividades.map(a => (
                    <label key={a.id} className="activity-item">
                      <input type="checkbox" checked={promSeleccion.includes(a.id)} onChange={() => toggleSeleccion(a.id)} />
                      <span>{a.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button onClick={calcularPromedio}>Calcular y crear</button>
                <button onClick={() => setPromOpen(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {delOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Confirmar eliminación</h3>
              <button className="close" onClick={() => setDelOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>¿Eliminar la actividad seleccionada y sus notas?</p>
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button onClick={confirmarEliminarActividad}>Eliminar</button>
                <button onClick={() => setDelOpen(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alerta Genérica */}
      {alertInfo.open && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{alertInfo.title}</h3>
              <button className="close" onClick={() => setAlertInfo({ ...alertInfo, open: false })}>×</button>
            </div>
            <div className="modal-body">
              <p>{alertInfo.msg}</p>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setAlertInfo({ ...alertInfo, open: false })}>Aceptar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Agregar Actividad */}
      {addActOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Nueva actividad</h3>
              <button className="close" onClick={() => setAddActOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 8 }}>Nombre de la actividad/práctica:</p>
              <input 
                type="text" 
                value={addActName} 
                onChange={e => setAddActName(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && confirmarAgregarActividad()}
                placeholder="Ej. Práctica 1"
              />
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button onClick={confirmarAgregarActividad}>Crear</button>
                <button onClick={() => setAddActOpen(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
