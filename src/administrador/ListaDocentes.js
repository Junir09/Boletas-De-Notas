import React, { useEffect, useState } from 'react';
import { api } from '../api';

function ListaDocentes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div>
      <h2>Lista de docentes</h2>
      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>DNI</th>
                <th>Nombre completo</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.dni}>
                  <td>{d.dni}</td>
                  <td>{d.nombre}</td>
                  <td>{d.descripcion || ''}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center' }}>No hay docentes registrados.</td>
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