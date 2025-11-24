import React, { useEffect, useState } from 'react';
import '../assets/css/admin/asignargrados.css';
import { api } from '../api';
import { XCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

function AsignarGrados() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [grado, setGrado] = useState(0);
  const [status, setStatus] = useState('');

  const cargar = async () => {
    try {
      const resp = await fetch(api('/api/estudiantes'));
      const json = await resp.json();
      setEstudiantes(json.ok && Array.isArray(json.data) ? json.data : []);
    } catch (_) {}
  };

  useEffect(() => { cargar(); }, []);

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

  const asignar = async () => {
    const g = Number(grado);
    const dnis = Array.from(seleccionados);
    if (!g || g < 1 || g > 6) { setStatus('Selecciona un grado válido (1-6)'); return; }
    if (dnis.length === 0) { setStatus('Selecciona al menos un estudiante'); return; }
    try {
      setStatus('Asignando...');
      const resp = await fetch(api('/api/estudiantes/grados/bulk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grado: g, dnis })
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

  const porGrado = {
    sin: estudiantes.filter(e => e.grado == null),
    1: estudiantes.filter(e => e.grado === 1),
    2: estudiantes.filter(e => e.grado === 2),
    3: estudiantes.filter(e => e.grado === 3),
    4: estudiantes.filter(e => e.grado === 4),
    5: estudiantes.filter(e => e.grado === 5),
    6: estudiantes.filter(e => e.grado === 6),
  };

  return (
    <div className="asignar-grados">
      <h2>Asignamiento de grado estudiantil</h2>
      <p>Selecciona estudiantes y asigna su grado (1° a 6°). También puedes promover o bajar.</p>

      <div className="inline-actions">
        <label>Grado</label>
        <select value={grado || ''} onChange={e => setGrado(Number(e.target.value) || 0)}>
          <option value="">Selecciona grado</option>
          {[1,2,3,4,5,6].map(n => (
            <option key={n} value={n}>{n}°</option>
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
            </tr>
          </thead>
          <tbody>
            {porGrado.sin.length === 0 && (<tr><td colSpan={4}>(Sin estudiantes)</td></tr>)}
            {porGrado.sin.map(e => (
              <tr key={e.dni}>
                <td><input type="checkbox" checked={seleccionados.has(e.dni)} onChange={() => toggle(e.dni)} /></td>
                <td>{e.dni}</td>
                <td>{e.apellidos}</td>
                <td>{e.nombres}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {[1,2,3,4,5,6].map(g => (
        <div key={g}>
          <h3>Grado {g}°</h3>
          <div className="actions inline-actions">
            <button type="button" onClick={() => seleccionarTodos(porGrado[g])}>Seleccionar todos</button>
            <button type="button" onClick={() => limpiarSeleccionGrupo(porGrado[g])} title="Limpiar selección del grupo">
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
                </tr>
              </thead>
              <tbody>
                {porGrado[g].length === 0 && (<tr><td colSpan={4}>(Sin estudiantes)</td></tr>)}
                {porGrado[g].map(e => (
                  <tr key={e.dni}>
                    <td><input type="checkbox" checked={seleccionados.has(e.dni)} onChange={() => toggle(e.dni)} /></td>
                    <td>{e.dni}</td>
                    <td>{e.apellidos}</td>
                    <td>{e.nombres}</td>
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