import React, { useEffect, useState } from 'react';
import '../assets/css/admin/asignargrados.css';
import { api } from '../api';
import { XCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

function AsignarGrados() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [grado, setGrado] = useState(0);
  const [seccion, setSeccion] = useState('');
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [status, setStatus] = useState('');
  const [busquedaDni, setBusquedaDni] = useState('');

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

  const toggle = (dni) => {
    setSeleccionados(prev => {
      const s = new Set(prev);
      if (s.has(dni)) s.delete(dni); else s.add(dni);
      return s;
    });
  };

  const seleccionarTodos = (list) => {
    setSeleccionados(prev => {
      const s = new Set(prev);
      list.forEach(e => s.add(e.dni));
      return s;
    });
  };

  const limpiarSeleccionGrupo = (list) => {
    setSeleccionados(prev => {
      const s = new Set(prev);
      list.forEach(e => s.delete(e.dni));
      return s;
    });
  };

  const limpiarSeleccion = () => {
    setSeleccionados(new Set());
  };

  const buscarYSeleccionar = () => {
    const dni = busquedaDni.trim();
    if (!dni) return;
    const encontrado = estudiantes.find(e => e.dni === dni);
    if (encontrado) {
      setSeleccionados(new Set([dni]));
      setStatus(`Estudiante encontrado: ${encontrado.apellidos} ${encontrado.nombres}`);
      setTimeout(() => setStatus(''), 3000);
      // Scroll al estudiante
      const elemento = document.querySelector(`tr[data-dni="${dni}"]`);
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        elemento.classList.add('highlight');
        setTimeout(() => elemento.classList.remove('highlight'), 2000);
      }
    } else {
      setStatus('Estudiante no encontrado');
      setTimeout(() => setStatus(''), 3000);
    }
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

  const parseNumero = (nombre) => {
    const s = String(nombre || '');
    const m = s.match(/\d+/);
    return m ? Number(m[0]) : 0;
  };

  // Agrupar estudiantes por grado dinámicamente
  const porGrado = {
    sin: estudiantes.filter(e => e.grado == null)
  };
  
  grados.forEach(g => {
    const n = parseNumero(g.nombre);
    if (n) porGrado[n] = estudiantes.filter(e => e.grado === n);
  });

  return (
    <div className="asignar-grados">
      <h2>Asignamiento de grado estudiantil</h2>
      <p>Selecciona estudiantes y asigna su grado (1° a 6°). También puedes promover o bajar.</p>

      {/* BÚSQUEDA POR DNI */}
      <div className="search-box">
        <input 
          type="text" 
          value={busquedaDni} 
          onChange={e => setBusquedaDni(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && buscarYSeleccionar()}
          placeholder="Buscar por DNI..."
          inputMode="numeric"
        />
        <button type="button" onClick={buscarYSeleccionar}>Buscar y Seleccionar</button>
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

      <h3>Sin grado</h3>
      <div className="actions inline-actions">
        <button type="button" onClick={() => seleccionarTodos(porGrado.sin)}>Seleccionar todos</button>
        <button type="button" onClick={() => limpiarSeleccionGrupo(porGrado.sin)} title="Limpiar selección del grupo">
          <XCircle size={18} />
        </button>
      </div>
      <div className="table">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>DNI</th>
              <th>Apellidos</th>
              <th>Nombres</th>
              <th>Sección</th>
            </tr>
          </thead>
          <tbody>
            {porGrado.sin.length === 0 && (<tr><td colSpan={5}>(Sin estudiantes)</td></tr>)}
            {porGrado.sin.map(e => (
              <tr key={e.dni} data-dni={e.dni} onClick={() => toggle(e.dni)}>
                <td><input type="checkbox" checked={seleccionados.has(e.dni)} onChange={() => toggle(e.dni)} onClick={(ev) => ev.stopPropagation()} /></td>
                <td>{e.dni}</td>
                <td>{e.apellidos}</td>
                <td>{e.nombres}</td>
                <td>{e.seccion || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {grados.map(gradoObj => (
        <div key={gradoObj.id}>
          <h3>Grado {gradoObj.nombre}</h3>
          <div className="actions inline-actions">
            <button type="button" onClick={() => seleccionarTodos(porGrado[parseNumero(gradoObj.nombre)] || [])}>Seleccionar todos</button>
            <button type="button" onClick={() => limpiarSeleccionGrupo(porGrado[parseNumero(gradoObj.nombre)] || [])} title="Limpiar selección del grupo">
              <XCircle size={18} />
            </button>
          </div>
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>DNI</th>
                  <th>Apellidos</th>
                  <th>Nombres</th>
                  <th>Sección</th>
                </tr>
              </thead>
              <tbody>
                {(!porGrado[parseNumero(gradoObj.nombre)] || porGrado[parseNumero(gradoObj.nombre)].length === 0) && (<tr><td colSpan={5}>(Sin estudiantes)</td></tr>)}
                {(porGrado[parseNumero(gradoObj.nombre)] || []).map(e => (
                  <tr key={e.dni} data-dni={e.dni} onClick={() => toggle(e.dni)}>
                    <td><input type="checkbox" checked={seleccionados.has(e.dni)} onChange={() => toggle(e.dni)} onClick={(ev) => ev.stopPropagation()} /></td>
                    <td>{e.dni}</td>
                    <td>{e.apellidos}</td>
                    <td>{e.nombres}</td>
                    <td>{e.seccion || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AsignarGrados;
