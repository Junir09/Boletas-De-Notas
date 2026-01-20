import React, { useEffect, useState } from 'react';
import '../assets/css/admin/lista-estudiantes.css';
import { api } from '../api';
import { Trash2, Edit, Save, X, AlertTriangle, Check, Info } from 'lucide-react';

function ListaEstudiantes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [modal, setModal] = useState({ 
    open: false, 
    type: '', // 'confirm', 'success', 'error'
    title: '', 
    message: '',
    onConfirm: null 
  });

  // Filtros
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');

  // Edición
  const [editingDni, setEditingDni] = useState('');
  const [editData, setEditData] = useState({ apellidos: '', nombres: '', grado: '', seccion: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Cargar estudiantes
        const resp = await fetch(api('/api/estudiantes'));
        const json = await resp.json();
        if (!resp.ok || !json.ok) throw new Error(json.error || 'Error al cargar estudiantes');
        setData(Array.isArray(json.data) ? json.data : []);

        // Cargar grados
        const respGrados = await fetch(api('/api/grados'));
        const jsonGrados = await respGrados.json();
        if (jsonGrados.ok && Array.isArray(jsonGrados.data)) {
          setGrados(jsonGrados.data);
        }

        // Cargar secciones
        const respSecciones = await fetch(api('/api/secciones'));
        const jsonSecciones = await respSecciones.json();
        if (jsonSecciones.ok && Array.isArray(jsonSecciones.data)) {
          setSecciones(jsonSecciones.data);
        }

      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshData = async () => {
    try {
      const resp = await fetch(api('/api/estudiantes'));
      const json = await resp.json();
      if (json.ok) setData(Array.isArray(json.data) ? json.data : []);
    } catch (_) {}
  };

  // Filtrado local
  const filteredData = data.filter(e => {
    if (filtroGrado && String(e.grado) !== String(filtroGrado)) return false;
    if (filtroSeccion && e.seccion !== filtroSeccion) return false;
    return true;
  });

  // Eliminar un estudiante
  const handleDelete = (dni) => {
    setModal({
      open: true,
      type: 'confirm',
      title: '¿Eliminar estudiante?',
      message: '¿Estás seguro de que deseas eliminar este estudiante? Esta acción no se puede deshacer.',
      onConfirm: () => executeDelete(dni)
    });
  };

  const executeDelete = async (dni) => {
    try {
      const resp = await fetch(api(`/api/estudiantes/${dni}`), { method: 'DELETE' });
      const json = await resp.json();
      if (resp.ok && json.ok) {
        setData(prev => prev.filter(e => e.dni !== dni));
        setModal({
          open: true,
          type: 'success',
          title: 'Estudiante eliminado',
          message: 'El estudiante ha sido eliminado correctamente.',
          onConfirm: () => setModal(prev => ({ ...prev, open: false }))
        });
      } else {
        setModal({
          open: true,
          type: 'error',
          title: 'Error',
          message: json.error || 'Error al eliminar estudiante',
          onConfirm: () => setModal(prev => ({ ...prev, open: false }))
        });
      }
    } catch (e) {
      setModal({
        open: true,
        type: 'error',
        title: 'Error de conexión',
        message: e.message,
        onConfirm: () => setModal(prev => ({ ...prev, open: false }))
      });
    }
  };

  // Eliminar masivo
  const handleBulkDelete = () => {
    if (!filtroGrado && !filtroSeccion) return;
    
    let msg = '¿Estás seguro de eliminar TODOS los estudiantes ';
    if (filtroGrado && filtroSeccion) msg += `del grado ${filtroGrado}° sección ${filtroSeccion}?`;
    else if (filtroGrado) msg += `del grado ${filtroGrado}° (todas las secciones)?`;
    else if (filtroSeccion) msg += `de la sección ${filtroSeccion} (todos los grados)?`;
    
    msg += ' ESTA ACCIÓN ES IRREVERSIBLE.';

    setModal({
      open: true,
      type: 'confirm',
      title: '¿Eliminación Masiva?',
      message: msg,
      onConfirm: executeBulkDelete
    });
  };

  const executeBulkDelete = async () => {
    try {
      const query = new URLSearchParams();
      if (filtroGrado) query.append('grado', filtroGrado);
      if (filtroSeccion) query.append('seccion', filtroSeccion);

      const resp = await fetch(api(`/api/estudiantes-masivo?${query.toString()}`), { method: 'DELETE' });
      
      const text = await resp.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        if (text.trim().startsWith('<')) {
          throw new Error('El servidor no reconoce la nueva ruta. Por favor, REINICIE el servidor backend (node/nodemon).');
        }
        throw new Error('Respuesta inválida del servidor: ' + text.substring(0, 50));
      }
      
      if (resp.ok && json.ok) {
        refreshData();
        setModal({
          open: true,
          type: 'success',
          title: 'Eliminación completada',
          message: `Se eliminaron ${json.affected || 0} estudiantes.`,
          onConfirm: () => setModal(prev => ({ ...prev, open: false }))
        });
      } else {
        setModal({
          open: true,
          type: 'error',
          title: 'Error',
          message: json.error || 'Error al eliminar estudiantes',
          onConfirm: () => setModal(prev => ({ ...prev, open: false }))
        });
      }
    } catch (e) {
      setModal({
        open: true,
        type: 'error',
        title: 'Error de conexión',
        message: e.message,
        onConfirm: () => setModal(prev => ({ ...prev, open: false }))
      });
    }
  };

  // Iniciar edición
  const handleEdit = (student) => {
    setEditingDni(student.dni);
    setEditData({
      apellidos: student.apellidos || '',
      nombres: student.nombres || '',
      grado: student.grado || '',
      seccion: student.seccion || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingDni('');
    setEditData({ apellidos: '', nombres: '', grado: '', seccion: '' });
  };

  const handleSaveEdit = async () => {
    try {
      const resp = await fetch(api(`/api/estudiantes/${editingDni}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      const json = await resp.json();
      if (resp.ok && json.ok) {
        handleCancelEdit();
        refreshData();
        setModal({
          open: true,
          type: 'success',
          title: 'Estudiante actualizado',
          message: 'Los datos del estudiante se han actualizado correctamente.',
          onConfirm: () => setModal(prev => ({ ...prev, open: false }))
        });
      } else {
        setModal({
          open: true,
          type: 'error',
          title: 'Error',
          message: json.error || 'Error al actualizar estudiante',
          onConfirm: () => setModal(prev => ({ ...prev, open: false }))
        });
      }
    } catch (e) {
      setModal({
        open: true,
        type: 'error',
        title: 'Error de conexión',
        message: e.message,
        onConfirm: () => setModal(prev => ({ ...prev, open: false }))
      });
    }
  };

  return (
    <div className="lista-estudiantes">
      <h2>Lista de estudiantes</h2>
      
      {/* Barra de herramientas / Filtros */}
      <div className="toolbar">
        <div className="filters">
          <select value={filtroGrado} onChange={e => setFiltroGrado(e.target.value)}>
            <option value="">Todos los grados</option>
            {grados.map(g => (
              <option key={g.id} value={g.nombre.replace('°','').trim()}>{g.nombre}</option>
            ))}
          </select>
          <select value={filtroSeccion} onChange={e => setFiltroSeccion(e.target.value)}>
            <option value="">Todas las secciones</option>
            {secciones.map(s => (
              <option key={s.id} value={s.nombre}>{s.nombre}</option>
            ))}
          </select>
        </div>
        
        {(filtroGrado || filtroSeccion) && (
          <button className="btn-bulk-delete" onClick={handleBulkDelete} title="Eliminar estudiantes filtrados">
            <Trash2 size={16} style={{ marginRight: 6 }} />
            Eliminar Filtrados
          </button>
        )}
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p className="status-error">Error: {error}</p>}
      
      {!loading && !error && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>DNI</th>
                <th>Apellidos</th>
                <th>Nombres</th>
                <th>Grado</th>
                <th>Sección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((e) => {
                const isEditing = editingDni === e.dni;
                return (
                  <tr key={e.dni} className={isEditing ? 'editing-row' : ''}>
                    <td>{e.dni}</td>
                    
                    {/* Apellidos */}
                    <td>
                      {isEditing ? (
                        <input 
                          className="edit-input"
                          value={editData.apellidos}
                          onChange={ev => setEditData({...editData, apellidos: ev.target.value})}
                        />
                      ) : e.apellidos}
                    </td>

                    {/* Nombres */}
                    <td>
                      {isEditing ? (
                        <input 
                          className="edit-input"
                          value={editData.nombres}
                          onChange={ev => setEditData({...editData, nombres: ev.target.value})}
                        />
                      ) : e.nombres}
                    </td>

                    {/* Grado */}
                    <td>
                      {isEditing ? (
                        <select 
                          className="edit-input"
                          value={editData.grado} 
                          onChange={ev => setEditData({...editData, grado: ev.target.value})}
                        >
                          <option value="">-</option>
                          {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}°</option>)}
                        </select>
                      ) : (
                        e.grado ? <span className="badge-grado">{e.grado}°</span> : <span className="badge-sin-asignar">Sin asignar</span>
                      )}
                    </td>

                    {/* Sección */}
                    <td>
                      {isEditing ? (
                        <select 
                          className="edit-input"
                          value={editData.seccion} 
                          onChange={ev => setEditData({...editData, seccion: ev.target.value})}
                        >
                          <option value="">-</option>
                          {secciones.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                        </select>
                      ) : (
                        e.seccion ? <span className="badge-seccion">{e.seccion}</span> : <span className="badge-sin-asignar">Sin asignar</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td>
                      <div className="actions-cell">
                        {isEditing ? (
                          <>
                            <button className="btn-icon btn-save" onClick={handleSaveEdit} title="Guardar">
                              <Save size={18} />
                            </button>
                            <button className="btn-icon btn-cancel" onClick={handleCancelEdit} title="Cancelar">
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="btn-icon btn-edit" onClick={() => handleEdit(e)} title="Editar">
                              <Edit size={18} />
                            </button>
                            <button className="btn-icon btn-delete" onClick={() => handleDelete(e.dni)} title="Eliminar">
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">No hay estudiantes que coincidan con el filtro.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {modal.open && (
        <div className="lista-estudiantes-modal-overlay">
          <div className="lista-estudiantes-modal-card">
            <div className={`lista-estudiantes-modal-icon ${modal.type}`}>
              {modal.type === 'success' && <Check size={32} />}
              {(modal.type === 'error' || modal.type === 'confirm') && <AlertTriangle size={32} />}
            </div>
            <h3>{modal.title}</h3>
            <p>{modal.message}</p>
            <div className="lista-estudiantes-modal-actions">
              {modal.type === 'confirm' ? (
                <>
                  <button className="btn-secondary" onClick={() => setModal(prev => ({ ...prev, open: false }))}>Cancelar</button>
                  <button className="btn-danger" onClick={modal.onConfirm}>Confirmar</button>
                </>
              ) : (
                <button className="btn-primary" onClick={modal.onConfirm}>Aceptar</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListaEstudiantes;