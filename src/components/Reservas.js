import React, { useEffect, useState } from 'react';
import { getData } from '../services/apiService';
import Layout from './Layout';
import { format } from 'date-fns';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

const Reservas = () => {
  const [reservas, setReservas] = useState([]);

  useEffect(() => {
    cargarReservas();
  }, []);

  const cargarReservas = async () => {
    try {
      const data = await getData('reservas', true);
      setReservas(data || []);
    } catch (error) {
      console.error('Error al cargar las reservas:', error);
    }
  };

  const obtenerEstadoReserva = (fecha, horaInicio, horaFin) => {
    const ahora = new Date();
    const inicio = new Date(`${fecha}T${horaInicio}`);
    const fin = new Date(`${fecha}T${horaFin}`);

    if (ahora < inicio) return 'No iniciada';
    if (ahora >= inicio && ahora <= fin) return 'En curso';
    return 'Finalizada';
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'No iniciada': return 'bg-blue-500';
      case 'En curso': return 'bg-yellow-500';
      case 'Finalizada': return 'bg-green-600';
      default: return 'bg-gray-400';
    }
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text('Listado de Reservas', 14, 15);

    const data = reservas.map(r => [
      format(new Date(r.Fecha), 'yyyy-MM-dd'),
      `${r.HoraInicio} - ${r.HoraFin}`,
      r.Jornada,
      r.Escenario,
      r.TipoPractica,
      r.Docente,
      r.Asignatura,
      r.NumEstudiantes,
      Number(r.TiempoSesion || 0).toFixed(2)
    ]);

    autoTable(doc, {
      head: [['Fecha', 'Horario', 'Jornada', 'Escenario', 'Práctica', 'Docente', 'Asignatura', 'Estudiantes', 'Duración']],
      body: data,
      startY: 20,
    });

    doc.save('reservas.pdf');
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Listado de Reservas</h2>
        <button onClick={exportarPDF} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">Exportar PDF</button>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-4 text-left">Fecha</th>
              <th className="py-3 px-4 text-left">Horario</th>
              <th className="py-3 px-4 text-left">Jornada</th>
              <th className="py-3 px-4 text-left">Escenario</th>
              <th className="py-3 px-4 text-left">Práctica</th>
              <th className="py-3 px-4 text-left">Docente</th>
              <th className="py-3 px-4 text-left">Asignatura</th>
              <th className="py-3 px-4 text-center">Estudiantes</th>
              <th className="py-3 px-4 text-center">Duración</th>
              <th className="py-3 px-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {reservas && reservas.length > 0 ? (
              reservas.map((r, idx) => {
                const estado = obtenerEstadoReserva(r.Fecha, r.HoraInicio, r.HoraFin);
                return (
                  <tr key={idx} className="border-b">
                    <td className="py-3 px-4">{format(new Date(r.Fecha), 'yyyy-MM-dd')}</td>
                    <td className="py-3 px-4">{r.HoraInicio} - {r.HoraFin}</td>
                    <td className="py-3 px-4">{r.Jornada}</td>
                    <td className="py-3 px-4">{r.Escenario}</td>
                    <td className="py-3 px-4">{r.TipoPractica}</td>
                    <td className="py-3 px-4">{r.Docente}</td>
                    <td className="py-3 px-4">{r.Asignatura}</td>
                    <td className="py-3 px-4 text-center">{r.NumEstudiantes}</td>
                    <td className="py-3 px-4 text-center">{Number(r.TiempoSesion || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-white px-2 py-1 rounded-full text-xs ${obtenerColorEstado(estado)}`}>{estado}</span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="10" className="text-center py-4 text-gray-500">No hay reservas registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Reservas;
