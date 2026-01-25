import React, { useEffect, useState } from 'react';
import '../assets/css/admin/asignargrados.css';
import { api } from '../api';
import { XCircle, ArrowUpCircle, ArrowDownCircle, ChevronDown, ChevronUp } from 'lucide-react';

function AsignarGrados() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [grado, setGrado] = useState(0);
  const [seccion, setSeccion] = useState('');
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [status, setStatus] = useState('');
  const [busquedaDni, setBusquedaDni] = useState('');
  const [modalGradoVisible, setModalGradoVisible] = useState(false);
  const [gradoModalSel, setGradoModalSel] = useState('');
  const [gradosOcultos, setGradosOcultos] = useState(new Set());

  const toggleGradoVisibilidad = (id) => {
    setGradosOcultos(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const normalizarTexto = (v) =>
    String(v || '')  
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const buildTokens = (q) => {
    const base = normalizarTexto(q).trim();
    if (!base) return [];
    return base.split(/\s+/).filter(Boolean);
  };

  const coincideConBusqueda = (est, tokens) => {
    if (!tokens || tokens.length === 0) return true;
    const dni = String(est.dni || '');
    const ape = normalizarTexto(est.apellidos);
    const nom = normalizarTexto(est.nombres);
    const sec = normalizarTexto(est.seccion);
    const base = `${dni} ${ape} ${nom} ${sec}`;
    return tokens.every(t => base.includes(t));
  };

  const cargar = async () => {
    try {
      const resp = await fetch(api('/api/estudiantes'));
      const json = await resp.json();
      setEstudiantes(json.ok && Array.isArray(json.data) ? json.data : []);
    } catch (_) {}
  };

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

  useEffect(() => { 
    cargar(); 
    cargarGrados();
    cargarSecciones();
  }, []);

  useEffect(() => {
    if (!grados.length) return;
    setGradosOcultos(prev => {
      if (prev.size) return prev;
      return new Set(grados.map(g => g.id));
    });
  }, [grados]);

  const seleccionarEstudiante = (est) => {
    if (!est) return;

    if (est.grado) {
      const gradoObj = grados.find(g => parseNumero(g.nombre) === parseNumero(est.grado));
      if (gradoObj) {
        setGradosOcultos(prev => {
          const s = new Set(prev);
          if (s.has(gradoObj.id)) {
            s.delete(gradoObj.id);
            return s;
          }
          return prev;
        });
      }
    }

    const dniSel = String(est.dni);
    setSeleccionados(new Set([dniSel]));
    
    setTimeout(() => {
      const elemento = document.querySelector(`tr[data-dni="${dniSel}"]`);
      if (elemento) {
        try {
          elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (_) {
          elemento.scrollIntoView();
        }
        elemento.classList.add('highlight');
        setTimeout(() => elemento.classList.remove('highlight'), 2000);
      }
    }, 100);
  };

  const toggle = (dni) => {
    setSeleccionados(prev => {
      const s = new Set(prev);
      if (s.has(dni)) s.delete(dni); else s.add(dni);
      return s;
    });
  };

  const seleccionarTodosPorGrado = (numGrado) => {
    const n = Number(numGrado || 0);
    if (!n) return;
    const dnis = estudiantes.filter(e => parseNumero(e.grado) === n).map(e => e.dni);
    setSeleccionados(new Set(dnis));
  };

  const limpiarSeleccion = () => {
    setSeleccionados(new Set());
  };

  const buscarYSeleccionar = () => {
    const tokens = buildTokens(busquedaDni);
    if (!tokens.length) return;
    const encontrado = estudiantes.find(e => coincideConBusqueda(e, tokens));
    if (!encontrado) return;
    seleccionarEstudiante(encontrado);
  };

  const asignar = async () => {
    const g = Number(grado);
    const sec = seccion ? String(seccion).trim() : null;
    const dnis = Array.from(seleccionados);
    if (!g || g < 1) { setStatus('Selecciona un grado válido'); return; }
    if (dnis.length === 0) { setStatus('Selecciona al menos un estudiante'); return; }
    try {
      setStatus('Asignando...');
      const body = { grado: g, dnis };
      if (sec) body.seccion = sec;
      const resp = await fetch(api('/api/estudiantes/grados/bulk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setStatus(json.error || 'Error al asignar'); return; }
      setStatus(`Asignados: ${json.affected}`);
      limpiarSeleccion();
      await cargar();
    } catch (e) {
      setStatus('No se pudo asignar');
    }
  };


  const promover = async () => {
    const dnis = Array.from(seleccionados);
    if (dnis.length === 0) { setStatus('Selecciona al menos un estudiante'); return; }
    try {
      setStatus('Promoviendo...');
      const resp = await fetch(api('/api/estudiantes/grados/promover'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dnis })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setStatus(json.error || 'Error al promover'); return; }
      setStatus(`Promovidos: ${json.affected}`);
      await cargar();
    } catch (_) { setStatus('No se pudo promover'); }
  };

  const bajar = async () => {
    const dnis = Array.from(seleccionados);
    if (dnis.length === 0) { setStatus('Selecciona al menos un estudiante'); return; }
    try {
      setStatus('Bajando...');
      const resp = await fetch(api('/api/estudiantes/grados/bajar'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dnis })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) { setStatus(json.error || 'Error al bajar'); return; }
      setStatus(`Bajados: ${json.affected}`);
      await cargar();
    } catch (_) { setStatus('No se pudo bajar'); }
  };

  const tokensBusqueda = buildTokens(busquedaDni);

  const estudiantesFiltrados = estudiantes;

  const sugerencias = tokensBusqueda.length === 0
    ? []
    : estudiantes.filter(e => coincideConBusqueda(e, tokensBusqueda)).slice(0, 8);

  const parseNumero = (nombre) => {
    const s = String(nombre || '');
    const m = s.match(/\d+/);
    return m ? Number(m[0]) : 0;
  };

  const porGrado = {};

  grados.forEach(g => {
    const n = parseNumero(g.nombre);
    if (n) porGrado[n] = estudiantesFiltrados.filter(e => parseNumero(e.grado) === n);
  });

  return (
    <div className="asignar-grados">
      <h2>Asignamiento de grado estudiantil</h2>
      <p>Selecciona estudiantes y asigna su grado (1° a 6°). También puedes promover o bajar.</p>

      <div className="search-box">
        <input 
          type="text" 
          value={busquedaDni} 
          onChange={e => setBusquedaDni(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              buscarYSeleccionar();
            }
          }}
          placeholder="Buscar por DNI, nombre, apellidos o sección..."
          inputMode="text"
        />
      </div>

      {sugerencias.length > 0 && (
        <div className="search-suggestions">
          {sugerencias.map(est => (
            <button
              key={est.dni}
              type="button"
              className="search-suggestion-item"
              onClick={() => seleccionarEstudiante(est)}
            >
              <span className="dni">{est.dni}</span>
              <span className="nombre">{est.apellidos} {est.nombres}</span>
              <span className="seccion">{est.seccion || '-'}</span>
            </button>
          ))}
        </div>
      )}

      <div className="actions inline-actions">
        <button type="button" onClick={() => setModalGradoVisible(true)}>Seleccionar todos por grado</button>
        <button type="button" onClick={limpiarSeleccion} title="Limpiar selección general">
          <XCircle size={18} />
        </button>
      </div>

      <div className="inline-actions">
        <label>Grado</label>
        <select value={grado || ''} onChange={e => setGrado(Number(e.target.value) || 0)}>
          <option value="">Selecciona grado</option>
          {grados.map(g => (
            <option key={g.id} value={parseNumero(g.nombre)}>{g.nombre}</option>
          ))}
        </select>
        
        <label>Sección</label>
        <select value={seccion || ''} onChange={e => setSeccion(e.target.value)}>
          <option value="">Selecciona sección</option>
          {secciones.map(s => (
            <option key={s.id} value={s.nombre}>{s.nombre}</option>
          ))}
        </select>
        
        <button type="button" onClick={asignar}>Asignar a seleccionados</button>
        <button type="button" onClick={promover} title="Promover">
          <ArrowUpCircle size={18} />
        </button>
        <button type="button" onClick={bajar} title="Bajar">
          <ArrowDownCircle size={18} />
        </button>
        {status && <span>{status}</span>}
      </div>

      {grados.map(gradoObj => {
        const isHidden = gradosOcultos.has(gradoObj.id);
        return (
          <div key={gradoObj.id}>
<div
  className={`grado-toggle ${isHidden ? 'collapsed' : 'expanded'}`}
  onClick={() => toggleGradoVisibilidad(gradoObj.id)}
>
  <div className="grado-title">
    <span>Grado {gradoObj.nombre}</span>
  </div>

  <div className="grado-icon">
    {isHidden ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
  </div>
</div>
            {!isHidden && (
              <div className="table">
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>DNI</th>
                      <th>Apellidos</th>
                      <th>Nombres</th>
                      <th>Sección</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!porGrado[parseNumero(gradoObj.nombre)] || porGrado[parseNumero(gradoObj.nombre)].length === 0) && (<tr><td colSpan={6}>(Sin estudiantes)</td></tr>)}
                    {(porGrado[parseNumero(gradoObj.nombre)] || []).map(e => (
                      <tr key={e.dni} data-dni={e.dni} onClick={() => toggle(e.dni)}>
                        <td><input type="checkbox" checked={seleccionados.has(e.dni)} onChange={() => toggle(e.dni)} onClick={(ev) => ev.stopPropagation()} /></td>
                        <td>{e.dni}</td>
                        <td>{e.apellidos}</td>
                        <td>{e.nombres}</td>
                        <td>{e.seccion || '-'}</td>
                        <td>
                          <button type="button" onClick={async () => {
                            const dnis = [e.dni];
                            try {
                              setStatus('Promoviendo...');
                              const resp = await fetch(api('/api/estudiantes/grados/promover'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ dnis })
                              });
                              const json = await resp.json();
                              if (!resp.ok || !json.ok) { setStatus(json.error || 'Error al promover'); return; }
                              setStatus(`Promovido: ${e.apellidos} ${e.nombres}`);
                              await cargar();
                            } catch (_) { setStatus('No se pudo promover'); }
                          }} title="Promover">
                            <ArrowUpCircle size={18} />
                          </button>
                          <button type="button" onClick={async () => {
                            const dnis = [e.dni];
                            try {
                              setStatus('Bajando...');
                              const resp = await fetch(api('/api/estudiantes/grados/bajar'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ dnis })
                              });
                              const json = await resp.json();
                              if (!resp.ok || !json.ok) { setStatus(json.error || 'Error al bajar'); return; }
                              setStatus(`Bajado: ${e.apellidos} ${e.nombres}`);
                              await cargar();
                            } catch (_) { setStatus('No se pudo bajar'); }
                          }} title="Bajar">
                            <ArrowDownCircle size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {modalGradoVisible && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h4>Seleccionar todos por grado</h4>
            <div className="field">
              <label>Grado: </label>
              <select value={gradoModalSel} onChange={e => setGradoModalSel(e.target.value)}>
                <option value="">Selecciona grado</option>
                {grados.map(g => (
                  <option key={g.id} value={parseNumero(g.nombre)}>{g.nombre}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => {
                seleccionarTodosPorGrado(gradoModalSel);
                setModalGradoVisible(false);
              }} disabled={!gradoModalSel}>
                Seleccionar
              </button>
              <button type="button" onClick={() => setModalGradoVisible(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AsignarGrados;
