import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api';

export default function Cursos({ docente = null, cursos = [], loading = false, asignaciones = {}, onIrBoletas }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAlumnos, setModalAlumnos] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [cursoActual, setCursoActual] = useState(null);
  const scrollRef = useRef(null);
  const [scrollMax, setScrollMax] = useState(0);
  const [scrollVal, setScrollVal] = useState(0);

  const verAlumnos = async (curso) => {
    setCursoActual(curso);
    setModalOpen(true);
    setModalLoading(true);
    try {
      const dni = localStorage.getItem('dni') || '';
      const resp = await fetch(api(`/api/docentes/${dni}/cursos/${curso.id}/estudiantes`));
      const json = await resp.json();
      setModalAlumnos(json.ok && Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setModalAlumnos([]);
    } finally {
      setModalLoading(false);
    }
  };

  const cerrarModal = () => { setModalOpen(false); setModalAlumnos([]); setCursoActual(null); };
  useEffect(() => {
    const updateScroll = () => {
      if (!scrollRef.current) return;
      const max = Math.max(0, scrollRef.current.scrollWidth - scrollRef.current.clientWidth);
      setScrollMax(max);
      setScrollVal(scrollRef.current.scrollLeft);
    };
    updateScroll();
    window.addEventListener('resize', updateScroll);
    return () => window.removeEventListener('resize', updateScroll);
  }, [modalAlumnos, modalOpen]);
  return (
    <>
      <h1>{`Bienvenido${docente && docente.nombre ? ` ${docente.nombre}` : ''}`}</h1>
      <p>Mis Cursos</p>
      <p>Gestiona tus cursos asignados y consulta sus estudiantes.</p>
      {loading && <p>Cargando...</p>}
      {!loading && cursos.length === 0 && <p>No tienes cursos asignados.</p>}
      {!loading && cursos.length > 0 && (
        <div className="cursos-grid">
          {cursos.map(c => (
            <div key={c.id} className="curso-card">
              <h3>{c.nombre}</h3>
              <p>{c.descripcion || 'Sin descripción'}</p>
              <span className="badge" onClick={() => verAlumnos(c)}>{(c.alumnos ?? 0)} alumnos</span>
              {Array.isArray(asignaciones[c.id]) && asignaciones[c.id].length > 0 && (
                <div className="inline-actions" style={{ marginTop: 8 }}>
                  {asignaciones[c.id].map((a, idx) => (
                    <button key={idx} className="badge" onClick={() => onIrBoletas && onIrBoletas({ cursoId: c.id, cursoNombre: c.nombre, gradoId: a.grado_id, gradoNombre: a.grado, seccionId: a.seccion_id, seccionNombre: a.seccion })}>
                      {a.grado}{a.seccion ? ` ${a.seccion}` : ''}: {a.alumnos}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{cursoActual ? cursoActual.nombre : 'Estudiantes'}</h3>
              <button className="close" onClick={cerrarModal}>×</button>
            </div>
            <div className="modal-body">
              {modalLoading && <p>Cargando alumnos...</p>}
              {!modalLoading && (
                <div className="estudiantes-table">
                  <div className="table-scroll">
                    <div className="scroll-area" ref={scrollRef} onScroll={() => setScrollVal(scrollRef.current ? scrollRef.current.scrollLeft : 0)}>
                      <table>
                        <thead>
                          <tr>
                            <th>DNI</th>
                            <th>Apellidos</th>
                            <th>Nombres</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modalAlumnos.map(a => (
                            <tr key={a.dni}>
                              <td>{a.dni}</td>
                              <td>{a.apellidos}</td>
                              <td>{a.nombres}</td>
                            </tr>
                          ))}
                          {modalAlumnos.length === 0 && (
                            <tr><td colSpan={3}>Sin alumnos</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {scrollMax > 0 && (
                      <div className="scroll-controls">
                        <input
                          type="range"
                          className="scroll-slider"
                          min={0}
                          max={scrollMax}
                          value={scrollVal}
                          onChange={e => {
                            const v = Number(e.target.value);
                            setScrollVal(v);
                            if (scrollRef.current) scrollRef.current.scrollLeft = v;
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
