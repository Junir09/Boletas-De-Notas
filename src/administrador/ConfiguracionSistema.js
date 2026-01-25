import React, { useEffect, useState } from 'react';
import '../assets/css/admin/configuracion.css';
import { api } from '../api';
import { Edit, Trash2, Eye, EyeOff, ZoomIn, ZoomOut, Check, AlertTriangle } from 'lucide-react';

function ConfiguracionSistema() {
  const [welcomeTitle, setWelcomeTitle] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [status, setStatus] = useState('');
  const [adminUser, setAdminUser] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  
  // Grados
  const [grados, setGrados] = useState([]);
  const [nuevoGradoNombre, setNuevoGradoNombre] = useState('');
  const [editGradoId, setEditGradoId] = useState(0);
  const [editGradoNombre, setEditGradoNombre] = useState('');
  
  // Secciones
  const [secciones, setSecciones] = useState([]);
  const [nuevaSeccion, setNuevaSeccion] = useState('');
  const [editSeccionId, setEditSeccionId] = useState(0);
  const [editSeccionNombre, setEditSeccionNombre] = useState('');

  // Cursos y asignaciones curso-grado-seccion
  const [cursos, setCursos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [selCursoId, setSelCursoId] = useState(0);
  const [selGradoId, setSelGradoId] = useState(0);
  const [selSeccionId, setSelSeccionId] = useState(0);

  // Modals & Cropper State
  const [modalConfig, setModalConfig] = useState({ type: null, subType: null, id: null });
  const [cropImage, setCropImage] = useState(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem('config') || '{}');
      setWelcomeTitle(String(cfg.welcomeTitle || 'Bienvenidos Al Sistema de Boletas De Notas'));
      setLogoDataUrl(String(cfg.logoDataUrl || ''));
      setAdminUser(String(cfg.adminUser || 'user'));
      setAdminPassword(String(cfg.adminPassword || 'superuser'));
    } catch {
      setWelcomeTitle('Bienvenidos Al Sistema de Boletas De Notas');
      setLogoDataUrl('');
      setAdminUser('user');
      setAdminPassword('superuser');
    }
    cargarGrados();
    cargarSecciones();
    cargarCursos();
    cargarAsignaciones();
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

  const cargarCursos = async () => {
    try {
      const resp = await fetch(api('/api/cursos'));
      const json = await resp.json();
      setCursos(json.ok && Array.isArray(json.data) ? json.data : []);
    } catch (_) {}
  };

  const cargarAsignaciones = async () => {
    try {
      const resp = await fetch(api('/api/curso-grado'));
      const json = await resp.json();
      setAsignaciones(json.ok && Array.isArray(json.data) ? json.data : []);
    } catch (_) {}
  };

  // === CROPPER LOGIC ===
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result);
      setCropScale(1);
      setCropPos({ x: 0, y: 0 });
      setModalConfig({ type: 'cropper' });
    };
    reader.readAsDataURL(file);
    e.target.value = null; // Reset input
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropPos.x, y: e.clientY - cropPos.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setCropPos({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const saveCrop = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = cropImage;
    
    // Define output size (e.g., 200x200 for logo)
    canvas.width = 200;
    canvas.height = 200;

    // The crop view is 300x300 in CSS (example), we need to map the visible area
    // Simplified crop logic: Draw image with current transform onto the canvas
    // We need to calculate the relative position of the image center
    
    // For simplicity in this context, we'll draw the image centered and scaled
    // This is a basic approximation of "what you see is what you get" relative to the center
    
    img.onload = () => {
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Translate to center
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(cropScale, cropScale);
        ctx.translate(cropPos.x / cropScale, cropPos.y / cropScale);
        
        // Draw image centered
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        setLogoDataUrl(canvas.toDataURL('image/png'));
        setModalConfig({ type: null });
    };
  };

  const guardar = () => {
    try {
      const cfg = {
        welcomeTitle: welcomeTitle.trim(),
        logoDataUrl: logoDataUrl || '',
        adminUser: String(adminUser || 'user'),
        adminPassword: String(adminPassword || 'superuser')
      };
      localStorage.setItem('config', JSON.stringify(cfg));
      setModalConfig({ type: 'save-success' });
    } catch {
      setStatus('Error al guardar');
    }
  };

  const limpiarLogo = () => setLogoDataUrl('');

  // === GRADOS ===
  const crearGrado = async () => {
    const nom = String(nuevoGradoNombre || '').trim();
    if (!nom) { setStatus('Ingresa nombre del grado'); return; }
    try {
      const resp = await fetch(api('/api/grados'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nom })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setStatus(json.error || 'Error al crear grado'); return; }
      setNuevoGradoNombre('');
      await cargarGrados();
      setStatus('Grado creado');
      setTimeout(() => setStatus(''), 1500);
    } catch (_) { setStatus('No se pudo crear grado'); }
  };

  const iniciarEdicionGrado = (g) => {
    setEditGradoId(g.id);
    setEditGradoNombre(g.nombre);
  };

  const cancelarEdicionGrado = () => {
    setEditGradoId(0);
    setEditGradoNombre('');
  };

  const guardarGrado = async () => {
    const id = Number(editGradoId);
    const nom = String(editGradoNombre || '').trim();
    if (!id || !nom) return;
    try {
      const resp = await fetch(api(`/api/grados/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nom })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setStatus(json.error || 'Error al actualizar'); return; }
      cancelarEdicionGrado();
      await cargarGrados();
      setStatus('Grado actualizado');
      setTimeout(() => setStatus(''), 1500);
    } catch (_) { setStatus('No se pudo actualizar'); }
  };

  const solicitarEliminarGrado = (id) => {
    setModalConfig({ type: 'delete-confirm', subType: 'grado', id });
  };

  const solicitarEliminarSeccion = (id) => {
    setModalConfig({ type: 'delete-confirm', subType: 'seccion', id });
  };

  const confirmarEliminacion = async () => {
    const { subType, id } = modalConfig;
    try {
        let endpoint = '';
        if (subType === 'grado') endpoint = `/api/grados/${id}`;
        else if (subType === 'seccion') endpoint = `/api/secciones/${id}`;

        const resp = await fetch(api(endpoint), { method: 'DELETE' });
        const json = await resp.json();
        
        if (!resp.ok || !json.ok) { 
            setStatus(json.error || 'Error al eliminar'); 
            setModalConfig({ type: null });
            return; 
        }

        if (subType === 'grado') await cargarGrados();
        else await cargarSecciones();

        setModalConfig({ type: 'delete-success' });
    } catch (_) {
        setStatus('No se pudo eliminar');
        setModalConfig({ type: null });
    }
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

  const crearAsignacionCursoGrado = async () => {
    const cid = Number(selCursoId || 0);
    const gid = Number(selGradoId || 0);
    const sid = Number(selSeccionId || 0) || null;
    if (!cid || !gid) { setStatus('Selecciona curso y grado'); return; }
    try {
      const resp = await fetch(api('/api/curso-grado'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curso_id: cid, grado_id: gid, seccion_id: sid })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setStatus(json.error || 'Error al asignar curso'); return; }
      setSelCursoId(0); setSelGradoId(0); setSelSeccionId(0);
      await cargarAsignaciones();
      setStatus('Curso asignado');
      setTimeout(() => setStatus(''), 1500);
    } catch (_) { setStatus('No se pudo asignar curso'); }
  };

  const eliminarAsignacion = async (id) => {
    const aid = Number(id || 0);
    if (!aid) return;
    try {
      const resp = await fetch(api(`/api/curso-grado/${aid}`), { method: 'DELETE' });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setStatus(json.error || 'Error al eliminar asignación'); return; }
      await cargarAsignaciones();
      setStatus('Asignación eliminada');
      setTimeout(() => setStatus(''), 1500);
    } catch (_) { setStatus('No se pudo eliminar asignación'); }
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
      <div className="field-row">
        <div className="field">
          <label>Usuario Administrador</label>
          <input type="text" value={adminUser} onChange={e => setAdminUser(e.target.value)} placeholder="user" maxLength={32} />
        </div>
        <div className="field">
          <label>Contraseña Administrador</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type={showAdminPass ? 'text' : 'password'}
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              placeholder="superuser"
              maxLength={64}
            />
            <button type="button" onClick={() => setShowAdminPass(s => !s)} title={showAdminPass ? 'Ocultar' : 'Ver'}>
              {showAdminPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>
      <div className="actions actions-space">
        <button type="button" onClick={guardar}>Guardar configuración</button>
      </div>

      <hr className="divider" />

      {/* === GRADOS === */}
      <h2>Gestión de Grados</h2>
      <div className="field">
        <label>Nombre</label>
        <input type="text" value={nuevoGradoNombre} onChange={e => setNuevoGradoNombre(e.target.value)} placeholder="1°" />
      </div>
      <div className="actions">
        <button type="button" onClick={crearGrado}>Crear grado</button>
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
            {grados.map(g => (
              <tr key={g.id}>
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
                      <button type="button" onClick={() => solicitarEliminarGrado(g.id)} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {grados.length === 0 && (
              <tr><td colSpan={2} className="empty-state">No hay grados registrados</td></tr>
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
                      <button type="button" onClick={() => solicitarEliminarSeccion(s.id)} title="Eliminar">
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

      <hr className="divider" />

      <h2>Asignación de cursos por grado y sección</h2>
      <div className="field-row">
        <div className="field">
          <label>Curso</label>
          <select value={selCursoId || ''} onChange={e => setSelCursoId(Number(e.target.value) || 0)}>
            <option value="">Selecciona curso</option>
            {cursos.map(c => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
          </select>
        </div>
        <div className="field">
          <label>Grado</label>
          <select value={selGradoId || ''} onChange={e => setSelGradoId(Number(e.target.value) || 0)}>
            <option value="">Selecciona grado</option>
            {grados.map(g => (<option key={g.id} value={g.id}>{g.nombre}</option>))}
          </select>
        </div>
        <div className="field">
          <label>Sección (opcional)</label>
          <select value={selSeccionId || ''} onChange={e => setSelSeccionId(Number(e.target.value) || 0)}>
            <option value="">Todas</option>
            {secciones.map(s => (<option key={s.id} value={s.id}>{s.nombre}</option>))}
          </select>
        </div>
      </div>
      <div className="actions">
        <button type="button" onClick={crearAsignacionCursoGrado}>Asignar curso</button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Curso</th>
              <th>Grado</th>
              <th>Sección</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {asignaciones.map(a => (
              <tr key={a.id}>
                <td>{a.curso}</td>
                <td>{a.grado}</td>
                <td>{a.seccion || ''}</td>
                <td className="inline-actions">
                  <button type="button" onClick={() => eliminarAsignacion(a.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {asignaciones.length === 0 && (
              <tr><td colSpan={4} className="empty-state">No hay asignaciones registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {status && <div className="status-msg">{status}</div>}

      {/* MODAL OVERLAYS */}
      {modalConfig.type === 'save-success' && (
        <div className="configuracion-modal-overlay">
          <div className="configuracion-modal-card">
            <div className="configuracion-modal-icon success">
              <Check size={40} />
            </div>
            <h3>configuracion guardada</h3>
            <p>Los cambios han sido aplicados correctamente.</p>
            <div className="configuracion-modal-actions">
              <button onClick={() => setModalConfig({ type: null })} className="configuracion-btn-primary">
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalConfig.type === 'delete-confirm' && (
        <div className="configuracion-modal-overlay">
          <div className="configuracion-modal-card">
            <div className="configuracion-modal-icon warning">
              <AlertTriangle size={40} />
            </div>
            <h3>¿Estás seguro?</h3>
            <p>Estas seguro de eliminar este grado/Seccion</p>
            <div className="configuracion-modal-actions">
              <button onClick={() => setModalConfig({ type: null })} className="configuracion-btn-secondary">
                Cancelar
              </button>
              <button onClick={confirmarEliminacion} className="configuracion-btn-danger">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalConfig.type === 'delete-success' && (
        <div className="configuracion-modal-overlay">
          <div className="configuracion-modal-card">
            <div className="configuracion-modal-icon success">
              <Check size={40} />
            </div>
            <h3>Eliminacion Completa</h3>
            <p>El registro ha sido eliminado exitosamente.</p>
            <div className="configuracion-modal-actions">
              <button onClick={() => setModalConfig({ type: null })} className="configuracion-btn-primary">
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {modalConfig.type === 'cropper' && (
        <div className="configuracion-modal-overlay">
          <div className="configuracion-modal-card wide">
            <h3>Recortar Logo</h3>
            <div className="cropper-layout">
              <div className="cropper-section">
                <div 
                  className="cropper-container"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img 
                    src={cropImage} 
                    style={{
                      transform: `translate(${cropPos.x}px, ${cropPos.y}px) scale(${cropScale})`,
                      cursor: isDragging ? 'grabbing' : 'grab'
                    }} 
                    draggable={false}
                    alt="Crop source"
                  />
                  <div className="cropper-overlay-guide"></div>
                </div>
                <div className="cropper-controls">
                    <ZoomOut size={20} onClick={() => setCropScale(s => Math.max(0.1, s - 0.1))} style={{cursor: 'pointer'}} />
                    <input 
                      type="range" 
                      min="0.1" 
                      max="3" 
                      step="0.1" 
                      value={cropScale} 
                      onChange={e => setCropScale(Number(e.target.value))} 
                    />
                    <ZoomIn size={20} onClick={() => setCropScale(s => Math.min(3, s + 0.1))} style={{cursor: 'pointer'}} />
                </div>
              </div>

              <div className="preview-section">
                <h4>Vista previa Login</h4>
                <div className="login-mockup">
                  <div className="login-mockup-content">
                    <div className="login-mockup-logo-container">
                        <div style={{
                            width: '100%', 
                            height: '100%', 
                            overflow: 'hidden', 
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#fff',
                            borderRadius: '50%'
                        }}>
                             <img 
                                src={cropImage} 
                                style={{
                                    transform: `translate(${cropPos.x}px, ${cropPos.y}px) scale(${cropScale})`,
                                    transformOrigin: 'center center'
                                }} 
                                alt="Preview"
                             />
                        </div>
                    </div>
                    <div className="login-mockup-inputs">
                        <div className="mockup-line"></div>
                        <div className="mockup-line"></div>
                        <div className="mockup-btn"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="configuracion-modal-actions">
              <button onClick={() => setModalConfig({ type: null })} className="configuracion-btn-secondary">
                Cancelar
              </button>
              <button onClick={saveCrop} className="configuracion-btn-primary">
                Recortar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ConfiguracionSistema;
