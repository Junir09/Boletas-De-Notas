import React, { useEffect, useRef, useState } from 'react';
import '../assets/css/admin/registrar-estudiantes.css';
import { api } from '../api';
import * as XLSX from 'xlsx';

// Solo importar y exportar alumnos. La importación guarda automáticamente en BD.

function RegistrarEstudiantes() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const [modal, setModal] = useState({ visible: false, type: 'success', message: '' });
  const [dni, setDni] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [nombres, setNombres] = useState('');
  const [estudiantes, setEstudiantes] = useState([]);
  const [editingDni, setEditingDni] = useState('');
  const [editData, setEditData] = useState({ apellidos: '', nombres: '' });

  const closeModal = () => setModal({ visible: false, type: 'success', message: '' });

  const cargarEstudiantes = async () => {
    try {
      const resp = await fetch(api('/api/estudiantes'));
      const json = await resp.json();
      if (resp.ok && json.ok) {
        setEstudiantes(Array.isArray(json.data) ? json.data : []);
      }
    } catch (_) {}
  };

  useEffect(() => { cargarEstudiantes(); }, []);

  // Helper: separa "Apellidos y nombres" en dos campos
  const splitFullName = (full) => {
    const s = String(full || '').trim();
    if (!s) return { apellidos: '', nombres: '' };
    const commaIdx = s.indexOf(',');
    if (commaIdx !== -1) {
      return {
        apellidos: s.slice(0, commaIdx).trim(),
        nombres: s.slice(commaIdx + 1).trim(),
      };
    }
    const tokens = s.split(/\s+/).filter(Boolean);
    if (tokens.length >= 3) {
      return {
        apellidos: tokens.slice(0, 2).join(' '),
        nombres: tokens.slice(2).join(' '),
      };
    }
    if (tokens.length === 2) {
      return { apellidos: tokens[0], nombres: tokens[1] };
    }
    return { apellidos: 'N/A', nombres: tokens[0] };
  };

  const exportCSV = () => {
    const doExport = (list) => {
      const bom = '\ufeff'; // BOM para compatibilidad con Excel y UTF-8
      const header = ['DNI','Apellidos y nombres'];
      const lines = [header]
        .concat(list.map(r => [r.dni, `${r.apellidos} ${r.nombres}`.trim()]))
        .map(cols => cols.map(csvEscape).join(','));
      const csv = bom + lines.join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'estudiantes.csv'; a.click();
      URL.revokeObjectURL(url);
    };
    if (rows.length > 0) {
      doExport(rows);
    } else {
      // Si no hay filas cargadas, exportar desde la BD
      fetch(api('/api/estudiantes'))
        .then(r => r.json())
        .then(j => {
          if (j && j.ok && Array.isArray(j.data) && j.data.length > 0) doExport(j.data);
          else setModal({ visible: true, type: 'error', message: 'No hay datos para exportar' });
        })
        .catch(() => setModal({ visible: true, type: 'error', message: 'No se pudo obtener datos de la BD' }));
    }
  };

  const importFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    try {
      if (name.endsWith('.csv')) {
        const text = await file.text();
        const parsed = parseCsv(text);
        setRows(parsed);
        await saveToDb(parsed);
      } else if (name.endsWith('.xlsx')) {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const [, ...rowsData] = json; // skip header
        const parsed = rowsData.map(arr => {
          const dni = String(arr[0] || '').trim();
          if (arr.length >= 3) {
            const apellidos = String(arr[1] || '').trim();
            const nombres = String(arr[2] || '').trim();
            return { dni, apellidos, nombres };
          }
          const full = String(arr[1] || '').trim();
          const { apellidos, nombres } = splitFullName(full);
          return { dni, apellidos, nombres };
        }).filter(x => x.dni && x.apellidos && x.nombres);
        setRows(parsed);
        await saveToDb(parsed);
      } else {
        setModal({ visible: true, type: 'error', message: 'Formato no soportado. Usa .csv o .xlsx' });
      }
    } catch (err) {
      console.error(err);
      setModal({ visible: true, type: 'error', message: 'Error al importar archivo' });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const saveToDb = async (data) => {
    try {
      const resp = await fetch(api('/api/estudiantes/bulk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estudiantes: data })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) {
        setModal({ visible: true, type: 'error', message: json.error || 'Error al guardar en la BD' });
      } else {
        const savedCount = (json && (json.count ?? json.affected)) ?? data.length;
        setModal({ visible: true, type: 'success', message: `Se guardaron ${savedCount} alumnos correctamente` });
        cargarEstudiantes();
      }
    } catch (err) {
      console.error(err);
      setModal({ visible: true, type: 'error', message: 'No se pudo conectar al servidor para guardar' });
    }
  };

  const crearEstudiante = async () => {
    const d = String(dni || '').trim();
    const a = String(apellidos || '').trim();
    const n = String(nombres || '').trim();
    setError('');
    if (!d || !a || !n) { setError('Completa DNI, apellidos y nombres'); return; }
    if (!/^\d{8,}$/.test(d)) { setError('DNI debe tener al menos 8 dígitos'); return; }
    try {
      const resp = await fetch(api('/api/estudiantes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: d, apellidos: a, nombres: n })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) {
        setError(json.error || 'Error al crear estudiante');
      } else {
        setModal({ visible: true, type: 'success', message: 'Estudiante creado' });
        setDni(''); setApellidos(''); setNombres('');
        cargarEstudiantes();
      }
    } catch (e) {
      setError('No se pudo conectar al servidor');
    }
  };

  const iniciarEdicion = (d) => {
    const row = estudiantes.find(x => String(x.dni) === String(d));
    if (!row) return;
    setEditingDni(String(d));
    setEditData({ apellidos: row.apellidos || '', nombres: row.nombres || '' });
    setError('');
  };

  const cancelarEdicion = () => {
    setEditingDni('');
    setEditData({ apellidos: '', nombres: '' });
  };

  const guardarEstudiante = async () => {
    const d = String(editingDni || '').trim();
    if (!d) return;
    const body = {};
    if (editData.apellidos && editData.apellidos.trim()) body.apellidos = editData.apellidos.trim();
    if (editData.nombres && editData.nombres.trim()) body.nombres = editData.nombres.trim();
    if (Object.keys(body).length === 0) { setError('No hay cambios para guardar'); return; }
    try {
      const resp = await fetch(api(`/api/estudiantes/${encodeURIComponent(d)}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) {
        setError(json.error || 'Error al actualizar');
      } else {
        setModal({ visible: true, type: 'success', message: 'Estudiante actualizado' });
        cancelarEdicion();
        cargarEstudiantes();
      }
    } catch (e) {
      setError('No se pudo conectar al servidor');
    }
  };

  const eliminarEstudiante = async (d) => {
    if (!window.confirm('¿Eliminar este estudiante?')) return;
    try {
      const resp = await fetch(api(`/api/estudiantes/${encodeURIComponent(d)}`), { method: 'DELETE' });
      const json = await resp.json();
      if (!resp.ok || !json.ok) {
        setError(json.error || 'No se pudo eliminar');
      } else {
        setModal({ visible: true, type: 'success', message: 'Estudiante eliminado' });
        if (String(editingDni) === String(d)) cancelarEdicion();
        cargarEstudiantes();
      }
    } catch (_) {
      setError('No se pudo conectar al servidor');
    }
  };

  const exportXLSX = async () => {
    try {
      const doExportXlsx = (list) => {
        const header = [['DNI','Apellidos y nombres']];
        const data = list.map(r => [r.dni, `${r.apellidos} ${r.nombres}`.trim()]);
        const ws = XLSX.utils.aoa_to_sheet([...header, ...data]);
        const maxDni = Math.max('DNI'.length, ...data.map(r => String(r[0]).length));
        const maxFull = Math.max('Apellidos y nombres'.length, ...data.map(r => String(r[1]).length));
        ws['!cols'] = [
          { wch: Math.max(8, maxDni) },
          { wch: Math.min(60, Math.max(15, maxFull)) }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');
        XLSX.writeFile(wb, 'estudiantes.xlsx');
      };
      if (rows.length > 0) {
        doExportXlsx(rows);
      } else {
        const resp = await fetch(api('/api/estudiantes'));
        const json = await resp.json();
        if (resp.ok && json.ok && Array.isArray(json.data) && json.data.length > 0) {
          doExportXlsx(json.data);
        } else {
          doExportXlsx([]);
        }
      }
    } catch (err) {
      console.error(err);
      try {
        const header = [['DNI','Apellidos y nombres']];
        const ws = XLSX.utils.aoa_to_sheet(header);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');
        XLSX.writeFile(wb, 'estudiantes.xlsx');
      } catch (e) {
        setError('No se pudo exportar a Excel. ¿Está instalada la librería xlsx?');
      }
    }
  };

  // CSV helpers: parser con comillas/BOM y escape seguro
  const parseCsv = (text) => {
    let t = String(text || '');
    if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1); // quitar BOM
    const lines = t.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];
    // Detectar separador: si el header tiene más ';' que ',' usar ';'
    const sep = (lines[0].split(';').length > lines[0].split(',').length) ? ';' : ',';
    const header = parseCsvLine(lines[0], sep);
    const lower = header.map(h => h.toLowerCase());
    const dniIdx = lower.indexOf('dni');
    const anIdx = lower.indexOf('apellidos y nombres');
    const aIdx = lower.indexOf('apellidos');
    const nIdx = lower.indexOf('nombres');
    const hasApellidosNombres = anIdx !== -1;
    return lines.slice(1).map(line => {
      const cols = parseCsvLine(line, sep);
      const dni = (cols[dniIdx] || '').trim();
      if (hasApellidosNombres) {
        const full = (cols[anIdx] || '').trim();
        const { apellidos, nombres } = splitFullName(full);
        return { dni, apellidos, nombres };
      }
      const apellidos = (cols[aIdx] || '').trim();
      const nombres = (cols[nIdx] || '').trim();
      return { dni, apellidos, nombres };
    }).filter(x => x.dni && x.apellidos && x.nombres);
  };

  const parseCsvLine = (line, sep = ',') => {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
        } else {
          cur += ch;
        }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === sep) { out.push(cur); cur = ''; }
        else { cur += ch; }
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
  };

  const csvEscape = (v) => {
    const s = String(v ?? '');
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  return (
    <div>
      <h2>Sistema De Registro De Estudiantes</h2>
      <p>Por favor, exporte nuestra plantilla de Excel y proceda 
        a completar los datos correspondientes de los estudiantes que requiere el sistema. Una vez ingresada toda la información solicitada, podrá importar nuevamente el archivo al sistema para continuar con el proceso.
      </p>

      <h3>Crear estudiante</h3>
      <div className="field">
        <label>DNI</label>
        <input type="text" value={dni} onChange={e => setDni(e.target.value)} placeholder="DNI" inputMode="numeric" maxLength={8} />
      </div>
      <div className="field">
        <label>Apellidos</label>
        <input type="text" value={apellidos} onChange={e => setApellidos(e.target.value)} placeholder="Apellidos" />
      </div>
      <div className="field">
        <label>Nombres</label>
        <input type="text" value={nombres} onChange={e => setNombres(e.target.value)} placeholder="Nombres" />
      </div>

      <div className="actions actions-row">
        <button type="button" onClick={crearEstudiante}>Crear estudiante</button>
      </div>
      {error && <div className="status-error">{error}</div>}

      <div className="field">
        <input type="file" accept=".xlsx,.csv" onChange={importFile} ref={fileRef} />
      </div>

      <div className="actions actions-row">
        <button type="button" onClick={exportCSV}>Exportar CSV</button>
        <button type="button" onClick={exportXLSX}>Exportar Excel (.xlsx)</button>
      </div>

      {modal.visible && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h4>{modal.type === 'success' ? 'Operación exitosa' : 'Error'}</h4>
            <p>{modal.message}</p>
            <div className="modal-actions">
              <button type="button" onClick={closeModal}>OK</button>
            </div>
          </div>
        </div>
      )}

      <h3>Listado y edición</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>DNI</th>
              <th>Apellidos</th>
              <th>Nombres</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {estudiantes.length === 0 && (
              <tr><td colSpan={4}>No hay estudiantes</td></tr>
            )}
            {estudiantes.map(row => (
              <tr key={row.dni}>
                <td>{row.dni}</td>
                <td>
                  {editingDni === row.dni ? (
                    <input className="edit-input" value={editData.apellidos} onChange={e => setEditData({ ...editData, apellidos: e.target.value })} />
                  ) : row.apellidos}
                </td>
                <td>
                  {editingDni === row.dni ? (
                    <input className="edit-input" value={editData.nombres} onChange={e => setEditData({ ...editData, nombres: e.target.value })} />
                  ) : row.nombres}
                </td>
                <td>
                  <div className="inline-actions">
                    {editingDni === row.dni ? (
                      <>
                        <button type="button" onClick={guardarEstudiante}>Guardar</button>
                        <button type="button" onClick={cancelarEdicion}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => iniciarEdicion(row.dni)}>Editar</button>
                        <button type="button" onClick={() => eliminarEstudiante(row.dni)}>Eliminar</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RegistrarEstudiantes;