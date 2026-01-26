import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginEstudiante from './pages/LoginEstudiante';
import LoginAvanzado from './pages/LoginAvanzado';
import DocenteHome from './Docente/DocenteHome';
import AdminHome from './administrador/AdminHome';
import AlumnosHome from './Alumnos/AlumnosHome';

function App() {
  return (
    <Routes>
       <Route path="/" element={<LoginEstudiante />} />
       <Route path="/acceso" element={<LoginAvanzado />} />
       <Route path="/docente/:uuid" element={<DocenteHome />} />
       <Route path="/administrador/:uuid" element={<AdminHome />} />
       <Route path="/alumnos/:uuid" element={<AlumnosHome />} />
       {/* Fallback for unknown routes */}
       <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
