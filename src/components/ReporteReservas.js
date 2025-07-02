import React, { useState, useEffect } from 'react';
import { getData } from '../services/apiService';
import Layout from './Layout';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReporteReservas = () => {
  const [reservas, setReservas] = useState([]);
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
    } catch (error) {
      console.error('Error al cargar reservas:', error);
    }
  };

  const exportarExcel = () => {
    const hoja = reservas.map(r => ({
      Fecha: r.Fecha,
      Horario: `${r.HoraInicio} - ${r.HoraFin}`,
      Jornada: r.Jornada,
      Escenario: r.Escenario,
      Practica: r.TipoPractica,
      Docente: r.Docente,
      Asignatura: r.Asignatura,
      Estudiantes: r.NumEstudiantes,
      Duracion: r.TiempoSesion + 'h'
    }));
    const ws = XLSX.utils.json_to_sheet(hoja);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reservas');
    XLSX.writeFile(wb, 'reporte_reservas.xlsx');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text('Reporte de Reservas', 14, 15);
    const data = reservas.map(r => [
      r.Fecha,
      `${r.HoraInicio} - ${r.HoraFin}`,
      r.Jornada,
      r.Escenario,
      r.TipoPractica,
      r.Docente,
      r.Asignatura,
      r.NumEstudiantes,
      `${r.TiempoSesion}h`
    ]);
    autoTable(doc, {
      head: [['Fecha', 'Horario', 'Jornada', 'Escenario', 'Práctica', 'Docente', 'Asignatura', 'Estudiantes', 'Duración']],
      body: data,
      startY: 20,
    });
    doc.save('reporte_reservas.pdf');
  };

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Reporte de Reservas por Fecha</h2>

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
                <th className="p-2">Fecha</th>
                <th className="p-2">Horario</th>
                <th className="p-2">Jornada</th>
                <th className="p-2">Escenario</th>
                <th className="p-2">Práctica</th>
                <th className="p-2">Docente</th>
                <th className="p-2">Asignatura</th>
                <th className="p-2">Estudiantes</th>
                <th className="p-2">Duración</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((r, i) => (
                <tr key={i} className="text-center border-t">
                  <td className="p-2">{r.Fecha}</td>
                  <td className="p-2">{`${r.HoraInicio} - ${r.HoraFin}`}</td>
                  <td className="p-2">{r.Jornada}</td>
                  <td className="p-2">{r.Escenario}</td>
                  <td className="p-2">{r.TipoPractica}</td>
                  <td className="p-2">{r.Docente}</td>
                  <td className="p-2">{r.Asignatura}</td>
                  <td className="p-2">{r.NumEstudiantes}</td>
                  <td className="p-2">{r.TiempoSesion}h</td>
                </tr>
              ))}
              {reservas.length === 0 && (
                <tr><td colSpan="9" className="text-center p-4 text-gray-500">No hay reservas en el rango seleccionado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default ReporteReservas;
