import React, { useState } from 'react';
import RegistrarEstudiantes from './RegistrarEstudiantes';
import RegistrarDocentes from './RegistrarDocentes';
import ListaEstudiantes from './ListaEstudiantes';
import ListaDocentes from './ListaDocentes';
import ConfiguracionSistema from './ConfiguracionSistema';
import Cursos from './Cursos';

function AdminHome() {
  const [vista, setVista] = useState('inicio');

  const ir = (v) => setVista(v);
  const cerrarSesion = () => { window.location.hash = '#/acceso'; };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-title">Administrador</div>
        <nav className="sidebar-menu">
          <button onClick={() => ir('inicio')}>Inicio</button>
          <button onClick={() => ir('registrar_estudiantes')}>Registrar estudiantes</button>
          <button onClick={() => ir('registrar_docentes')}>Registrar docentes</button>
          <button onClick={() => ir('lista_estudiantes')}>Lista de estudiantes</button>
          <button onClick={() => ir('lista_docentes')}>Lista de docentes</button>
          <button onClick={() => ir('config')}>Configuración del sistema</button>
          <button onClick={() => ir('cursos')}>Cursos</button>
          <button onClick={cerrarSesion}>Cerrar sesión</button>
        </nav>
      </aside>
      <main className="content">
        {vista === 'inicio' && (
          <>
            <h1>Panel Administrador</h1>
            <p>Gestiona usuarios, boletas y parámetros del sistema.</p>
            <p>Usa el menú para registrar estudiantes o docentes, importar/exportar desde Excel, y cerrar sesión.</p>
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