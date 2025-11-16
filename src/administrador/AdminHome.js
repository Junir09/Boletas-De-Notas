import React, { useState } from 'react';
import { Home, UserPlus, GraduationCap, Users, BookOpen, Settings, LogOut } from 'lucide-react';

import RegistrarEstudiantes from './RegistrarEstudiantes';
import RegistrarDocentes from './RegistrarDocentes';
import ListaEstudiantes from './ListaEstudiantes';
import ListaDocentes from './ListaDocentes';
import ConfiguracionSistema from './ConfiguracionSistema';
import Cursos from './Cursos';
import '../assets/css/adminhome.css';
function AdminHome() {
  const [vista, setVista] = useState('inicio');

  const ir = (v) => setVista(v);
  const cerrarSesion = () => { window.location.hash = '/acceso'; };

  return (
    <div className="layout">
      
      {/* === SIDEBAR === */}
      <aside className="sidebar">
        <div className="sidebar-title">Administrador</div>

        <nav className="sidebar-menu">

          <button className={vista === 'inicio' ? 'active' : ''} onClick={() => ir('inicio')}>
            <Home size={18} />
            <span>Inicio</span>
          </button>

          <button className={vista === 'registrar_estudiantes' ? 'active' : ''} onClick={() => ir('registrar_estudiantes')}>
            <UserPlus size={18} />
            <span>Registrar estudiantes</span>
          </button>

          <button className={vista === 'registrar_docentes' ? 'active' : ''} onClick={() => ir('registrar_docentes')}>
            <GraduationCap size={18} />
            <span>Registrar docentes</span>
          </button>

          <button className={vista === 'lista_estudiantes' ? 'active' : ''} onClick={() => ir('lista_estudiantes')}>
            <Users size={18} />
            <span>Lista estudiantes</span>
          </button>

          <button className={vista === 'lista_docentes' ? 'active' : ''} onClick={() => ir('lista_docentes')}>
            <Users size={18} />
            <span>Lista docentes</span>
          </button>

          <button className={vista === 'cursos' ? 'active' : ''} onClick={() => ir('cursos')}>
            <BookOpen size={18} />
            <span>Cursos</span>
          </button>

          <button className={vista === 'config' ? 'active' : ''} onClick={() => ir('config')}>
            <Settings size={18} />
            <span>Configuración</span>
          </button>

          <button onClick={cerrarSesion} className="logout-btn">
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>

        </nav>
      </aside>

      {/* === CONTENIDO === */}
      <main className="content">
        {vista === 'inicio' && (
          <>
            <h1>Panel Administrador</h1>
            <p>Gestiona usuarios, boletas y parámetros del sistema.</p>
            <p>Usa el menú para registrar estudiantes o docentes, importar/exportar información y más.</p>
          </>
        )}
        {vista === 'registrar_estudiantes' && <RegistrarEstudiantes />}
        {vista === 'registrar_docentes' && <RegistrarDocentes />}
        {vista === 'lista_estudiantes' && <ListaEstudiantes />}
        {vista === 'lista_docentes' && <ListaDocentes />}
        {vista === 'config' && <ConfiguracionSistema />}
        {vista === 'cursos' && <Cursos />}
      </main>
    </div>
  );
}

export default AdminHome;
