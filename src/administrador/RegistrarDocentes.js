import React, { useState } from 'react';
import { api } from '../api';

function RegistrarDocentes() {
  const [dni, setDni] = useState('');
  const [apellidosNombres, setApellidosNombres] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar al servidor');
    }
  };

  // Exportar CSV y listado han sido retirados según solicitud.

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

      {error && <div className="error" style={{ marginTop: '1rem', color: 'crimson' }}>{error}</div>}
      {success && <div className="success" style={{ marginTop: '1rem', color: 'green' }}>{success}</div>}
    </div>
  );
}

export default RegistrarDocentes;