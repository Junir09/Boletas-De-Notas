import React, { useEffect, useState } from 'react';
import '../assets/css/admin/registrar-docentes.css';
import { api } from '../api';

function RegistrarDocentes() {
  const [dni, setDni] = useState('');
  const [apellidosNombres, setApellidosNombres] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [docentes, setDocentes] = useState([]);
  const [editingDni, setEditingDni] = useState('');
  const [editData, setEditData] = useState({ nombre: '', descripcion: '', password: '' });

  const cargarDocentes = async () => {
    try {
      const resp = await fetch(api('/api/docentes'));
      const json = await resp.json();
      if (resp.ok && json.ok) {
        setDocentes(Array.isArray(json.data) ? json.data : []);
      }
    } catch (_) {}
  };

  useEffect(() => { cargarDocentes(); }, []);

  const registrarDocente = async () => {
    const d = dni.trim();
    const full = apellidosNombres.trim();
    const desc = descripcion.trim();
    setError(''); setSuccess('');
    if (!d || !full) { setError('Completa DNI y Apellidos y nombres'); return; }
    if (!/^\d{8,}$/.test(d)) { setError('DNI debe tener 8 dígitos'); return; }
    try {
      const resp = await fetch(api('/api/docentes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: d, nombre: full, descripcion: desc || null })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) {
        setError(json.error || 'Error al registrar docente');
      } else {
        const passMsg = json.password ? ` Contraseña: ${json.password}` : '';
        setSuccess(`Docente registrado correctamente.${passMsg}`);
        setDni(''); setApellidosNombres(''); setDescripcion('');
        cargarDocentes();
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar al servidor');
    }
  };

  const iniciarEdicion = (d) => {
    const row = docentes.find(x => String(x.dni) === String(d));
    if (!row) return;
    setEditingDni(String(d));
    setEditData({ nombre: row.nombre || '', descripcion: row.descripcion || '', password: row.password || '' });
    setError(''); setSuccess('');
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
    if (Object.keys(body).length === 0) { setError('No hay cambios para guardar'); return; }
    try {
      const resp = await fetch(api(`/api/docentes/${encodeURIComponent(d)}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) {
        setError(json.error || 'Error al actualizar');
      } else {
        setSuccess('Docente actualizado');
        cancelarEdicion();
        cargarDocentes();
      }
    } catch (e) {
      setError('No se pudo conectar al servidor');
    }
  };

  const eliminarDocente = async (d) => {
    if (!window.confirm('¿Eliminar este docente? Se quitarán sus asignaciones.')) return;
    try {
      const resp = await fetch(api(`/api/docentes/${encodeURIComponent(d)}`), { method: 'DELETE' });
      const json = await resp.json();
      if (!resp.ok || !json.ok) {
        setError(json.error || 'No se pudo eliminar');
      } else {
        setSuccess('Docente eliminado');
        if (String(editingDni) === String(d)) cancelarEdicion();
        cargarDocentes();
      }
    } catch (_) {
      setError('No se pudo conectar al servidor');
    }
  };

  return (
    <div>
      <h2>Sistema De Registro De Docente</h2>
      <p>Registra al Docente en el Sistema</p>

      <div className="field">
        <label>DNI</label>
        <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} placeholder="DNI" inputMode="numeric" maxLength={8} />
      </div>
      <div className="field">
        <label>Apellido y nombre</label>
        <input type="text" value={apellidosNombres} onChange={(e) => setApellidosNombres(e.target.value)} placeholder="Apellidos y nombres" />
      </div>
      <div className="field">
        <label>Descripción o Cargo Del Docente(opcional)</label>
        <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" />
      </div>

      <div className="actions">
        <button type="button" onClick={registrarDocente}>Registrar</button>
      </div>

      {error && <div className="status-error">{error}</div>}
      {success && <div className="status-success">{success}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Contraseña</th>
              <th>Cursos asignados</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {docentes.length === 0 && (
              <tr><td colSpan={6}>No hay docentes registrados</td></tr>
            )}
            {docentes.map(row => (
              <tr key={row.dni}>
                <td>{row.dni}</td>
                <td>
                  {editingDni === row.dni ? (
                    <input className="edit-input" value={editData.nombre} onChange={e => setEditData({ ...editData, nombre: e.target.value })} />
                  ) : row.nombre}
                </td>
                <td>
                  {editingDni === row.dni ? (
                    <input className="edit-input" value={editData.descripcion} onChange={e => setEditData({ ...editData, descripcion: e.target.value })} />
                  ) : (row.descripcion || '')}
                </td>
                <td>
                  {editingDni === row.dni ? (
                    <input className="edit-input" value={editData.password} onChange={e => setEditData({ ...editData, password: e.target.value })} placeholder="Dejar vacío para no cambiar" />
                  ) : (row.password || '')}
                </td>
                <td>{row.cursos || ''}</td>
                <td>
                  <div className="inline-actions">
                    {editingDni === row.dni ? (
                      <>
                        <button type="button" onClick={guardarDocente}>Guardar</button>
                        <button type="button" onClick={cancelarEdicion}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => iniciarEdicion(row.dni)}>Editar</button>
                        <button type="button" onClick={() => eliminarDocente(row.dni)}>Eliminar</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RegistrarDocentes;