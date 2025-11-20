import React, { useEffect, useState } from 'react';
import '../assets/css/admin/lista-docentes.css';
import { api } from '../api';

function ListaDocentes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gestionarDni, setGestionarDni] = useState('');
  const [cursosAsignados, setCursosAsignados] = useState([]);
  const [cursoQuitarId, setCursoQuitarId] = useState(0);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [errorCursos, setErrorCursos] = useState('');

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

  const abrirGestion = async (dni) => {
    try {
      setGestionarDni(dni);
      setLoadingCursos(true);
      setErrorCursos('');
      const resp = await fetch(api(`/api/docentes/${dni}/cursos`));
      const json = await resp.json();
      if (!resp.ok || !json.ok) throw new Error(json.error || 'Error al cargar cursos del docente');
      setCursosAsignados(Array.isArray(json.data) ? json.data : []);
      setCursoQuitarId(0);
    } catch (e) {
      setErrorCursos(e.message);
    } finally {
      setLoadingCursos(false);
    }
  };

  const quitarAsignacion = async () => {
    const dni = gestionarDni;
    const cid = Number(cursoQuitarId || 0);
    if (!dni || !cid) { setErrorCursos('Selecciona un curso para quitar'); return; }
    try {
      const resp = await fetch(api('/api/asignaciones'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, curso_id: cid })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) throw new Error(json.error || 'No se pudo quitar asignación');
      await abrirGestion(dni);
      const refresh = await fetch(api('/api/docentes'));
      const j2 = await refresh.json();
      setData(Array.isArray(j2.data) ? j2.data : []);
    } catch (e) {
      setErrorCursos(e.message);
    }
  };

  return (
    <div>
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
                    <td>{d.nombre}</td>
                    <td>{d.descripcion || ''}</td>
                    <td>{d.cursos || ''}</td>
                    <td>{d.password || ''}</td>
                    <td>
                      <button type="button" onClick={() => abrirGestion(d.dni)}>Gestionar cursos</button>
                    </td>
                  </tr>
                  {gestionarDni === d.dni && (
                    <tr>
                      <td colSpan={6}>
                        {loadingCursos && <p>Cargando cursos asignados...</p>}
                        {errorCursos && <p className="status-error">Error: {errorCursos}</p>}
                        {!loadingCursos && !errorCursos && (
                          <div className="inline-actions">
                            <label>Curso asignado</label>
                            <select value={cursoQuitarId || ''} onChange={(e) => setCursoQuitarId(Number(e.target.value) || 0)}>
                              <option value="">Selecciona curso</option>
                              {cursosAsignados.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                              ))}
                            </select>
                            <button type="button" onClick={quitarAsignacion}>Quitar asignación</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
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
    </div>
  );
}

export default ListaDocentes;