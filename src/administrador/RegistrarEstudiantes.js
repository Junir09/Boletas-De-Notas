import React, { useRef, useState } from 'react';
import { api } from '../api';
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
    const header = 'DNI,Apellidos y nombres\n';
    const body = rows.map(r => `${r.dni},${`${r.apellidos} ${r.nombres}`.trim()}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'estudiantes.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    try {
      if (name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(Boolean);
        const [, ...data] = lines; // skip header
        const parsed = data.map(line => {
          const parts = line.split(',');
          const d = (parts[0] || '').trim();
          if (parts.length >= 3) {
            const a = (parts[1] || '').trim();
            const n = (parts[2] || '').trim();
            return { dni: d, apellidos: a, nombres: n };
          }
          if (parts.length === 2) {
            const full = (parts[1] || '').trim();
            const { apellidos, nombres } = splitFullName(full);
            return { dni: d, apellidos, nombres };
          }
          return { dni: '', apellidos: '', nombres: '' };
        }).filter(x => x.dni && x.apellidos && x.nombres);
        setRows(parsed);
        await saveToDb(parsed);
      } else if (name.endsWith('.xlsx')) {
        // Carga perezosa de xlsx si está instalada
        const XLSX = await import('xlsx').then(m => m.default || m);
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
      const XLSX = await import('xlsx').then(m => m.default || m);
      const header = [['DNI','Apellidos y nombres']];
      const data = rows.map(r => [r.dni, `${r.apellidos} ${r.nombres}`.trim()]);
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
    } catch (err) {
      console.error(err);
      setError('No se pudo exportar a Excel. ¿Está instalada la librería xlsx?');
    }
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