import React, { useEffect, useState } from 'react';
import { api } from '../api';

function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [nombreCurso, setNombreCurso] = useState('');
  const [descripcionCurso, setDescripcionCurso] = useState('');
  const [dniDocente, setDniDocente] = useState('');
  const [cursoIdAsignar, setCursoIdAsignar] = useState(0);
  const [modal, setModal] = useState({ visible: false, type: 'success', message: '' });

  const closeModal = () => setModal({ visible: false, type: 'success', message: '' });

  const cargarDatos = async () => {
    try {
      const [rc, rd] = await Promise.all([
        fetch(api('/api/cursos/disponibles')),
        fetch(api('/api/docentes')),
      ]);
      const jc = await rc.json();
      const jd = await rd.json();
      setCursos(jc.ok && Array.isArray(jc.data) ? jc.data : []);
      setDocentes(jd.ok && Array.isArray(jd.data) ? jd.data : []);
    } catch (e) {
      setModal({ visible: true, type: 'error', message: 'No se pudo cargar cursos o docentes' });
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const crearCurso = async () => {
    const nombre = String(nombreCurso || '').trim();
    const descripcion = String(descripcionCurso || '').trim();
    if (!nombre) { setModal({ visible: true, type: 'error', message: 'Ingresa nombre del curso' }); return; }
    try {
      const resp = await fetch(api('/api/cursos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion: descripcion || null })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setModal({ visible: true, type: 'error', message: json.error || 'Error al crear curso' }); return; }
      setNombreCurso(''); setDescripcionCurso('');
      await cargarDatos();
      setModal({ visible: true, type: 'success', message: 'Curso creado' });
    } catch (e) {
      setModal({ visible: true, type: 'error', message: 'No se pudo crear curso' });
    }
  };

  const asignarCurso = async () => {
    const dni = String(dniDocente || '').trim();
    const cid = Number(cursoIdAsignar || 0);
    if (!dni || !cid) { setModal({ visible: true, type: 'error', message: 'Selecciona docente y curso' }); return; }
    try {
      const resp = await fetch(api('/api/asignaciones'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, curso_id: cid })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setModal({ visible: true, type: 'error', message: json.error || 'Error al asignar' }); return; }
      setModal({ visible: true, type: 'success', message: 'Asignación realizada' });
    } catch (e) {
      setModal({ visible: true, type: 'error', message: 'No se pudo asignar curso' });
    }
  };

  return (
    <div>
      <h2>Gestión de Cursos</h2>
      <div className="field">
        <label>Nombre del curso</label>
        <input type="text" value={nombreCurso} onChange={(e) => setNombreCurso(e.target.value)} placeholder="Nombre" />
      </div>
      <div className="field">
        <label>Descripción (opcional)</label>
        <input type="text" value={descripcionCurso} onChange={(e) => setDescripcionCurso(e.target.value)} placeholder="Descripción" />
      </div>
      <div className="actions" style={{ display: 'flex', gap: '1rem' }}>
        <button type="button" onClick={crearCurso}>Crear curso</button>
      </div>

      <hr style={{ margin: '16px 0' }} />

      <h3>Asignar curso a docente</h3>
      <div className="field">
        <label>Docente</label>
        <select value={dniDocente} onChange={(e) => setDniDocente(e.target.value)}>
          <option value="">Selecciona docente</option>
          {docentes.map(d => (
            <option key={d.dni} value={d.dni}>{d.nombre} ({d.dni})</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Curso</label>
        <select value={cursoIdAsignar || ''} onChange={(e) => setCursoIdAsignar(Number(e.target.value) || 0)}>
          <option value="">Selecciona curso</option>
          {cursos.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>
      <div className="actions" style={{ display: 'flex', gap: '1rem' }}>
        <button type="button" onClick={asignarCurso}>Asignar</button>
      </div>

      {modal.visible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '1rem 1.25rem', borderRadius: 6, minWidth: 280, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h4 style={{ marginTop: 0 }}>{modal.type === 'success' ? 'Operación exitosa' : 'Error'}</h4>
            <p style={{ marginBottom: '1rem' }}>{modal.message}</p>
            <div style={{ textAlign: 'right' }}>
              <button type="button" onClick={closeModal}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cursos;