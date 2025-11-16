import React from 'react';

function AlumnosHome() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-title">Alumno</div>
        <nav className="sidebar-menu">
          <a href="#/alumnos" className="active">Mis notas</a>
          <a href="#/alumnos/perfil">Perfil</a>
        </nav>
      </aside>
      <main className="content">
        <h1>Panel Alumno</h1>
        <p>Consulta tus notas y actualiza tu perfil.</p>
      </main>
    </div>
  );
}

export default AlumnosHome;