import React, { useEffect, useState } from 'react';
import '../assets/css/admin/lista-docentes.css';
import { api } from '../api';
import { Edit, Trash2, XCircle } from 'lucide-react';

function ListaDocentes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ visible: false, dni: '', cursos: [], selectedIds: [], error: '' });
  const [asignadosByDni, setAsignadosByDni] = useState({});
  const [loadingByDni, setLoadingByDni] = useState({});
  const [editingDni, setEditingDni] = useState('');
  const [editData, setEditData] = useState({ nombre: '', descripcion: '', password: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const resp = await fetch(api('/api/docentes'));
        const json = await resp.json();
        if (!resp.ok || !json.ok) {
          throw new Error(json.error || 'Error al cargar docentes');
        }
        setData(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const abrirModalAsignar = async (dni) => {
    try {
      setModal({ visible: true, dni, cursos: [], selectedIds: [], error: '' });
      const resp = await fetch(api('/api/cursos/disponibles'));
      const json = await resp.json();
      if (!resp.ok || !json.ok) throw new Error(json.error || 'Error al cargar cursos disponibles');
      const list = Array.isArray(json.data) ? json.data : [];
      setModal({ visible: true, dni, cursos: list, selectedIds: [], error: '' });
    } catch (e) {
      setModal({ visible: true, dni, cursos: [], selectedIds: [], error: e.message });
    }
  };

  const cerrarModal = () => setModal({ visible: false, dni: '', cursos: [], selectedIds: [], error: '' });

  const asignarUno = async (cid) => {
    const dni = modal.dni;
    const id = Number(cid || 0);
    if (!dni || !id) return;
    try {
      const resp = await fetch(api('/api/asignaciones'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, curso_id: id })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) throw new Error(json.error || 'Error al asignar');
      // refrescar lista de disponibles dentro del modal
      const r2 = await fetch(api('/api/cursos/disponibles'));
      const j2 = await r2.json();
      const list = (r2.ok && j2.ok && Array.isArray(j2.data)) ? j2.data : [];
      setModal(m => ({ ...m, cursos: list }));
      // refrescar lista de docentes
      const refresh = await fetch(api('/api/docentes'));
      const jdoc = await refresh.json();
      setData(Array.isArray(jdoc.data) ? jdoc.data : []);
      try { window.dispatchEvent(new Event('cursos-updated')); } catch (_) {}
    } catch (e) {
      setModal(m => ({ ...m, error: e.message }));
    }
  };

  const confirmarAsignacionMultiple = async () => {
    const dni = modal.dni;
    const ids = Array.isArray(modal.selectedIds) ? modal.selectedIds.filter(Boolean) : [];
    if (!dni || ids.length === 0) return;
    try {
      for (const cid of ids) {
        const resp = await fetch(api('/api/asignaciones'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dni, curso_id: cid })
        });
        const json = await resp.json();
        if (!resp.ok || !json.ok) throw new Error(json.error || 'Error al asignar');
      }
      cerrarModal();
      const refresh = await fetch(api('/api/docentes'));
      const j2 = await refresh.json();
      setData(Array.isArray(j2.data) ? j2.data : []);
      try { window.dispatchEvent(new Event('cursos-updated')); } catch (_) {}
    } catch (e) {
      setModal(m => ({ ...m, error: e.message }));
    }
  };

  const iniciarEdicion = (row) => {
    setEditingDni(row.dni);
    setEditData({ nombre: row.nombre || '', descripcion: row.descripcion || '', password: '' });
  };

  const cancelarEdicion = () => {
    setEditingDni('');
    setEditData({ nombre: '', descripcion: '', password: '' });
  };

  const guardarDocente = async () => {
    const d = String(editingDni || '').trim();
    if (!d) return;
    const body = {};
    if (editData.nombre && editData.nombre.trim()) body.nombre = editData.nombre.trim();
    if (typeof editData.descripcion === 'string') body.descripcion = editData.descripcion.trim();
    if (editData.password && editData.password.trim()) body.password = editData.password.trim();
    if (Object.keys(body).length === 0) return;
    try {
      const resp = await fetch(api(`/api/docentes/${encodeURIComponent(d)}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) return;
      cancelarEdicion();
      const refresh = await fetch(api('/api/docentes'));
      const j2 = await refresh.json();
      setData(Array.isArray(j2.data) ? j2.data : []);
    } catch (_) {}
  };

  const eliminarDocente = async (dni) => {
    if (!window.confirm('¿Eliminar este docente? Se quitarán sus asignaciones.')) return;
    try {
      const resp = await fetch(api(`/api/docentes/${encodeURIComponent(dni)}`), { method: 'DELETE' });
      const json = await resp.json();
      if (!resp.ok || !json.ok) return;
      if (editingDni === dni) cancelarEdicion();
      const refresh = await fetch(api('/api/docentes'));
      const j2 = await refresh.json();
      setData(Array.isArray(j2.data) ? j2.data : []);
      try { window.dispatchEvent(new Event('cursos-updated')); } catch (_) {}
    } catch (_) {}
  };

  const cargarAsignados = async (dni) => {
    try {
      setLoadingByDni(s => ({ ...s, [dni]: true }));
      const resp = await fetch(api(`/api/docentes/${dni}/cursos`));
      const json = await resp.json();
      const list = (resp.ok && json.ok && Array.isArray(json.data)) ? json.data : [];
      setAsignadosByDni(m => ({ ...m, [dni]: list }));
    } catch (e) {
      setAsignadosByDni(m => ({ ...m, [dni]: [] }));
    } finally {
      setLoadingByDni(s => ({ ...s, [dni]: false }));
    }
  };

  const quitarAsignacionX = async (dni, cursoId) => {
    try {
      const resp = await fetch(api('/api/asignaciones'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, curso_id: Number(cursoId) })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) throw new Error(json.error || 'No se pudo quitar asignación');
      setAsignadosByDni(m => ({ ...m, [dni]: (m[dni] || []).filter(c => c.id !== cursoId) }));
      const refresh = await fetch(api('/api/docentes'));
      const j2 = await refresh.json();
      setData(Array.isArray(j2.data) ? j2.data : []);
      try { window.dispatchEvent(new Event('cursos-updated')); } catch (_) {}
    } catch (e) {
      // opcional: manejar error visual por fila
    }
  };

  return (
    <div className="lista-docentes">
      <h2>Lista de docentes</h2>
      {loading && <p>Cargando...</p>}
      {error && <p className="status-error">Error: {error}</p>}
      {!loading && !error && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>DNI</th>
                <th>Nombre completo</th>
                <th>Descripción</th>
                <th>Cursos</th>
                <th>Contraseña</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <>
                  <tr key={d.dni}>
                    <td>{d.dni}</td>
                <td>
                  {editingDni === d.dni ? (
                    <input className="edit-input" value={editData.nombre} onChange={e => setEditData({ ...editData, nombre: e.target.value })} />
                  ) : d.nombre}
                </td>
                <td>
                  {editingDni === d.dni ? (
                    <input className="edit-input" value={editData.descripcion} onChange={e => setEditData({ ...editData, descripcion: e.target.value })} />
                  ) : (d.descripcion || '')}
                </td>
                <td>
                  {Array.isArray(asignadosByDni[d.dni]) ? (
                    asignadosByDni[d.dni].length > 0 ? (
                      <div className="inline-actions">
                        {asignadosByDni[d.dni].map(c => (
                          <span key={c.id}>
                            {c.nombre}
                            <button type="button" onClick={() => quitarAsignacionX(d.dni, c.id)} title="Quitar">
                              <XCircle size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span>(Sin cursos)</span>
                    )
                  ) : (
                    <div className="inline-actions">
                      <span>{d.cursos || ''}</span>
                      <button type="button" onClick={() => cargarAsignados(d.dni)} disabled={!!loadingByDni[d.dni]} title={loadingByDni[d.dni] ? 'Cargando...' : 'Editar'}>
                        <Edit size={16} />
                      </button>
                    </div>
                  )}
                </td>
                <td>
                  {editingDni === d.dni ? (
                    <input className="edit-input" value={editData.password} onChange={e => setEditData({ ...editData, password: e.target.value })} placeholder="Dejar vacío para no cambiar" />
                  ) : (d.password || '')}
                </td>
                <td>
                      {editingDni === d.dni ? (
                        <>
                          <button type="button" onClick={guardarDocente}>Guardar</button>
                          <button type="button" onClick={cancelarEdicion}>Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => iniciarEdicion(d)} title="Editar">
                            <Edit size={16} />
                          </button>
                          <button type="button" onClick={() => eliminarDocente(d.dni)} title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                          <button type="button" onClick={() => abrirModalAsignar(d.dni)}>Asignar cursos</button>
                        </>
                      )}
                </td>
                  </tr>
                  
                </>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">No hay docentes registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {modal.visible && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h4>Asignar curso</h4>
            {modal.error && <p className="status-error">{modal.error}</p>}
            {modal.cursos.length > 0 ? (
              <div>
                {modal.cursos.map(c => (
                  <div key={c.id} className="inline-actions">
                    <input
                      type="checkbox"
                      checked={modal.selectedIds.includes(c.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setModal(m => {
                          const set = new Set(m.selectedIds);
                          if (checked) set.add(c.id); else set.delete(c.id);
                          return { ...m, selectedIds: Array.from(set) };
                        });
                      }}
                    />
                    <span>{c.nombre}</span>
                    <button type="button" onClick={() => asignarUno(c.id)}>Asignar</button>
                  </div>
                ))}
              </div>
            ) : (
              <p>No hay cursos disponibles</p>
            )}
            <div className="modal-actions">
              <button type="button" onClick={cerrarModal}>Cerrar</button>
              <button type="button" onClick={confirmarAsignacionMultiple} disabled={!modal.selectedIds || modal.selectedIds.length === 0}>Asignar seleccionados</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListaDocentes;