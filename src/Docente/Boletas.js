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
  const scrollRef = useRef(null);
  const [scrollMax, setScrollMax] = useState(0);
  const [scrollVal, setScrollVal] = useState(0);
  const [delOpen, setDelOpen] = useState(false);
  const [promLinks, setPromLinks] = useState({});
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);

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

  

  const agregarActividad = async () => {
    const nombre = prompt('Nombre de la actividad/práctica');
    if (!nombre) return;
    try {
      const resp = await fetch(api('/api/curso-actividades'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curso_id: seleccion.cursoId, grado_id: seleccion.gradoId, seccion_id: seleccion.seccionId, nombre })
      });
      const json = await resp.json();
      if (resp.ok && json.ok) { await cargarActividades(); }
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
    if (!promNombre.trim()) { alert('Ingresa un nombre para el promedio'); return; }
    if (promSeleccion.length === 0) { alert('Selecciona al menos una actividad'); return; }
    try {
      const resp = await fetch(api('/api/curso-actividades'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curso_id: seleccion.cursoId, grado_id: seleccion.gradoId, seccion_id: seleccion.seccionId, nombre: promNombre.trim() })
      });
      const json = await resp.json();
      if (!(resp.ok && json.ok && json.id)) { alert('No se pudo crear la actividad de promedio'); return; }
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
      setPromLinks(prev => ({ ...prev, [nuevaId]: [...promSeleccion] }));
      setPromOpen(false);
      await cargarActividades();
    } catch (e) {
      alert('Error calculando promedio');
    }
  };

  const esPromedioPorNombre = (nombre) => {
    const s = String(nombre || '').trim().toUpperCase();
    if (!s) return false;
    if (s.includes('PROMEDIO')) return true;
    return /^UNIDAD\s*\d+$/i.test(s);
  };

  const clamp20 = (v) => {
    const n = Number(v);
    if (isNaN(n)) return '';
    const c = Math.max(0, Math.min(20, n));
    return Math.round(c * 100) / 100;
  };

  const onChangeNota = (actividadId, dni, val) => {
    const clamped = clamp20(val);
    setNotas(prev => {
      const next = { ...prev, [actividadId]: { ...(prev[actividadId] || {}), [dni]: clamped } };
      for (const [pid, srcs] of Object.entries(promLinks)) {
        if (srcs.includes(actividadId)) {
          let suma = 0;
          for (const srcId of srcs) {
            const raw = (srcId === actividadId ? clamped : (next[srcId] && next[srcId][dni])) !== undefined ? (srcId === actividadId ? clamped : (next[srcId] && next[srcId][dni])) : '';
            const n = Number(raw);
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
    alert('Notas guardadas');
  };

  const confirmarEliminarActividad = async () => {
    if (!actividadSel) { setDelOpen(false); return; }
    try {
      const resp = await fetch(api(`/api/curso-actividades/${actividadSel}`), { method: 'DELETE' });
      const json = await resp.json();
      if (resp.ok && json.ok) {
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

  useEffect(() => {
    const updateScroll = () => {
      if (!scrollRef.current) return;
      const max = Math.max(0, scrollRef.current.scrollWidth - scrollRef.current.clientWidth);
      setScrollMax(max);
      const left = scrollRef.current.scrollLeft;
      setScrollVal(left);
      const pc = Math.max(1, Math.ceil(scrollRef.current.scrollWidth / scrollRef.current.clientWidth));
      setPageCount(pc);
      const cp = Math.round(left / scrollRef.current.clientWidth);
      setCurrentPage(Math.min(pc - 1, Math.max(0, cp)));
    };
    updateScroll();
    window.addEventListener('resize', updateScroll);
    return () => window.removeEventListener('resize', updateScroll);
  }, [actividades, alumnos]);

  const goToPage = (p) => {
    if (!scrollRef.current) return;
    const c = Math.min(pageCount - 1, Math.max(0, p));
    const left = c * scrollRef.current.clientWidth;
    try {
      scrollRef.current.scrollTo({ left, behavior: 'smooth' });
    } catch (_) {
      scrollRef.current.scrollLeft = left;
    }
    setCurrentPage(c);
    setScrollVal(left);
  };

  const prevPage = () => goToPage(currentPage - 1);
  const nextPage = () => goToPage(currentPage + 1);

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
            <div className="scroll-area" ref={scrollRef} onScroll={() => {
              const el = scrollRef.current;
              const left = el ? el.scrollLeft : 0;
              setScrollVal(left);
              if (el) {
                const cp = Math.round(left / el.clientWidth);
                setCurrentPage(Math.min(pageCount - 1, Math.max(0, cp)));
              }
            }}>
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
                            type="number"
                            step="0.01"
                            min="0"
                            max="20"
                            value={(notas[act.id] && notas[act.id][a.dni]) !== undefined ? notas[act.id][a.dni] : ''}
                            onChange={e => onChangeNota(act.id, a.dni, e.target.value)}
                            onBlur={e => onChangeNota(act.id, a.dni, e.target.value)}
                            className="nota-input"
                            disabled={Boolean(promLinks[act.id]) || esPromedioPorNombre(act.nombre)}
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
            {actividades.length > 0 && scrollMax > 0 && (
              <div className="scroll-controls">
                <button onClick={prevPage} disabled={currentPage <= 0}>◀</button>
                <input
                  type="range"
                  className="scroll-slider"
                  min={0}
                  max={scrollMax}
                  value={scrollVal}
                  onChange={e => {
                    const v = Number(e.target.value);
                    setScrollVal(v);
                    if (scrollRef.current) {
                      scrollRef.current.scrollLeft = v;
                      const cp = Math.round(v / scrollRef.current.clientWidth);
                      setCurrentPage(Math.min(pageCount - 1, Math.max(0, cp)));
                    }
                  }}
                />
                <button onClick={nextPage} disabled={currentPage >= pageCount - 1}>▶</button>
                <span style={{ minWidth: 60, textAlign: 'center' }}>{`${currentPage + 1}/${pageCount}`}</span>
              </div>
            )}
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
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {actividades.map(a => (
                    <label key={a.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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
    </>
  );
}
