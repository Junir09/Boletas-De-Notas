import React, { useEffect, useState } from 'react';
import '../assets/css/admin/lista-estudiantes.css';
import { api } from '../api';

function ListaEstudiantes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const resp = await fetch(api('/api/estudiantes'));
        const json = await resp.json();
        if (!resp.ok || !json.ok) {
          throw new Error(json.error || 'Error al cargar estudiantes');
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

  return (
    <div className="lista-estudiantes">
      <h2>Lista de estudiantes</h2>
      {loading && <p>Cargando...</p>}
      {error && <p className="status-error">Error: {error}</p>}
      {!loading && !error && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>DNI</th>
                <th>Apellidos y nombres</th>
                <th>Grado</th>
                <th>Sección</th>
              </tr>
            </thead>
            <tbody>
              {data.map((e) => (
                <tr key={e.dni}>
                  <td>{e.dni}</td>
                  <td>{[e.apellidos, e.nombres].filter(Boolean).join(' ')}</td>
                  <td>
                    {e.grado ? (
                      <span className="badge-grado">{e.grado}°</span>
                    ) : (
                      <span className="badge-sin-asignar">Sin asignar</span>
                    )}
                  </td>
                  <td>
                    {e.seccion ? (
                      <span className="badge-seccion">{e.seccion}</span>
                    ) : (
                      <span className="badge-sin-asignar">Sin asignar</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-state">No hay estudiantes registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ListaEstudiantes;
