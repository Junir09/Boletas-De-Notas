import React, { useEffect, useState } from 'react';
import '../assets/css/alumnos/boletines.css';
import { api } from '../api';

export default function Boletines({ alumno, cursos, cursoSel, onChangeCursoSel }) {
  const [actividades, setActividades] = useState([]);
  const [notas, setNotas] = useState({});
  const [loading, setLoading] = useState(false);

  const notaALetra = (notaNum) => {
    if (notaNum == null || isNaN(notaNum)) return '-';
    const n = Math.round(Number(notaNum));
    if (n >= 19) return 'A++';
    if (n === 18) return 'A+';
    if (n === 17) return 'A';
    if (n === 16) return 'B+';
    if (n === 15) return 'B';
    if (n === 14) return 'C+';
    if (n === 13) return 'C';
    if (n === 12) return 'D+';
    if (n === 11) return 'D';
    return '-F';
  };

  useEffect(() => {
    if (alumno && cursoSel) cargarBoletas(cursoSel);
  }, [alumno, cursoSel]);

  const cargarBoletas = async (cursoId) => {
    if (!alumno || !cursoId) return;
    setLoading(true);
    try {
      let gradoId = alumno.grado_id || 0;
      let seccionId = (alumno.seccion_id != null ? alumno.seccion_id : null);
      const norm = (s) => String(s || '').trim().toUpperCase();
      if (!gradoId) {
        try {
          const rG = await fetch(api('/api/grados'));
          const jG = await rG.json();
          const grados = (rG.ok && jG.ok && Array.isArray(jG.data)) ? jG.data : [];
          const ordinalToNum = { 'PRIMERO':1,'SEGUNDO':2,'TERCERO':3,'CUARTO':4,'QUINTO':5,'SEXTO':6 };
          const raw = norm(alumno.grado);
          const m = raw.match(/\d+/);
          const num = m ? Number(m[0]) : (ordinalToNum[raw] || 0);
          if (num) {
            const name1 = `${num}°`;
            const g1 = (grados || []).find(g => norm(g.nombre) === norm(name1));
            gradoId = g1 ? g1.id : ((grados || []).find(g => norm(g.nombre).includes(String(num)))?.id || 0);
          } else {
            gradoId = (grados || []).find(g => norm(g.nombre) === raw)?.id || 0;
          }
        } catch (_) {}
      }
      if (seccionId == null) {
        try {
          const rS = await fetch(api('/api/secciones'));
          const jS = await rS.json();
          const secciones = (rS.ok && jS.ok && Array.isArray(jS.data)) ? jS.data : [];
          const rawS = norm(alumno.seccion);
          if (rawS) {
            const s = (secciones || []).find(x => norm(x.nombre) === rawS);
            seccionId = s ? s.id : null;
          }
        } catch (_) {}
      }
      const qsActs = `?curso_id=${cursoId}&grado_id=${gradoId}` + (seccionId ? `&seccion_id=${seccionId}` : '');
      const rB = await fetch(api(`/api/curso-actividades${qsActs}`));
      const jB = await rB.json();
      const listActs = (rB.ok && jB.ok && Array.isArray(jB.data)) ? jB.data : [];
      setActividades(listActs);
      const notasInicial = {};
      const dni = String(alumno.dni);
      for (const act of listActs) {
        const r = await fetch(api(`/api/actividad-notas?actividad_id=${act.id}`));
        const j = await r.json();
        const m = {};
        if (r.ok && j.ok && Array.isArray(j.data)) {
          const row = j.data.find(row => String(row.estudiante_dni) === dni);
          if (row) m[dni] = row.nota ?? '';
        }
        notasInicial[act.id] = m;
      }
      setNotas(notasInicial);
    } catch (e) {
      setActividades([]); setNotas({});
    } finally { setLoading(false); }
  };

  const exportPDF = async () => {
    if (!alumno || !cursoSel || actividades.length === 0) return;
    const cursoNom = (cursos.find(c => c.id === cursoSel)?.nombre) || '';
    const title = `Boletín ${cursoNom} - ${alumno.apellidos} ${alumno.nombres}${alumno.grado ? ` - ${alumno.grado}°${alumno.seccion ? ` ${alumno.seccion}` : ''}` : ''}`;
    const headCols = ['Actividad','Nota'];
    const bodyRows = actividades.map(a => {
      const v = (notas[a.id] && notas[a.id][alumno.dni]) !== undefined ? notas[a.id][alumno.dni] : '';
      const num = v === '' || v == null ? '' : Number(v);
      const nota = typeof num === 'number' && !isNaN(num) ? num.toFixed(2) : String(v ?? '');
      return [a.nombre, nota];
    });
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      doc.setFontSize(16);
      doc.text(title, 40, 40);
      const fecha = new Date();
      doc.setFontSize(10);
      doc.text(`Generado: ${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`, 40, 58);
      autoTable(doc, {
        head: [headCols],
        body: bodyRows,
        startY: 80,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [243, 244, 246], textColor: 20 },
        margin: { left: 40, right: 40 }
      });
      const fname = `boletin_${alumno.dni || 'alumno'}_${cursoNom || 'curso'}.pdf`;
      doc.save(fname);
    } catch (_) {}
  };

  const exportPDFActividad = async (act) => {
    if (!alumno || !cursoSel || !act) return;
    const cursoObj = cursos.find(c => c.id === cursoSel) || {};
    const cursoNom = cursoObj.nombre || '';
    const docentes = Array.isArray(cursoObj.docentes) ? cursoObj.docentes.map(d => (typeof d === 'string' ? d : d.nombre)).join(', ') : '';
    const v = (notas[act.id] && notas[act.id][alumno.dni]) !== undefined ? notas[act.id][alumno.dni] : '';
    const num = v === '' || v == null ? null : Number(v);
    const notaNum = typeof num === 'number' && !isNaN(num) ? num : null;
    const letra = notaALetra(notaNum);
    const anio = String(new Date().getFullYear());
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      doc.setFillColor(104, 126, 122);
      doc.rect(0, 0, W, 120, 'F');
      doc.setFillColor(216, 179, 99);
      doc.rect(0, 60, 140, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('Boletín de Notas', 40, 40);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.circle(W - 60, 40, 16, 'S');
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(225, 229, 233);
      doc.rect(40, 130, 110, 26, 'F');
      doc.rect(40, 160, 110, 26, 'F');
      doc.rect(40, 190, 110, 26, 'F');
      doc.rect(40, 220, 110, 26, 'F');
      doc.setFontSize(11);
      doc.text('NOMBRE:', 50, 147);
      doc.text('GRADO:', 50, 177);
      doc.text('PROFESOR:', 50, 207);
      doc.text('AÑO ESCOLAR:', 50, 237);
      doc.setFontSize(12);
      doc.text(`${alumno.apellidos} ${alumno.nombres}`, 160, 147);
      doc.text(`${alumno.grado ? alumno.grado + '°' : ''}${alumno.seccion ? ' ' + alumno.seccion : ''}`, 160, 177);
      doc.text(docentes || '(no asignado)', 160, 207);
      doc.text(anio, 160, 237);
      doc.setDrawColor(104, 126, 122);
      doc.line(40, 260, W - 40, 260);
      const headCols = ['Actividad', 'Nota', 'Letra'];
      const bodyRows = [[act.nombre, notaNum != null ? notaNum.toFixed(2) : '-', letra || '-']];
      autoTable(doc, {
        head: [headCols],
        body: bodyRows,
        startY: 270,
        styles: { fontSize: 11 },
        headStyles: { fillColor: [225, 229, 233], textColor: 20 },
        margin: { left: 40, right: 40 }
      });
      doc.setFontSize(9);
      doc.text('www.escolar - Dirección - Teléfono', 40, doc.internal.pageSize.getHeight() - 30);
      const fname = `boletin_${alumno.dni || 'alumno'}_${cursoNom || 'curso'}_${act.nombre}.pdf`;
      doc.save(fname);
    } catch (_) {}
  };

  const exportPDFCurso = async () => {
    if (!alumno || !cursoSel || actividades.length === 0) return;
    const cursoObj = cursos.find(c => c.id === cursoSel) || {};
    const cursoNom = cursoObj.nombre || '';
    const docentes = Array.isArray(cursoObj.docentes) ? cursoObj.docentes.map(d => (typeof d === 'string' ? d : d.nombre)).join(', ') : '';
    const anio = String(new Date().getFullYear());
    const rows = actividades.map(a => {
      const v = (notas[a.id] && notas[a.id][alumno.dni]) !== undefined ? notas[a.id][alumno.dni] : '';
      const num = v === '' || v == null ? null : Number(v);
      const notaNum = typeof num === 'number' && !isNaN(num) ? num : null;
      const letra = notaALetra(notaNum);
      return [a.nombre, notaNum != null ? notaNum.toFixed(2) : '-', letra];
    });
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      doc.setFillColor(104, 126, 122);
      doc.rect(0, 0, W, 120, 'F');
      doc.setFillColor(216, 179, 99);
      doc.rect(0, 60, 140, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('Boletín de Notas', 40, 40);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.circle(W - 60, 40, 16, 'S');
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(225, 229, 233);
      doc.rect(40, 130, 110, 26, 'F');
      doc.rect(40, 160, 110, 26, 'F');
      doc.rect(40, 190, 110, 26, 'F');
      doc.rect(40, 220, 110, 26, 'F');
      doc.setFontSize(11);
      doc.text('NOMBRE:', 50, 147);
      doc.text('GRADO:', 50, 177);
      doc.text('PROFESOR:', 50, 207);
      doc.text('AÑO ESCOLAR:', 50, 237);
      doc.setFontSize(12);
      doc.text(`${alumno.apellidos} ${alumno.nombres}`, 160, 147);
      doc.text(`${alumno.grado ? alumno.grado + '°' : ''}${alumno.seccion ? ' ' + alumno.seccion : ''}`, 160, 177);
      doc.text(docentes || '(no asignado)', 160, 207);
      doc.text(anio, 160, 237);
      doc.setDrawColor(104, 126, 122);
      doc.line(40, 260, W - 40, 260);
      const headCols = ['Actividad', 'Nota', 'Letra'];
      autoTable(doc, {
        head: [headCols],
        body: rows,
        startY: 270,
        styles: { fontSize: 11 },
        headStyles: { fillColor: [225, 229, 233], textColor: 20 },
        margin: { left: 40, right: 40 }
      });
      doc.setFontSize(9);
      doc.text('www.escolar - Dirección - Teléfono', 40, doc.internal.pageSize.getHeight() - 30);
      const fname = `boletin_${alumno.dni || 'alumno'}_${cursoNom || 'curso'}.pdf`;
      doc.save(fname);
    } catch (_) {}
  };

  const exportPDFTodosCursos = async () => {
    if (!alumno || !Array.isArray(cursos) || cursos.length === 0) return;
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const anio = String(new Date().getFullYear());
      for (let idx = 0; idx < cursos.length; idx++) {
        const cursoObj = cursos[idx];
        const cursoNom = cursoObj.nombre || '';
        const docentes = Array.isArray(cursoObj.docentes) ? cursoObj.docentes.map(d => (typeof d === 'string' ? d : d.nombre)).join(', ') : '';
        if (idx > 0) doc.addPage();
        doc.setFillColor(104, 126, 122);
        doc.rect(0, 0, W, 120, 'F');
        doc.setFillColor(216, 179, 99);
        doc.rect(0, 60, 140, 28, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('Boletín de Notas', 40, 40);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.circle(W - 60, 40, 16, 'S');
        doc.setTextColor(0, 0, 0);
        doc.setFillColor(225, 229, 233);
        doc.rect(40, 130, 110, 26, 'F');
        doc.rect(40, 160, 110, 26, 'F');
        doc.rect(40, 190, 110, 26, 'F');
        doc.rect(40, 220, 110, 26, 'F');
        doc.setFontSize(11);
        doc.text('NOMBRE:', 50, 147);
        doc.text('GRADO:', 50, 177);
        doc.text('PROFESOR:', 50, 207);
        doc.text('AÑO ESCOLAR:', 50, 237);
        doc.setFontSize(12);
        doc.text(`${alumno.apellidos} ${alumno.nombres}`, 160, 147);
        doc.text(`${alumno.grado ? alumno.grado + '°' : ''}${alumno.seccion ? ' ' + alumno.seccion : ''}`, 160, 177);
        doc.text(docentes || '(no asignado)', 160, 207);
        doc.text(anio, 160, 237);
        doc.setDrawColor(104, 126, 122);
        doc.line(40, 260, W - 40, 260);
        let gradoId = alumno.grado_id || 0;
        let seccionId = (alumno.seccion_id != null ? alumno.seccion_id : null);
        const norm = (s) => String(s || '').trim().toUpperCase();
        if (!gradoId) {
          try {
            const rG = await fetch(api('/api/grados'));
            const jG = await rG.json();
            const grados = (rG.ok && jG.ok && Array.isArray(jG.data)) ? jG.data : [];
            const ordinalToNum = { 'PRIMERO':1,'SEGUNDO':2,'TERCERO':3,'CUARTO':4,'QUINTO':5,'SEXTO':6 };
            const raw = norm(alumno.grado);
            const m = raw.match(/\d+/);
            const num = m ? Number(m[0]) : (ordinalToNum[raw] || 0);
            if (num) {
              const name1 = `${num}°`;
              const g1 = (grados || []).find(g => norm(g.nombre) === norm(name1));
              gradoId = g1 ? g1.id : ((grados || []).find(g => norm(g.nombre).includes(String(num)))?.id || 0);
            } else {
              gradoId = (grados || []).find(g => norm(g.nombre) === raw)?.id || 0;
            }
          } catch (_) {}
        }
        if (seccionId == null) {
          try {
            const rS = await fetch(api('/api/secciones'));
            const jS = await rS.json();
            const secciones = (rS.ok && jS.ok && Array.isArray(jS.data)) ? jS.data : [];
            const rawS = norm(alumno.seccion);
            if (rawS) {
              const s = (secciones || []).find(x => norm(x.nombre) === rawS);
              seccionId = s ? s.id : null;
            }
          } catch (_) {}
        }
        const qsActs = `?curso_id=${cursoObj.id}&grado_id=${gradoId}` + (seccionId ? `&seccion_id=${seccionId}` : '');
        const rB = await fetch(api(`/api/curso-actividades${qsActs}`));
        const jB = await rB.json();
        const listActs = (rB.ok && jB.ok && Array.isArray(jB.data)) ? jB.data : [];
        const rows = [];
        for (const a of listActs) {
          try {
            const r = await fetch(api(`/api/actividad-notas?actividad_id=${a.id}`));
            const j = await r.json();
            const v = (r.ok && j.ok && Array.isArray(j.data)) ? (j.data.find(row => String(row.estudiante_dni) === String(alumno.dni))?.nota ?? null) : null;
            const notaNum = v != null ? Number(v) : null;
            const letra = notaALetra(notaNum);
            rows.push([a.nombre, notaNum != null ? notaNum.toFixed(2) : '-', letra]);
          } catch (_) {
            rows.push([a.nombre, '-', '-']);
          }
        }
        const headCols = ['Actividad', 'Nota', 'Letra'];
        autoTable(doc, {
          head: [headCols],
          body: rows,
          startY: 270,
          styles: { fontSize: 11 },
          headStyles: { fillColor: [225, 229, 233], textColor: 20 },
          margin: { left: 40, right: 40 }
        });
        doc.setFontSize(9);
        doc.text('www.escolar - Dirección - Teléfono', 40, H - 30);
      }
      const fname = `boletin_${alumno.dni || 'alumno'}_todos_cursos.pdf`;
      doc.save(fname);
    } catch (_) {}
  };

  return (
    <div>
      <h1>Boletas</h1>
      <div className="inline-actions" style={{ marginBottom: 12 }}>
        <label>Curso</label>
        <select value={cursoSel || ''} onChange={e => onChangeCursoSel && onChangeCursoSel(Number(e.target.value) || 0)}>
          {cursos.map(c => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
        </select>
        <button onClick={exportPDFCurso} disabled={actividades.length === 0 || loading}>PDF curso</button>
        <button onClick={exportPDFTodosCursos} disabled={!cursos || cursos.length === 0 || loading}>PDF todos</button>
      </div>
      <div className="estudiantes-table">
        <div className="table-scroll">
          <div className={`scroll-area${(actividades.length === 0) ? ' no-data' : ''}`} style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Actividad</th>
                  <th>Descargar</th>
                </tr>
              </thead>
              <tbody>
                {actividades.map(a => (
                  <tr key={a.id}>
                    <td>{a.nombre}</td>
                    <td><button onClick={() => exportPDFActividad(a)} disabled={loading}>PDF</button></td>
                  </tr>
                ))}
                {actividades.length === 0 && (
                  <tr><td colSpan={2}>{loading ? 'Cargando...' : 'Sin actividades'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
