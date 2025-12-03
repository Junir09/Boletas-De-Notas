import React, { useEffect, useState } from 'react';
import '../assets/css/admin/layout.css';
import '../assets/css/admin/sidebar.css';
import '../assets/css/alumnos/alumnoshome.css';
import { BookOpen, FileText, LogOut } from 'lucide-react';
import { api } from '../api';
import Cursos from './Cursos';
import Boletines from './Boletines';

function AlumnosHome() {
  const [vista, setVista] = useState('cursos');
  const [alumno, setAlumno] = useState(null);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [cursoSel, setCursoSel] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => { cargarBase(); }, []);

  const cargarBase = async () => {
    try {
      const dni = localStorage.getItem('dni') || '';
      if (!dni) return;
      const rE = await fetch(api('/api/estudiantes'));
      const jE = await rE.json();
      const est = (rE.ok && jE.ok && Array.isArray(jE.data)) ? jE.data.find(e => String(e.dni) === dni) : null;
      setAlumno(est || null);
      const rG = await fetch(api('/api/grados'));
      const jG = await rG.json();
      setGrados((rG.ok && jG.ok && Array.isArray(jG.data)) ? jG.data : []);
      const rS = await fetch(api('/api/secciones'));
      const jS = await rS.json();
      setSecciones((rS.ok && jS.ok && Array.isArray(jS.data)) ? jS.data : []);
      await cargarCursosAlumno(est, jG.data, jS.data);
    } catch (e) {
      setAlumno(null);
      setCursos([]);
    }
  };

  const cargarCursosAlumno = async (est, gradosData = [], seccionesData = []) => {
    if (!est) return;
    try {
      const norm = (s) => String(s || '').trim().toUpperCase();
      const ordinalToNum = {
        'PRIMERO': 1, 'SEGUNDO': 2, 'TERCERO': 3,
        'CUARTO': 4, 'QUINTO': 5, 'SEXTO': 6
      };
      const resolveGradoId = () => {
        if (est.grado_id) return est.grado_id;
        const raw = norm(est.grado);
        const m = raw.match(/\d+/);
        const num = m ? Number(m[0]) : (ordinalToNum[raw] || 0);
        if (num) {
          const name1 = `${num}°`;
          const g1 = (gradosData || []).find(g => norm(g.nombre) === norm(name1));
          if (g1) return g1.id;
          const g2 = (gradosData || []).find(g => norm(g.nombre).includes(String(num)));
          if (g2) return g2.id;
        }
        const g = (gradosData || []).find(g => norm(g.nombre) === raw);
        return g ? g.id : 0;
      };
      const resolveSeccionId = () => {
        if (est.seccion_id != null) return est.seccion_id;
        const raw = norm(est.seccion);
        if (!raw) return null;
        const s = (seccionesData || []).find(x => norm(x.nombre) === raw);
        return s ? s.id : null;
      };
      const gradoId = resolveGradoId();
      const seccionId = resolveSeccionId();
      const rCG = await fetch(api('/api/curso-grado'));
      const jCG = await rCG.json();
      const list = (rCG.ok && jCG.ok && Array.isArray(jCG.data)) ? jCG.data : [];
      const filtrados = list.filter(x => x.grado_id === gradoId && (x.seccion_id == null || x.seccion_id === seccionId));
      const uniq = [];
      for (const it of filtrados) {
        if (!uniq.find(u => u.id === it.curso_id)) uniq.push({ id: it.curso_id, nombre: it.curso });
      }
      const docentesFetch = await Promise.all(uniq.map(async c => {
        try {
          const r = await fetch(api(`/api/cursos/${c.id}/docentes`));
          const j = await r.json();
          const list = (r.ok && j.ok && Array.isArray(j.data)) ? j.data : [];
          return { id: c.id, docentes: list.map(d => ({ dni: d.dni, nombre: d.nombre })) };
        } catch (_) { return { id: c.id, docentes: [] }; }
      }));
      const docentesMap = Object.fromEntries(docentesFetch.map(x => [x.id, x.docentes]));
      const uniqueDocentes = [];
      for (const arr of Object.values(docentesMap)) {
        for (const d of arr) {
          if (!uniqueDocentes.find(u => u.dni === d.dni)) uniqueDocentes.push(d);
        }
      }
      const docenteCursosArr = await Promise.all(uniqueDocentes.map(async d => {
        try {
          const r = await fetch(api(`/api/docentes/${d.dni}/cursos`));
          const j = await r.json();
          const list = (r.ok && j.ok && Array.isArray(j.data)) ? j.data : [];
          return { dni: d.dni, cursos: list.map(x => x.nombre) };
        } catch (_) { return { dni: d.dni, cursos: [] }; }
      }));
      const docenteCursosMap = Object.fromEntries(docenteCursosArr.map(x => [x.dni, x.cursos]));
      const withDocentes = uniq.map(c => ({
        ...c,
        docentes: (docentesMap[c.id] || []).map(d => ({ ...d, cursosDocente: docenteCursosMap[d.dni] || [] }))
      }));
      setCursos(withDocentes);
      if (withDocentes.length > 0) setCursoSel(withDocentes[0].id);
    } catch (_) { setCursos([]); }
  };

  

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-title">Alumno</div>
        <nav className="sidebar-menu">
          <button className={vista === 'cursos' ? 'active' : ''} onClick={() => setVista('cursos')}>
            <BookOpen size={18} />
            <span>Mis cursos</span>
          </button>
          <button className={vista === 'boletas' ? 'active' : ''} onClick={() => setVista('boletas')}>
            <FileText size={18} />
            <span>Boletas</span>
          </button>
          <button onClick={() => { try { localStorage.removeItem('dni'); } catch {} window.location.hash = '#/'; }}>
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </nav>
      </aside>
      <main className="content alumnos-content">
        {vista === 'cursos' && (
          <Cursos alumno={alumno} cursos={cursos} onIrBoletines={(id) => { setCursoSel(id); setVista('boletas'); }} />
        )}

        {vista === 'boletas' && (
          <Boletines alumno={alumno} cursos={cursos} cursoSel={cursoSel} onChangeCursoSel={(id) => setCursoSel(id)} />
        )}
      </main>
    </div>
  );
}

export default AlumnosHome;
