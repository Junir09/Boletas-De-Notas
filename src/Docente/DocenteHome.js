import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, BarChart3, LogOut } from 'lucide-react';
import '../assets/css/admin/layout.css';
import '../assets/css/admin/sidebar.css';
import '../assets/css/docentehome.css';
import { api } from '../api';

function DocenteHome() {
  const [vista, setVista] = useState('cursos');
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vista === 'cursos') {
      cargarCursos();
    }
  }, [vista]);

  const cargarCursos = async () => {
    setLoading(true);
    try {
      const dni = localStorage.getItem('dni') || '';
      if (!dni) return;
      const resp = await fetch(api(`/api/docentes/${dni}/cursos`));
      const json = await resp.json();
      setCursos(json.ok && Array.isArray(json.data) ? json.data : []);
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
    <div className="layout">
      <aside className="sidebar">
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

      <main className="content">
        {vista === 'cursos' && (
          <>
            <h1>Mis Cursos</h1>
            <p>Gestiona tus cursos asignados y registra notas de estudiantes.</p>
            {loading && <p>Cargando...</p>}
            {!loading && cursos.length === 0 && <p>No tienes cursos asignados.</p>}
            {!loading && cursos.length > 0 && (
              <div className="cursos-grid">
                {cursos.map(c => (
                  <div key={c.id} className="curso-card">
                    <h3>{c.nombre}</h3>
                    <p>Gestiona las notas y asistencia de este curso.</p>
                    <span className="badge">Ver detalles</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {vista === 'boletas' && (
          <>
            <h1>Boletas</h1>
            <p>Genera y consulta boletas de notas de tus estudiantes.</p>
            <div className="notas-form">
              <h3>Próximamente</h3>
              <p>Esta funcionalidad estará disponible pronto.</p>
            </div>
          </>
        )}

        {vista === 'reportes' && (
          <>
            <h1>Reportes</h1>
            <p>Consulta estadísticas y reportes de rendimiento académico.</p>
            <div className="notas-form">
              <h3>Próximamente</h3>
              <p>Esta funcionalidad estará disponible pronto.</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default DocenteHome;