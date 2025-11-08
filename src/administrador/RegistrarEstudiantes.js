import React, { useRef, useState } from 'react';
import { api } from '../api';
import * as XLSX from 'xlsx';
// Solo importar y exportar alumnos. La importación guarda automáticamente en BD.

function RegistrarEstudiantes() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const [modal, setModal] = useState({ visible: false, type: 'success', message: '' });

  const closeModal = () => setModal({ visible: false, type: 'success', message: '' });

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
      }
    } catch (err) {
      console.error(err);
      setModal({ visible: true, type: 'error', message: 'No se pudo conectar al servidor para guardar' });
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
          setModal({ visible: true, type: 'error', message: 'No hay datos para exportar' });
        }
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo exportar a Excel. ¿Está instalada la librería xlsx?');
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
      <h2>Registrar Estudiantes</h2>
      <p>Importa o exporta alumnos desde Excel (.xlsx) o CSV con columnas: DNI y "Apellidos y nombres"</p>

      <div className="field">
        <input type="file" accept=".xlsx,.csv" onChange={importFile} ref={fileRef} />
      </div>

      <div className="actions" style={{ display: 'flex', gap: '1rem' }}>
        <button type="button" onClick={exportCSV}>Exportar CSV</button>
        <button type="button" onClick={exportXLSX}>Exportar Excel (.xlsx)</button>
      </div>

      {modal.visible && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '1rem 1.25rem', borderRadius: 6, minWidth: 280, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h4 style={{ marginTop: 0 }}>{modal.type === 'success' ? 'Operación exitosa' : 'Error'}</h4>
            <p style={{ marginBottom: '1rem' }}>{modal.message}</p>
            <div style={{ textAlign: 'right' }}>
              <button type="button" onClick={closeModal}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistrarEstudiantes;