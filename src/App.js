import React, { useEffect, useState } from 'react';
import { api } from './api';
import './assets/css/App.css';
import LoginAvanzado from './pages/LoginAvanzado';
import DocenteHome from './Docente/DocenteHome';
import AdminHome from './administrador/AdminHome';
import AlumnosHome from './Alumnos/AlumnosHome';

function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [pathname, setPathname] = useState(window.location.pathname);
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState('dni'); // 'boleta' o 'dni'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    const pathHandler = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', pathHandler);
    window.addEventListener('pushstate', pathHandler);
    return () => {
      window.removeEventListener('popstate', pathHandler);
      window.removeEventListener('pushstate', pathHandler);
    };
  }, []);

  const validar = () => {
    const v = valor.trim();
    if (!v) return tipo === 'dni' ? 'Ingresa tu DNI' : 'Ingresa tu código de boleta';
    if (tipo === 'dni') {
      const soloDigitos = /^\d{8,}$/;
      if (!soloDigitos.test(v)) return 'El DNI debe tener al menos 8 dígitos';
    } else {
      const formatoCodigo = /^[A-Za-z0-9\-]{3,}$/;
      if (!formatoCodigo.test(v)) return 'El código de boleta debe tener al menos 3 caracteres (letras, números o guiones)';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const msg = validar();
    if (msg) { setError(msg); return; }
    setError('');
    try {
      setLoading(true);
      const resp = await fetch(api('/api/login/alumno'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          tipo === 'dni' ? { dni: valor.trim() } : { boleta: valor.trim() }
        )
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) { setError(data.error || (tipo === 'dni' ? 'DNI inválido' : 'Boleta inválida')); return; }
      window.location.hash = '#/alumnos';
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  // Navegación oculta: se retiraron los botones de login

  if (route.startsWith('#/docente')) {
    return (
      <>
        <DocenteHome />
      </>
    );
  }

  if (route.startsWith('#/administrador')) {
    return (
      <>
        <AdminHome />
      </>
    );
  }

  if (route.startsWith('#/alumnos')) {
    return (
      <>
        <AlumnosHome />
      </>
    );
  }

  if (route.startsWith('#/acceso')) {
    const onSuccess = (to) => { window.location.hash = to; };
    return (
      <>
        <LoginAvanzado onSuccess={onSuccess} />
      </>
    );
  }

  // Si la ruta del navegador es /192.168.0.1, mostrar el login avanzado
  // (pero las rutas con hash tienen prioridad y ya fueron evaluadas arriba)
  if (pathname === '/192.168.0.1') {
    const onSuccess = (to) => { window.location.hash = to; };
    return (
      <>
        <LoginAvanzado onSuccess={onSuccess} />
      </>
    );
  }

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Boleta de Notas</h1>
        <p>Selecciona tipo de identificación</p>

        

      <div className="field">
        <label>Tipo</label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label><input type="radio" name="tipo" value="boleta" checked={tipo==='boleta'} onChange={() => setTipo('boleta')} /> Código de boleta</label>
          <label><input type="radio" name="tipo" value="dni" checked={tipo==='dni'} onChange={() => setTipo('dni')} /> DNI</label>
        </div>
      </div>

      <div className="field">
        <label>{tipo === 'dni' ? 'DNI' : 'Código de boleta'}</label>
        <input
          type="text"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder={tipo === 'dni' ? 'Ingresa tu DNI' : 'Ingresa tu código de boleta'}
          inputMode={tipo === 'dni' ? 'numeric' : 'text'}
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

export default App;
