import React, { useEffect, useState } from 'react';
import '../assets/css/admin/configuracion.css';

function ConfiguracionSistema() {
  const [welcomeTitle, setWelcomeTitle] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem('config') || '{}');
      setWelcomeTitle(String(cfg.welcomeTitle || 'Bienvenidos Al Sistema de Boletas De Notas'));
      setLogoDataUrl(String(cfg.logoDataUrl || ''));
    } catch {
      setWelcomeTitle('Bienvenidos Al Sistema de Boletas De Notas');
      setLogoDataUrl('');
    }
  }, []);

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setLogoDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const guardar = () => {
    try {
      const cfg = { welcomeTitle: welcomeTitle.trim(), logoDataUrl: logoDataUrl || '' };
      localStorage.setItem('config', JSON.stringify(cfg));
      setStatus('Guardado');
      setTimeout(() => setStatus(''), 1500);
    } catch {
      setStatus('Error al guardar');
    }
  };

  const limpiarLogo = () => setLogoDataUrl('');

  return (
    <div>
      <h2>Configuración del Sistema</h2>
      <div className="field">
        <label>Título de bienvenida</label>
        <input type="text" value={welcomeTitle} onChange={(e) => setWelcomeTitle(e.target.value)} placeholder="Bienvenidos Al Sistema de Boletas De Notas" />
      </div>
      <div className="field">
        <label>Logo</label>
        <input type="file" accept="image/*" onChange={onFile} />
        {logoDataUrl && (
          <div className="logo-preview">
            <img src={logoDataUrl} alt="Logo" className="logo-img" />
            <button type="button" onClick={limpiarLogo} className="logo-remove">Quitar logo</button>
          </div>
        )}
      </div>
      <div className="actions actions-space">
        <button type="button" onClick={guardar}>Guardar</button>
      </div>
      {status && <div className="status-msg">{status}</div>}
    </div>
  );
}

export default ConfiguracionSistema;