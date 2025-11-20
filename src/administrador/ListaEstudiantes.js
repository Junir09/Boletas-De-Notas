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
    <div>
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
              </tr>
            </thead>
            <tbody>
              {data.map((e) => (
                <tr key={e.dni}>
                  <td>{e.dni}</td>
                  <td>{[e.apellidos, e.nombres].filter(Boolean).join(' ')}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={2} className="empty-state">No hay estudiantes registrados.</td>
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