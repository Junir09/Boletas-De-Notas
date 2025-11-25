import React, { useState } from 'react';
import { Home, UserPlus, GraduationCap, Users, BookOpen, Settings, LogOut } from 'lucide-react';

import RegistrarEstudiantes from './RegistrarEstudiantes';
import RegistrarDocentes from './RegistrarDocentes';
import ListaEstudiantes from './ListaEstudiantes';
import ListaDocentes from './ListaDocentes';
import ConfiguracionSistema from './ConfiguracionSistema';
import Cursos from './Cursos';
import AsignarGrados from './AsignarGrados';
import '../assets/css/admin/layout.css';
import '../assets/css/admin/sidebar.css';
import '../assets/css/admin/inicio.css';
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

          <button className={vista === 'asignar_grados' ? 'active' : ''} onClick={() => ir('asignar_grados')}>
            <GraduationCap size={18} />
            <span>Asignar grados</span>
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
          <div className="inicio-container">
            <h1>Panel Administrador</h1>
            <p className="intro">Bienvenido al sistema de gestión de boletas de notas. Aquí puedes administrar estudiantes, docentes, cursos y configuraciones del sistema.</p>
            
            <div className="funciones-grid">
              
              <div className="funcion-card" onClick={() => ir('registrar_estudiantes')}>
                <div className="funcion-icon">
                  <UserPlus size={24} />
                </div>
                <h3>Registrar Estudiantes</h3>
                <p>Registra estudiantes de forma individual o masiva mediante archivos Excel/CSV. Exporta plantillas y gestiona la información de los alumnos.</p>
              </div>

              <div className="funcion-card" onClick={() => ir('registrar_docentes')}>
                <div className="funcion-icon">
                  <GraduationCap size={24} />
                </div>
                <h3>Registrar Docentes</h3>
                <p>Agrega docentes al sistema con su DNI, nombre completo y descripción. El sistema genera automáticamente sus credenciales de acceso.</p>
              </div>

              <div className="funcion-card" onClick={() => ir('lista_estudiantes')}>
                <div className="funcion-icon">
                  <Users size={24} />
                </div>
                <h3>Lista de Estudiantes</h3>
                <p>Visualiza todos los estudiantes registrados en el sistema con su información completa: DNI, apellidos, nombres, grado y sección.</p>
              </div>

              <div className="funcion-card" onClick={() => ir('lista_docentes')}>
                <div className="funcion-icon">
                  <Users size={24} />
                </div>
                <h3>Lista de Docentes</h3>
                <p>Consulta y edita la información de los docentes. Asigna cursos, modifica datos personales y gestiona sus credenciales de acceso.</p>
              </div>

              <div className="funcion-card" onClick={() => ir('asignar_grados')}>
                <div className="funcion-icon">
                  <GraduationCap size={24} />
                </div>
                <h3>Asignar Grados</h3>
                <p>Asigna grados (1° a 6°) y secciones a los estudiantes. Busca por DNI, selecciona múltiples alumnos y promueve o baja de grado fácilmente.</p>
              </div>

              <div className="funcion-card" onClick={() => ir('cursos')}>
                <div className="funcion-icon">
                  <BookOpen size={24} />
                </div>
                <h3>Gestión de Cursos</h3>
                <p>Crea, edita y elimina cursos del sistema. Asigna cursos a docentes y gestiona las materias disponibles para cada grado.</p>
              </div>

              <div className="funcion-card" onClick={() => ir('config')}>
                <div className="funcion-icon">
                  <Settings size={24} />
                </div>
                <h3>Configuración del Sistema</h3>
                <p>Personaliza el título de bienvenida, logo institucional, grados disponibles y secciones. Configura los parámetros generales del sistema.</p>
              </div>

            </div>

            <div className="ayuda-section">
              <h3>¿Necesitas ayuda?</h3>
              <p>Usa el menú lateral para navegar entre las diferentes secciones. Cada módulo cuenta con instrucciones específicas para facilitar su uso.</p>
            </div>
          </div>
        )}
        {vista === 'registrar_estudiantes' && <RegistrarEstudiantes />}
        {vista === 'registrar_docentes' && <RegistrarDocentes />}
        {vista === 'lista_estudiantes' && <ListaEstudiantes />}
        {vista === 'lista_docentes' && <ListaDocentes />}
        {vista === 'config' && <ConfiguracionSistema />}
        {vista === 'cursos' && <Cursos />}
        {vista === 'asignar_grados' && <AsignarGrados />}
      </main>
    </div>
  );
}

export default AdminHome;
