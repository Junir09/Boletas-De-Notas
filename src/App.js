import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginAvanzado from './pages/LoginAvanzado';
import StudentLogin from './pages/StudentLogin';
import DocenteHome from './Docente/DocenteHome';
import AdminHome from './administrador/AdminHome';
import AlumnosHome from './Alumnos/AlumnosHome';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<StudentLogin />} />
        <Route path="/acceso" element={<LoginAvanzado />} />
        <Route path="/docente" element={<DocenteHome />} />
        <Route path="/administrador" element={<AdminHome />} />
        <Route path="/alumnos" element={<AlumnosHome />} />
        {/* Redireccionar cualquier ruta desconocida al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
