import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Reportes() {
  const [cursos, setCursos] = useState([]);
  const [asignaciones, setAsignaciones] = useState({});
  const [cursoId, setCursoId] = useState(0);
  const [gradoId, setGradoId] = useState(0);
  const [seccionId, setSeccionId] = useState(0);
  const [alumnos, setAlumnos] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [notas, setNotas] = useState({});
  const [loading, setLoading] = useState(false);
  const [dniAlumno, setDniAlumno] = useState('');
  const [soloAlumno, setSoloAlumno] = useState(false);

  useEffect(() => {
    cargarBase();
  }, []);

  const cargarBase = async () => {
    try {
      const dni = localStorage.getItem('dni') || '';
      if (!dni) return;
      const resp = await fetch(api(`/api/docentes/${dni}/cursos`));
      const json = await resp.json();
      const dataCursos = json.ok && Array.isArray(json.data) ? json.data : [];
      setCursos(dataCursos);
      const r2 = await fetch(api(`/api/docentes/${dni}/cursos/asignaciones`));
      const j2 = await r2.json();
      const list = (r2.ok && j2.ok && Array.isArray(j2.data)) ? j2.data : [];
      const map = {};
      for (const it of list) {
        if (!map[it.curso_id]) map[it.curso_id] = [];
        map[it.curso_id].push({ grado: it.grado, seccion: it.seccion, alumnos: it.alumnos, grado_id: it.grado_id, seccion_id: it.seccion_id });
      }
      setAsignaciones(map);
    } catch (e) {
      setCursos([]);
      setAsignaciones({});
    }
  };

  const cargarDatos = async () => {
    if (!cursoId) return;
    setLoading(true);
    try {
      const dni = localStorage.getItem('dni') || '';
      const qsAlum = `?${gradoId ? `grado_id=${gradoId}` : ''}${seccionId ? `${gradoId ? '&' : ''}seccion_id=${seccionId}` : ''}`;
      const rA = await fetch(api(`/api/docentes/${dni}/cursos/${cursoId}/estudiantes${qsAlum}`));
      const jA = await rA.json();
      const listAlumnos = (rA.ok && jA.ok && Array.isArray(jA.data)) ? jA.data : [];
      const filtrados = soloAlumno && dniAlumno.trim() ? listAlumnos.filter(a => String(a.dni) === dniAlumno.trim()) : listAlumnos;
      setAlumnos(filtrados);
      const qsActs = `?curso_id=${cursoId}${gradoId ? `&grado_id=${gradoId}` : ''}${seccionId ? `&seccion_id=${seccionId}` : ''}`;
      const rB = await fetch(api(`/api/curso-actividades${qsActs}`));
      const jB = await rB.json();
      const listActs = (rB.ok && jB.ok && Array.isArray(jB.data)) ? jB.data : [];
      setActividades(listActs);
      const notasInicial = {};
      for (const act of listActs) {
        const r = await fetch(api(`/api/actividad-notas?actividad_id=${act.id}`));
        const j = await r.json();
        const m = {};
        if (r.ok && j.ok && Array.isArray(j.data)) {
          for (const row of j.data) { m[row.estudiante_dni] = row.nota ?? ''; }
        }
        notasInicial[act.id] = m;
      }
      setNotas(notasInicial);
    } catch (e) {
      setAlumnos([]);
      setActividades([]);
      setNotas({});
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (alumnos.length === 0) return;
    const cursoNom = (cursos.find(c => c.id === cursoId)?.nombre) || '';
    const gradoNom = (asignaciones[cursoId]?.find(x => x.grado_id === gradoId)?.grado) || '';
    const secNom = (asignaciones[cursoId]?.find(x => x.seccion_id === seccionId)?.seccion) || '';
    const fecha = new Date();
    const meta = [
      ['Reporte', `${cursoNom}${gradoNom ? ` - ${gradoNom}` : ''}${secNom ? ` ${secNom}` : ''}`],
      ['Generado', `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`],
      ['Total alumnos', String(alumnos.length)],
      soloAlumno && dniAlumno ? ['Filtro DNI', dniAlumno] : null
    ].filter(Boolean);
    const headers = ['DNI', 'Apellidos', 'Nombres', ...actividades.map(a => a.nombre)];
    const rows = alumnos.map(a => {
      const cols = [a.dni, a.apellidos, a.nombres];
      for (const act of actividades) {
        const v = (notas[act.id] && notas[act.id][a.dni]) !== undefined ? notas[act.id][a.dni] : '';
        const num = v === '' || v == null ? '' : Number(v);
        cols.push(typeof num === 'number' && !isNaN(num) ? num.toFixed(2) : String(v ?? ''));
      }
      return cols;
    });
    const esc = (val) => {
      const s = String(val ?? '');
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const bom = '\ufeff';
    const metaLines = meta.map(m => m.map(esc).join(','));
    const csv = [bom + metaLines.join('\n'), '', headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fname = `reporte_${cursoNom || 'curso'}${gradoNom ? `_${gradoNom}` : ''}${secNom ? `_${secNom}` : ''}${soloAlumno && dniAlumno ? `_${dniAlumno}` : ''}.csv`;
    a.download = fname;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (alumnos.length === 0) return;
    const cursoNom = (cursos.find(c => c.id === cursoId)?.nombre) || '';
    const gradoNom = (asignaciones[cursoId]?.find(x => x.grado_id === gradoId)?.grado) || '';
    const secNom = (asignaciones[cursoId]?.find(x => x.seccion_id === seccionId)?.seccion) || '';
    const title = `Reporte ${cursoNom}${gradoNom ? ` - ${gradoNom}` : ''}${secNom ? ` ${secNom}` : ''}${soloAlumno && dniAlumno ? ` - DNI ${dniAlumno}` : ''}`;
    const headCols = ['DNI','Apellidos','Nombres',...actividades.map(a => a.nombre)];
    const bodyRows = alumnos.map(a => {
      const cols = [a.dni, a.apellidos, a.nombres];
      for (const act of actividades) {
        const v = (notas[act.id] && notas[act.id][a.dni]) !== undefined ? notas[act.id][a.dni] : '';
        const num = v === '' || v == null ? '' : Number(v);
        cols.push(typeof num === 'number' && !isNaN(num) ? num.toFixed(2) : String(v ?? ''));
      }
      return cols;
    });
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      doc.setFontSize(16);
      doc.text(title, 40, 40);
      const fecha = new Date();
      doc.setFontSize(10);
      doc.text(`Generado: ${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`, 40, 58);
      doc.text(`Total alumnos: ${alumnos.length}`, 40, 72);
      if (soloAlumno && dniAlumno) doc.text(`Filtro DNI: ${dniAlumno}`, 40, 86);
      autoTable(doc, {
        head: [headCols],
        body: bodyRows,
        startY: 110,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [243, 244, 246], textColor: 20 },
        margin: { left: 40, right: 40 }
      });
      const fname = `reporte_${cursoNom || 'curso'}${gradoNom ? `_${gradoNom}` : ''}${secNom ? `_${secNom}` : ''}${soloAlumno && dniAlumno ? `_${dniAlumno}` : ''}.pdf`;
      doc.save(fname);
    } catch (e) {
      const style = `@page{size:A4 landscape;margin:16mm;}body{font-family:Segoe UI,Roboto,Arial,sans-serif;padding:16px;}h1{margin:0 0 12px 0;font-size:22px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #888;padding:6px 8px;font-size:12px;text-align:left;}thead th{background:#f3f4f6;}`;
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${style}</style></head><body><h1>${title}</h1><table><thead><tr>${headCols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${bodyRows.map(r=>`<tr>${r.map(c=>`<td>${c ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();
      try { w.focus(); w.print(); } catch (_) {}
    }
  };

  const gradosDisponibles = cursoId ? Array.from(new Set((asignaciones[cursoId] || []).map(a => a.grado_id).filter(Boolean))) : [];
  const seccionesDisponibles = cursoId ? Array.from(new Set((asignaciones[cursoId] || []).filter(a => !gradoId || a.grado_id === gradoId).map(a => a.seccion_id).filter(Boolean))) : [];

  return (
    <>
      <h1>Reportes</h1>
      <p>Genera reportes por curso, grado o sección. Opcionalmente filtra por alumno.</p>
      <div className="notas-form">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span>
            <label style={{ marginRight: 8 }}>Curso:</label>
            <select value={cursoId || ''} onChange={e => { const v = Number(e.target.value) || 0; setCursoId(v); setGradoId(0); setSeccionId(0); }}>
              <option value="">Selecciona curso</option>
              {cursos.map(c => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
            </select>
          </span>
          <span>
            <label style={{ marginRight: 8 }}>Grado:</label>
            <select value={gradoId || ''} onChange={e => { const v = Number(e.target.value) || 0; setGradoId(v); setSeccionId(0); }} disabled={!cursoId}>
              <option value="">Todos</option>
              {gradosDisponibles.map(id => {
                const nom = (asignaciones[cursoId] || []).find(x => x.grado_id === id)?.grado || id;
                return (<option key={id} value={id}>{nom}</option>);
              })}
            </select>
          </span>
          <span>
            <label style={{ marginRight: 8 }}>Sección:</label>
            <select value={seccionId || ''} onChange={e => setSeccionId(Number(e.target.value) || 0)} disabled={!cursoId}>
              <option value="">Todas</option>
              {seccionesDisponibles.map(id => {
                const nom = (asignaciones[cursoId] || []).find(x => x.seccion_id === id)?.seccion || id;
                return (<option key={id} value={id}>{nom}</option>);
              })}
            </select>
          </span>
          <span>
            <label style={{ marginRight: 8 }}>DNI alumno:</label>
            <input type="text" inputMode="numeric" placeholder="Opcional" value={dniAlumno} onChange={e => setDniAlumno(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-border)' }} />
          </span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={soloAlumno} onChange={e => setSoloAlumno(e.target.checked)} />
            <span>Solo este alumno</span>
          </label>
          <button onClick={cargarDatos} disabled={!cursoId}>Cargar</button>
          <button onClick={exportCSV} disabled={alumnos.length === 0 || loading}>Exportar CSV</button>
          <button onClick={exportPDF} disabled={alumnos.length === 0 || loading}>Generar PDF</button>
        </div>
      </div>

      <div className="estudiantes-table" style={{ marginTop: 16 }}>
        <div className="table-scroll">
          <div className="scroll-area" style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>DNI</th>
                  <th>Apellidos</th>
                  <th>Nombres</th>
                  {actividades.map(a => (<th key={a.id}>{a.nombre}</th>))}
                </tr>
              </thead>
              <tbody>
                {alumnos.map(a => (
                  <tr key={a.dni}>
                    <td>{a.dni}</td>
                    <td>{a.apellidos}</td>
                    <td>{a.nombres}</td>
                    {actividades.map(act => (
                      <td key={`${act.id}-${a.dni}`}>{(notas[act.id] && notas[act.id][a.dni]) !== undefined ? notas[act.id][a.dni] : ''}</td>
                    ))}
                  </tr>
                ))}
                {alumnos.length === 0 && (
                  <tr><td colSpan={3 + actividades.length}>{loading ? 'Cargando...' : 'Sin datos'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
