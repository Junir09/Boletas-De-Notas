import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import '../assets/css/login.css';
import { Eye, EyeOff } from 'lucide-react';

function LoginAvanzado() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const esSoloDigitos = (v) => /^\d+$/.test(v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const u = usuario.trim();
    const p = password.trim();
    if (!u) { setError('Ingresa Usuario/DNI'); return; }
    if (!p) { setError('Ingresa tu contraseña'); return; }

    // 1. Intentar Login Local (Legacy Admin)
    let cfg = {};
    try { cfg = JSON.parse(localStorage.getItem('config') || '{}'); } catch {}
    const adminUser = String(cfg.adminUser || 'user');
    const adminPassword = String(cfg.adminPassword || 'superuser');
    
    if (u === adminUser && p === adminPassword) {
      setError('');
      navigate('/administrador/admin-local');
      return;
    }

    // 2. Intentar Login Docente (si es DNI)
    if (esSoloDigitos(u)) {
      if (u.length < 8) { setError('El DNI debe tener al menos 8 dígitos'); return; }
      try {
        const resp = await fetch(api('/api/login/docente'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dni: u, password: p })
        });
        const data = await resp.json();
        if (resp.ok && data.ok) {
          setError('');
          try { localStorage.setItem('dni', u); } catch {}
          const targetUuid = data.uuid || 'error-no-uuid';
          navigate(`/docente/${targetUuid}`);
          return;
        }
        // Si falló docente, seguimos para ver si es admin BD
      } catch (err) {
        console.error(err);
      }
    }

    // 3. Intentar Login Administrador (BD)
    try {
      const resp = await fetch(api('/api/login/admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: u, password: p })
      });
      const data = await resp.json();
      if (resp.ok && data.ok) {
        setError('');
        navigate(`/administrador/${data.uuid}`);
        return;
      }
    } catch (err) {
      console.error(err);
    }

    setError('Credenciales inválidas');
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
          <div className="password-input">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
            />
            <button
              type="button"
              className="toggle-eye"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              onClick={() => setShowPassword(s => !s)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="actions">
          <button type="submit">Acceder</button>
        </div>
        
        <div className="footnote">
          ¿Quieres volver al inicio?
          <Link to="/" style={{ marginLeft: 6 }}>Ir al inicio</Link>
        </div>
      </form>
    </div>
  );
}

export default LoginAvanzado;
