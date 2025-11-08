import React from 'react';

function DocenteHome() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-title">Docente</div>
        <nav className="sidebar-menu">
          <a href="#/docente" className="active">Mis cursos</a>
          <a href="#/docente/boletas">Boletas</a>
          <a href="#/docente/reportes">Reportes</a>
        </nav>
      </aside>
      <main className="content">
        <h1>Panel Docente</h1>
        <p>Consulta cursos, registra notas y genera reportes.</p>
      </main>
    </div>
  );
}

export default DocenteHome;