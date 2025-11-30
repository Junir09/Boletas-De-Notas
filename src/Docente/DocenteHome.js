import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, BarChart3, LogOut } from 'lucide-react';
import '../assets/css/admin/layout.css';
import '../assets/css/admin/sidebar.css';
import '../assets/css/docente/docentehome.css';
import { api } from '../api';
import Cursos from './Cursos';
import Boletas from './Boletas';
import Reportes from './Reportes';

function DocenteHome() {
  const [vista, setVista] = useState('cursos');
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [asignaciones, setAsignaciones] = useState({});
  const [docente, setDocente] = useState(null);
  const [notaSel, setNotaSel] = useState(null);

  useEffect(() => {
    if (vista === 'cursos') {
      cargarDocente();
      cargarCursos();
    }
  }, [vista]);

  const cargarDocente = async () => {
    try {
      const dni = localStorage.getItem('dni') || '';
      if (!dni) return;
      const resp = await fetch(api(`/api/docentes/${dni}`));
      const json = await resp.json();
      if (resp.ok && json.ok && json.data) {
        setDocente(json.data);
        return;
      }
      const respAll = await fetch(api('/api/docentes'));
      const jsonAll = await respAll.json();
      if (respAll.ok && jsonAll.ok && Array.isArray(jsonAll.data)) {
        const found = jsonAll.data.find(d => String(d.dni) === dni);
        if (found) setDocente({ dni: found.dni, nombre: found.nombre || `${found.nombres || ''} ${found.apellidos || ''}`.trim() });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const cargarCursos = async () => {
    setLoading(true);
    try {
      const dni = localStorage.getItem('dni') || '';
      if (!dni) return;
      const resp = await fetch(api(`/api/docentes/${dni}/cursos`));
      const json = await resp.json();
      setCursos(json.ok && Array.isArray(json.data) ? json.data : []);
      const r2 = await fetch(api(`/api/docentes/${dni}/cursos/asignaciones`));
      const j2 = await r2.json();
      const list = (r2.ok && j2.ok && Array.isArray(j2.data)) ? j2.data : [];
      const map = {};
      for (const it of list) {
        if (!map[it.curso_id]) map[it.curso_id] = [];
        map[it.curso_id].push({ grado: it.grado, seccion: it.seccion, alumnos: it.alumnos, grado_id: it.grado_id, seccion_id: it.seccion_id });
      }
      setAsignaciones(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('dni');
    window.location.hash = '/acceso';
  };

  return (
    <div className="docente-layout">
      <aside className="docente-sidebar">
        <div className="sidebar-title">Docente</div>
        <nav className="sidebar-menu">
          <button className={vista === 'cursos' ? 'active' : ''} onClick={() => setVista('cursos')}>
            <BookOpen size={18} />
            <span>Mis cursos</span>
          </button>
          <button className={vista === 'boletas' ? 'active' : ''} onClick={() => setVista('boletas')}>
            <FileText size={18} />
            <span>Boletas</span>
          </button>
          <button className={vista === 'reportes' ? 'active' : ''} onClick={() => setVista('reportes')}>
            <BarChart3 size={18} />
            <span>Reportes</span>
          </button>
          <button onClick={cerrarSesion} className="logout-btn">
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </nav>
      </aside>

      <main className="docente-content">
        {vista === 'cursos' && (
          <Cursos
            docente={docente}
            cursos={cursos}
            loading={loading}
            asignaciones={asignaciones}
            onIrBoletas={(sel) => { setNotaSel(sel); setVista('boletas'); }}
          />
        )}

        {vista === 'boletas' && (<Boletas seleccion={notaSel} />)}

        {vista === 'reportes' && (<Reportes />)}
      </main>
    </div>
  );
}

export default DocenteHome;
