import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { api } from './api';
import LoginAvanzado from './pages/LoginAvanzado';
import DocenteHome from './Docente/DocenteHome';
import AdminHome from './administrador/AdminHome';
import AlumnosHome from './Alumnos/AlumnosHome';
import logoDefault from './assets/images/logo.png';

function Login() {
  const navigate = useNavigate();
  const [valor, setValor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [welcomeTitle, setWelcomeTitle] = useState('Bienvenidos Al Sistema de Boletas De Notas');
  const [logoUrl, setLogoUrl] = useState(logoDefault);

  useEffect(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem('config') || '{}');
      if (cfg && typeof cfg === 'object') {
        if (cfg.welcomeTitle) setWelcomeTitle(String(cfg.welcomeTitle));
        if (cfg.logoDataUrl) setLogoUrl(String(cfg.logoDataUrl));
      }
    } catch {}
  }, []);

  const validar = () => {
    const v = valor.trim();
    if (v.toLowerCase() === 'acceso') return '';
    if (!v) return 'Ingresa tu DNI';
    const soloDigitos = /^\d{8,}$/;
    if (!soloDigitos.test(v)) return 'El DNI debe tener al menos 8 dígitos';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = valor.trim();
    if (v.toLowerCase() === 'acceso') { 
      setError(''); 
      navigate('/acceso'); 
      return; 
    }
    const msg = validar();
    if (msg) { setError(msg); return; }
    setError('');
    try {
      setLoading(true);
      const resp = await fetch(api('/api/login/alumno'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: valor.trim() })
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) { setError(data.error || 'DNI inválido'); return; }
      try { localStorage.setItem('dni', valor.trim()); } catch {}
      navigate('/alumnos');
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>{welcomeTitle}</h1>
        <div style={{ display: 'grid', placeItems: 'center', margin: '12px 0' }}>
          <img src={logoUrl} alt="Logo" style={{ maxWidth: '200px', height: 'auto', borderRadius:'100px',}} />
        </div>
        <p>Ingresa tu DNI</p>

        <div className="field">
          <label>DNI</label>
          <input
            type="text"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={'Ingresa tu DNI'}
            inputMode={'numeric'}
            maxLength={8}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <div className="actions">
          <button type="submit" disabled={loading}>{loading ? 'Validando...' : 'Ingresar'}</button>
        </div>
      </form>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/docente/*" element={<DocenteHome />} />
      <Route path="/administrador/*" element={<AdminHome />} />
      <Route path="/alumnos/*" element={<AlumnosHome />} />
      <Route path="/acceso" element={<LoginAvanzado />} />
    </Routes>
  );
}

export default App;
