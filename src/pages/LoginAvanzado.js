import React, { useState } from 'react';
import { api } from '../api';

function LoginAvanzado({ onSuccess }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const esSoloDigitos = (v) => /^\d+$/.test(v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const u = usuario.trim();
    const p = password.trim();
    if (!u) { setError('Ingresa DNI'); return; }
    if (!p) { setError('Ingresa tu contraseña'); return; }

    // Administrador
    if (u.toLowerCase() === 'user' && p === 'superuser') {
      setError('');
      onSuccess('#/administrador');
      return;
    }

    // Docente por DNI (solo dígitos, mínimo 8)
    if (esSoloDigitos(u)) {
      if (u.length < 8) { setError('El DNI debe tener al menos 8 dígitos'); return; }
      try {
        const resp = await fetch(api('/api/login/docente'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dni: u, password: p })
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) { setError(data.error || 'Credenciales inválidas'); return; }
        setError('');
        try { localStorage.setItem('dni', u); } catch {}
        onSuccess('#/docente');
      } catch (err) {
        console.error(err);
        setError('No se pudo conectar al servidor');
      }
      return;
    }

    // Otros usuarios no soportados (usar login clásico de alumno)
    setError('Este acceso es solo para Docente. Usa el inicio de boleta.');
  };

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Login De Docentes</h1>
        <p>Ingresa DNI y contraseña</p>

        <div className="field">
          <label>Usuario</label>
          <input
            type="text"
            value={usuario}
            onChange={(e) => {
              const v = e.target.value;
              if (/^\d+$/.test(v)) {
                setUsuario(v.slice(0, 8));
              } else {
                setUsuario(v);
              }
            }}
            placeholder="Ingresa tu DNI"
            inputMode="text"
          />
        </div>

        <div className="field">
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
          />
        </div>

        {error && <div className="error">{error}</div>}

        <div className="actions">
          <button type="submit">Acceder</button>
        </div>
        
        <div className="footnote">
          ¿Quieres volver al inicio?
          <a href="/" style={{ marginLeft: 6 }}>Ir al inicio</a>
        </div>
      </form>
    </div>
  );
}

export default LoginAvanzado;
