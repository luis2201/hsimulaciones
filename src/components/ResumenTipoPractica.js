import React, { useState, useEffect } from 'react';
import { getData } from '../services/apiService';
import Layout from './Layout';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ResumenTipoPractica = () => {
  const [resumen, setResumen] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0];
    setFechaInicio(hoy);
    setFechaFin(hoy);
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin) cargarResumen();
  }, [fechaInicio, fechaFin]);

  const cargarResumen = async () => {
    try {
      const data = await getData('reservas', true);
      const filtradas = data.filter(r => r.Fecha >= fechaInicio && r.Fecha <= fechaFin);
      const agrupadas = filtradas.reduce((acc, r) => {
        const tipo = r.TipoPractica || 'Sin definir';
        if (!acc[tipo]) acc[tipo] = { total: 0, sesiones: 0 };
        acc[tipo].total += parseFloat(r.TiempoSesion || 0);
        acc[tipo].sesiones++;
        return acc;
      }, {});

      const resultado = Object.entries(agrupadas).map(([tipo, datos]) => ({
        TipoPractica: tipo,
        PromedioHoras: (datos.total / datos.sesiones).toFixed(2),
        Sesiones: datos.sesiones
      }));

      setResumen(resultado);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    }
  };

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(resumen);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ResumenTipoPractica');
    XLSX.writeFile(wb, 'resumen_tipo_practica.xlsx');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text('Duraci\u00f3n Promedio por Tipo de Pr\u00e1ctica', 14, 15);
    autoTable(doc, {
      head: [['Tipo de Pr\u00e1ctica', 'Promedio (horas)', 'Sesiones']],
      body: resumen.map(r => [r.TipoPractica, r.PromedioHoras, r.Sesiones]),
      startY: 20,
    });
    doc.save('resumen_tipo_practica.pdf');
  };

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Duraci\u00f3n Promedio por Tipo de Pr\u00e1ctica</h2>

        <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
          <label className="text-gray-700">
            Desde:
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="ml-2 px-3 py-1 border rounded" />
          </label>
          <label className="text-gray-700">
            Hasta:
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="ml-2 px-3 py-1 border rounded" />
          </label>
          <button onClick={exportarExcel} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Exportar Excel</button>
          <button onClick={exportarPDF} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Exportar PDF</button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Tipo de Pr\u00e1ctica</th>
                <th className="p-2">Promedio (horas)</th>
                <th className="p-2">Sesiones</th>
              </tr>
            </thead>
            <tbody>
              {resumen.map((r, i) => (
                <tr key={i} className="text-center border-t">
                  <td className="p-2">{r.TipoPractica}</td>
                  <td className="p-2">{r.PromedioHoras}</td>
                  <td className="p-2">{r.Sesiones}</td>
                </tr>
              ))}
              {resumen.length === 0 && (
                <tr><td colSpan="3" className="text-center p-4 text-gray-500">No hay datos disponibles.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default ResumenTipoPractica;
