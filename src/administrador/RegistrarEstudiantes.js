import React, { useRef, useState } from 'react';
import '../assets/css/admin/registrar-estudiantes.css';
import { api } from '../api';
import * as XLSX from 'xlsx';

function RegistrarEstudiantes() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const [modal, setModal] = useState({ visible: false, type: 'success', message: '' });
  const [dni, setDni] = useState('');
  const [apellidosNombres, setApellidosNombres] = useState('');
  const [grado, setGrado] = useState('');
  const [seccion, setSeccion] = useState('');

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
      const header = ['DNI','Apellidos y nombres', 'Grado', 'Sección'];
      const lines = [header]
        .concat(list.map(r => [
          r.dni, 
          `${r.apellidos} ${r.nombres}`.trim(),
          r.grado ? (String(r.grado).includes('°') ? r.grado : `${r.grado}°`) : '',
          r.seccion || ''
        ]))
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
        
        if (json.length === 0) return;

        // Detectar cabeceras
        const [headerRow, ...rowsData] = json;
        const headers = (headerRow || []).map(h => String(h).toLowerCase().trim());
        
        const dniIdx = headers.findIndex(h => h.includes('dni'));
        const anIdx = headers.findIndex(h => h.includes('apellidos y nombres'));
        const aIdx = headers.indexOf('apellidos');
        const nIdx = headers.indexOf('nombres');
        const gIdx = headers.findIndex(h => h.includes('grado'));
        const sIdx = headers.findIndex(h => h.includes('seccion') || h.includes('sección'));

        const parsed = rowsData.map(arr => {
          let dni, apellidos, nombres, grado, seccion;
          
          if (dniIdx !== -1) {
             dni = String(arr[dniIdx] || '').trim();
             if (anIdx !== -1) {
                 const full = String(arr[anIdx] || '').trim();
                 const parts = splitFullName(full);
                 apellidos = parts.apellidos;
                 nombres = parts.nombres;
             } else {
                 apellidos = String(arr[aIdx] || '').trim();
                 nombres = String(arr[nIdx] || '').trim();
             }
             grado = gIdx !== -1 ? String(arr[gIdx] || '').trim() : '';
             seccion = sIdx !== -1 ? String(arr[sIdx] || '').trim() : '';
          } else {
             // Fallback posicional
             dni = String(arr[0] || '').trim();
             if (arr.length >= 4) {
                 // Asumimos DNI, FullName, Grado, Seccion
                 const full = String(arr[1] || '').trim();
                 const parts = splitFullName(full);
                 apellidos = parts.apellidos;
                 nombres = parts.nombres;
                 grado = String(arr[2] || '').trim();
                 seccion = String(arr[3] || '').trim();
             } else if (arr.length === 3) {
                 // DNI, Apellidos, Nombres (Legacy)
                 apellidos = String(arr[1] || '').trim();
                 nombres = String(arr[2] || '').trim();
             } else {
                 const full = String(arr[1] || '').trim();
                 const parts = splitFullName(full);
                 apellidos = parts.apellidos;
                 nombres = parts.nombres;
             }
          }

          return { dni, apellidos, nombres, grado, seccion };
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

  const crearEstudiante = async () => {
    const d = String(dni || '').trim();
    const full = String(apellidosNombres || '').trim();
    setError('');
    if (!d || !full) { setError('Completa DNI y Apellidos y nombres'); return; }
    if (!/^\d{8,}$/.test(d)) { setError('DNI debe tener al menos 8 dígitos'); return; }
    const { apellidos: a, nombres: n } = splitFullName(full);
    if (!a || !n) { setError('Ingresa Apellidos y nombres válidos'); return; }
    try {
      const resp = await fetch(api('/api/estudiantes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dni: d, 
          apellidos: a, 
          nombres: n,
          grado: grado.trim(),
          seccion: seccion.trim()
        })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) {
        setError(json.error || 'Error al crear estudiante');
      } else {
        setModal({ visible: true, type: 'success', message: 'Estudiante creado' });
        setDni(''); setApellidosNombres(''); setGrado(''); setSeccion('');
        
      }
    } catch (e) {
      setError('No se pudo conectar al servidor');
    }
  };

  const exportXLSX = async () => {
    try {
      const doExportXlsx = (list) => {
        const header = [['DNI','Apellidos y nombres', 'Grado', 'Sección']];
        const data = list.map(r => [
          r.dni, 
          `${r.apellidos} ${r.nombres}`.trim(),
          r.grado ? (String(r.grado).includes('°') ? r.grado : `${r.grado}°`) : '',
          r.seccion || ''
        ]);
        const ws = XLSX.utils.aoa_to_sheet([...header, ...data]);
        const maxDni = Math.max('DNI'.length, ...data.map(r => String(r[0]).length));
        const maxFull = Math.max('Apellidos y nombres'.length, ...data.map(r => String(r[1]).length));
        ws['!cols'] = [
          { wch: Math.max(8, maxDni) },
          { wch: Math.min(60, Math.max(15, maxFull)) },
          { wch: 8 },
          { wch: 8 }
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
        const header = [['DNI','Apellidos y nombres', 'Grado', 'Sección']];
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
    const dniIdx = lower.findIndex(h => h.includes('dni'));
    const anIdx = lower.findIndex(h => h.includes('apellidos y nombres'));
    const aIdx = lower.indexOf('apellidos');
    const nIdx = lower.indexOf('nombres');
    const gIdx = lower.findIndex(h => h.includes('grado'));
    const sIdx = lower.findIndex(h => h.includes('seccion') || h.includes('sección'));

    const hasApellidosNombres = anIdx !== -1;
    return lines.slice(1).map(line => {
      const cols = parseCsvLine(line, sep);
      
      const dni = (dniIdx !== -1 ? cols[dniIdx] : cols[0]) || '';
      let apellidos = '', nombres = '';
      let grado = '', seccion = '';

      if (hasApellidosNombres) {
        const full = (cols[anIdx] || '').trim();
        const { apellidos: a, nombres: n } = splitFullName(full);
        apellidos = a; nombres = n;
      } else if (aIdx !== -1 && nIdx !== -1) {
        apellidos = (cols[aIdx] || '').trim();
        nombres = (cols[nIdx] || '').trim();
      } else {
        // Fallback positional
        if (cols.length >= 4) {
           const full = (cols[1] || '').trim();
           const parts = splitFullName(full);
           apellidos = parts.apellidos;
           nombres = parts.nombres;
        } else {
           apellidos = (cols[1] || '').trim();
           nombres = (cols[2] || '').trim();
        }
      }
      
      grado = gIdx !== -1 ? (cols[gIdx] || '').trim() : 
              (cols.length >= 4 ? (cols[2] || '').trim() : '');
      seccion = sIdx !== -1 ? (cols[sIdx] || '').trim() : 
              (cols.length >= 4 ? (cols[3] || '').trim() : '');

      return { dni: dni.trim(), apellidos, nombres, grado, seccion };
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
    <div className="registrar-estudiantes">

      {/* TITULO + DESCRIPCIÓN */}
      <header className="header-section">
        <h2>Sistema De Registro De Estudiantes</h2>
        <p className="intro-text">
          Por favor, exporte nuestra plantilla de Excel y proceda a completar los datos 
          correspondientes. Luego podrá importarla nuevamente al sistema.
        </p>
      </header>

      {/* FORMULARIO MANUAL */}
      <section className="card">
        <h3>Crear estudiante</h3>

        <div className="form-grid">

          <div className="field">
            <label>DNI</label>
            <input 
              type="text" 
              value={dni} 
              onChange={e => setDni(e.target.value)} 
              placeholder="Documento De Identidad" 
              inputMode="numeric" 
              maxLength={8} 
            />
          </div>

          <div className="field">
            <label>Apellidos y nombres</label>
            <input 
              type="text" 
              value={apellidosNombres} 
              onChange={(e) => setApellidosNombres(e.target.value)} 
              placeholder="Nombre completo"
            />
          </div>

          <div className="field">
            <label>Grado (Opcional)</label>
            <input 
              type="text" 
              value={grado} 
              onChange={(e) => setGrado(e.target.value)} 
              placeholder="1°"
            />
          </div>

          <div className="field">
            <label>Sección (Opcional)</label>
            <input 
              type="text" 
              value={seccion} 
              onChange={(e) => setSeccion(e.target.value)} 
              placeholder="A"
            />
          </div>

        </div>

        {error && <div className="status-error">{error}</div>}

        <div className="actions right">
          <button type="button" onClick={crearEstudiante}>Crear estudiante</button>
        </div>
      </section>


      {/* IMPORTACIÓN */}
      <section className="card">
        <h3>Importar estudiantes</h3>

        <label className="file-input">
          <span>Seleccionar archivo (.csv / .xlsx)</span>
          <input 
            type="file" 
            accept=".xlsx,.csv" 
            onChange={importFile} 
            ref={fileRef} 
          />
        </label>
      </section>


      {/* EXPORTACIÓN */}
      <section className="card">
        <h3>Exportar datos</h3>
        <div className="actions-row">
          <button type="button" onClick={exportCSV}>Exportar CSV</button>
          <button type="button" onClick={exportXLSX}>Exportar Excel (.xlsx)</button>
        </div>
      </section>


      {/* MODAL */}
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

    </div>
  );
}

export default RegistrarEstudiantes;
