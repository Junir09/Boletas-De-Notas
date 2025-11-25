import React, { useEffect, useState } from 'react';
import '../assets/css/admin/configuracion.css';
import { api } from '../api';
import { Edit, Trash2 } from 'lucide-react';

function ConfiguracionSistema() {
  const [welcomeTitle, setWelcomeTitle] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [status, setStatus] = useState('');
  
  // Grados
  const [grados, setGrados] = useState([]);
  const [nuevoGradoNumero, setNuevoGradoNumero] = useState('');
  const [nuevoGradoNombre, setNuevoGradoNombre] = useState('');
  const [editGradoId, setEditGradoId] = useState(0);
  const [editGradoNumero, setEditGradoNumero] = useState('');
  const [editGradoNombre, setEditGradoNombre] = useState('');
  
  // Secciones
  const [secciones, setSecciones] = useState([]);
  const [nuevaSeccion, setNuevaSeccion] = useState('');
  const [editSeccionId, setEditSeccionId] = useState(0);
  const [editSeccionNombre, setEditSeccionNombre] = useState('');

  useEffect(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem('config') || '{}');
      setWelcomeTitle(String(cfg.welcomeTitle || 'Bienvenidos Al Sistema de Boletas De Notas'));
      setLogoDataUrl(String(cfg.logoDataUrl || ''));
    } catch {
      setWelcomeTitle('Bienvenidos Al Sistema de Boletas De Notas');
      setLogoDataUrl('');
    }
    cargarGrados();
    cargarSecciones();
  }, []);

  const cargarGrados = async () => {
    try {
      const resp = await fetch(api('/api/grados'));
      const json = await resp.json();
      setGrados(json.ok && Array.isArray(json.data) ? json.data : []);
    } catch (_) {}
  };

  const cargarSecciones = async () => {
    try {
      const resp = await fetch(api('/api/secciones'));
      const json = await resp.json();
      setSecciones(json.ok && Array.isArray(json.data) ? json.data : []);
    } catch (_) {}
  };

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setLogoDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const guardar = () => {
    try {
      const cfg = { welcomeTitle: welcomeTitle.trim(), logoDataUrl: logoDataUrl || '' };
      localStorage.setItem('config', JSON.stringify(cfg));
      setStatus('Guardado');
      setTimeout(() => setStatus(''), 1500);
    } catch {
      setStatus('Error al guardar');
    }
  };

  const limpiarLogo = () => setLogoDataUrl('');

  // === GRADOS ===
  const crearGrado = async () => {
    const num = Number(nuevoGradoNumero);
    const nom = String(nuevoGradoNombre || '').trim();
    if (!num || num < 1 || !nom) { setStatus('Completa número y nombre del grado'); return; }
    try {
      const resp = await fetch(api('/api/grados'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: num, nombre: nom })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setStatus(json.error || 'Error al crear grado'); return; }
      setNuevoGradoNumero(''); setNuevoGradoNombre('');
      await cargarGrados();
      setStatus('Grado creado');
      setTimeout(() => setStatus(''), 1500);
    } catch (_) { setStatus('No se pudo crear grado'); }
  };

  const iniciarEdicionGrado = (g) => {
    setEditGradoId(g.id);
    setEditGradoNumero(String(g.numero));
    setEditGradoNombre(g.nombre);
  };

  const cancelarEdicionGrado = () => {
    setEditGradoId(0);
    setEditGradoNumero('');
    setEditGradoNombre('');
  };

  const guardarGrado = async () => {
    const id = Number(editGradoId);
    const num = Number(editGradoNumero);
    const nom = String(editGradoNombre || '').trim();
    if (!id || !num || !nom) return;
    try {
      const resp = await fetch(api(`/api/grados/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: num, nombre: nom })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setStatus(json.error || 'Error al actualizar'); return; }
      cancelarEdicionGrado();
      await cargarGrados();
      setStatus('Grado actualizado');
      setTimeout(() => setStatus(''), 1500);
    } catch (_) { setStatus('No se pudo actualizar'); }
  };

  const eliminarGrado = async (id) => {
    if (!window.confirm('¿Eliminar este grado?')) return;
    try {
      const resp = await fetch(api(`/api/grados/${id}`), { method: 'DELETE' });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setStatus(json.error || 'Error al eliminar'); return; }
      await cargarGrados();
      setStatus('Grado eliminado');
      setTimeout(() => setStatus(''), 1500);
    } catch (_) { setStatus('No se pudo eliminar'); }
  };

  // === SECCIONES ===
  const crearSeccion = async () => {
    const nom = String(nuevaSeccion || '').trim();
    if (!nom) { setStatus('Ingresa nombre de sección'); return; }
    try {
      const resp = await fetch(api('/api/secciones'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nom })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setStatus(json.error || 'Error al crear sección'); return; }
      setNuevaSeccion('');
      await cargarSecciones();
      setStatus('Sección creada');
      setTimeout(() => setStatus(''), 1500);
    } catch (_) { setStatus('No se pudo crear sección'); }
  };

  const iniciarEdicionSeccion = (s) => {
    setEditSeccionId(s.id);
    setEditSeccionNombre(s.nombre);
  };

  const cancelarEdicionSeccion = () => {
    setEditSeccionId(0);
    setEditSeccionNombre('');
  };

  const guardarSeccion = async () => {
    const id = Number(editSeccionId);
    const nom = String(editSeccionNombre || '').trim();
    if (!id || !nom) return;
    try {
      const resp = await fetch(api(`/api/secciones/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nom })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setStatus(json.error || 'Error al actualizar'); return; }
      cancelarEdicionSeccion();
      await cargarSecciones();
      setStatus('Sección actualizada');
      setTimeout(() => setStatus(''), 1500);
    } catch (_) { setStatus('No se pudo actualizar'); }
  };

  const eliminarSeccion = async (id) => {
    if (!window.confirm('¿Eliminar esta sección?')) return;
    try {
      const resp = await fetch(api(`/api/secciones/${id}`), { method: 'DELETE' });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setStatus(json.error || 'Error al eliminar'); return; }
      await cargarSecciones();
      setStatus('Sección eliminada');
      setTimeout(() => setStatus(''), 1500);
    } catch (_) { setStatus('No se pudo eliminar'); }
  };

  return (
    <div className="configuracion">
      <h2>Configuración del Sistema</h2>
      <div className="field">
        <label>Título de bienvenida</label>
        <input type="text" value={welcomeTitle} onChange={(e) => setWelcomeTitle(e.target.value)} placeholder="Bienvenidos Al Sistema de Boletas De Notas" />
      </div>
      <div className="field">
        <label>Logo</label>
        <input type="file" accept="image/*" onChange={onFile} />
        {logoDataUrl && (
          <div className="logo-preview">
            <img src={logoDataUrl} alt="Logo" className="logo-img" />
            <button type="button" onClick={limpiarLogo} className="logo-remove">Quitar logo</button>
          </div>
        )}
      </div>
      <div className="actions actions-space">
        <button type="button" onClick={guardar}>Guardar configuración</button>
      </div>

      <hr className="divider" />

      {/* === GRADOS === */}
      <h2>Gestión de Grados</h2>
      <div className="field-row">
        <div className="field">
          <label>Número</label>
          <input type="number" value={nuevoGradoNumero} onChange={e => setNuevoGradoNumero(e.target.value)} placeholder="1" min="1" />
        </div>
        <div className="field">
          <label>Nombre</label>
          <input type="text" value={nuevoGradoNombre} onChange={e => setNuevoGradoNombre(e.target.value)} placeholder="1°" />
        </div>
      </div>
      <div className="actions">
        <button type="button" onClick={crearGrado}>Crear grado</button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {grados.map(g => (
              <tr key={g.id}>
                <td>
                  {editGradoId === g.id ? (
                    <input type="number" value={editGradoNumero} onChange={e => setEditGradoNumero(e.target.value)} min="1" />
                  ) : g.numero}
                </td>
                <td>
                  {editGradoId === g.id ? (
                    <input type="text" value={editGradoNombre} onChange={e => setEditGradoNombre(e.target.value)} />
                  ) : g.nombre}
                </td>
                <td className="inline-actions">
                  {editGradoId === g.id ? (
                    <>
                      <button type="button" onClick={guardarGrado}>Guardar</button>
                      <button type="button" onClick={cancelarEdicionGrado}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => iniciarEdicionGrado(g)} title="Editar">
                        <Edit size={16} />
                      </button>
                      <button type="button" onClick={() => eliminarGrado(g.id)} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {grados.length === 0 && (
              <tr><td colSpan={3} className="empty-state">No hay grados registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="divider" />

      {/* === SECCIONES === */}
      <h2>Gestión de Secciones</h2>
      <div className="field">
        <label>Nombre de sección</label>
        <input type="text" value={nuevaSeccion} onChange={e => setNuevaSeccion(e.target.value)} placeholder="A" maxLength="10" />
      </div>
      <div className="actions">
        <button type="button" onClick={crearSeccion}>Crear sección</button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {secciones.map(s => (
              <tr key={s.id}>
                <td>
                  {editSeccionId === s.id ? (
                    <input type="text" value={editSeccionNombre} onChange={e => setEditSeccionNombre(e.target.value)} maxLength="10" />
                  ) : s.nombre}
                </td>
                <td className="inline-actions">
                  {editSeccionId === s.id ? (
                    <>
                      <button type="button" onClick={guardarSeccion}>Guardar</button>
                      <button type="button" onClick={cancelarEdicionSeccion}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => iniciarEdicionSeccion(s)} title="Editar">
                        <Edit size={16} />
                      </button>
                      <button type="button" onClick={() => eliminarSeccion(s.id)} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {secciones.length === 0 && (
              <tr><td colSpan={2} className="empty-state">No hay secciones registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {status && <div className="status-msg">{status}</div>}
    </div>
  );
}

export default ConfiguracionSistema;