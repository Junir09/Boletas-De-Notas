import React, { useEffect, useState } from 'react';
import '../assets/css/admin/cursos.css';
import { api } from '../api';
import { Edit, Trash2 } from 'lucide-react';

function Cursos() {
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [nombreCurso, setNombreCurso] = useState('');
  const [descripcionCurso, setDescripcionCurso] = useState('');
  const [modal, setModal] = useState({ visible: false, type: 'success', message: '' });
  const [editId, setEditId] = useState(0);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');

  const closeModal = () => setModal({ visible: false, type: 'success', message: '' });

  const cargarDatos = async () => {
    try {
      const rDisp = await fetch(api('/api/cursos/disponibles'));
      const jDisp = await rDisp.json();
      setCursosDisponibles(jDisp.ok && Array.isArray(jDisp.data) ? jDisp.data : []);
    } catch (e) {
      setModal({ visible: true, type: 'error', message: 'No se pudo cargar cursos' });
    }
  };

  useEffect(() => { cargarDatos(); }, []);
  useEffect(() => {
    const onUpdate = () => { cargarDatos(); };
    const onFocus = () => { cargarDatos(); };
    window.addEventListener('cursos-updated', onUpdate);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('cursos-updated', onUpdate);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

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

  

  const iniciarEdicion = (c) => {
    setEditId(c.id);
    setEditNombre(c.nombre);
    setEditDescripcion(c.descripcion || '');
  };

  const cancelarEdicion = () => {
    setEditId(0);
    setEditNombre('');
    setEditDescripcion('');
  };

  const guardarEdicion = async () => {
    const id = Number(editId || 0);
    const nombre = String(editNombre || '').trim();
    const descripcion = String(editDescripcion || '').trim();
    if (!id || !nombre) { setModal({ visible: true, type: 'error', message: 'Ingresa nombre' }); return; }
    try {
      const resp = await fetch(api(`/api/cursos/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion: descripcion || null })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setModal({ visible: true, type: 'error', message: json.error || 'Error al actualizar' }); return; }
      await cargarDatos();
      cancelarEdicion();
      setModal({ visible: true, type: 'success', message: 'Curso actualizado' });
    } catch (e) {
      setModal({ visible: true, type: 'error', message: 'No se pudo actualizar' });
    }
  };

  const eliminarCurso = async (id) => {
    const cid = Number(id || 0);
    if (!cid) return;
    try {
      const resp = await fetch(api(`/api/cursos/${cid}`), { method: 'DELETE' });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setModal({ visible: true, type: 'error', message: json.error || 'Error al eliminar' }); return; }
      await cargarDatos();
      setModal({ visible: true, type: 'success', message: 'Curso eliminado' });
    } catch (e) {
      setModal({ visible: true, type: 'error', message: 'No se pudo eliminar' });
    }
  };

  return (
    <div className="cursos">
      <h2>Gestión de Cursos</h2>
      <div className="field">
        <label>Nombre del curso</label>
        <input type="text" value={nombreCurso} onChange={(e) => setNombreCurso(e.target.value)} placeholder="Nombre" />
      </div>
      <div className="field">
        <label>Descripción (opcional)</label>
        <input type="text" value={descripcionCurso} onChange={(e) => setDescripcionCurso(e.target.value)} placeholder="Descripción" />
      </div>
      <div className="actions actions-row">
        <button type="button" onClick={crearCurso}>Crear curso</button>
      </div>

      <hr className="divider" />

      <h3>Lista de cursos disponibles</h3>
      <div className="table">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cursosDisponibles.map(c => {
              const enEdicion = editId === c.id;
              return (
                <tr key={c.id}>
                  <td>
                    {enEdicion ? (
                      <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
                    ) : (
                      c.nombre
                    )}
                  </td>
                  <td>
                    {enEdicion ? (
                      <input type="text" value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} />
                    ) : (
                      c.descripcion || ''
                    )}
                  </td>
                  <td className="inline-actions">
                    {!enEdicion ? (
                      <button type="button" onClick={() => iniciarEdicion(c)} title="Editar">
                        <Edit size={16} />
                      </button>
                    ) : (
                      <>
                        <button type="button" onClick={guardarEdicion}>Guardar</button>
                        <button type="button" onClick={cancelarEdicion}>Cancelar</button>
                      </>
                    )}
                    <button type="button" onClick={() => eliminarCurso(c.id)} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal.visible && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h4>{modal.type === 'success' ? 'Operación exitosa' : 'Error'}</h4>
            <p>{modal.message}</p>
            <div className="modal-actions">
              <button type="button" onClick={closeModal}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cursos;