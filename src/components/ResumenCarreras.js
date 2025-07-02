import React, { useState, useEffect } from 'react';
import { getData } from '../services/apiService';
import Layout from './Layout';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ResumenCarreras = () => {
  const [reservas, setReservas] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0];
    setFechaInicio(hoy);
    setFechaFin(hoy);
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin) cargarReservas();
  }, [fechaInicio, fechaFin]);

  const cargarReservas = async () => {
    try {
      const response = await getData('reservas', true);
      const filtradas = response.filter(r => r.Fecha >= fechaInicio && r.Fecha <= fechaFin);
      setReservas(filtradas);

      const agrupadas = filtradas.reduce((acc, r) => {
        if (!acc[r.Carrera]) {
          acc[r.Carrera] = { cantidad: 0, estudiantes: 0 };
        }
        acc[r.Carrera].cantidad++;
        acc[r.Carrera].estudiantes += parseInt(r.NumEstudiantes || 0);
        return acc;
      }, {});

      const resultado = Object.entries(agrupadas).map(([carrera, datos]) => ({
        Carrera: carrera,
        Reservas: datos.cantidad,
        Estudiantes: datos.estudiantes
      }));

      setResumen(resultado);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    }
  };

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(resumen);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ResumenCarreras');
    XLSX.writeFile(wb, 'resumen_carreras.xlsx');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text('Resumen por Carrera', 14, 15);
    const data = resumen.map(r => [r.Carrera, r.Reservas, r.Estudiantes]);
    autoTable(doc, {
      head: [['Carrera', 'Reservas', 'Estudiantes']],
      body: data,
      startY: 20,
    });
    doc.save('resumen_carreras.pdf');
  };

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Resumen por Carrera</h2>

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
                <th className="p-2">Carrera</th>
                <th className="p-2">Reservas</th>
                <th className="p-2">Estudiantes</th>
              </tr>
            </thead>
            <tbody>
              {resumen.map((r, i) => (
                <tr key={i} className="text-center border-t">
                  <td className="p-2">{r.Carrera}</td>
                  <td className="p-2">{r.Reservas}</td>
                  <td className="p-2">{r.Estudiantes}</td>
                </tr>
              ))}
              {resumen.length === 0 && (
                <tr><td colSpan="3" className="text-center p-4 text-gray-500">No hay datos en el rango seleccionado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default ResumenCarreras;
