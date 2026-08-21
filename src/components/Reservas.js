import React, { useEffect, useState } from 'react';
import { getData } from '../services/apiService';
import Layout from './Layout';
import { format } from 'date-fns';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

const Reservas = () => {
  const [reservas, setReservas] = useState([]);
  const [reservasOriginales, setReservasOriginales] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    cargarReservas();
  }, []);

  const aplicarFiltroFechas = (data) => {
    if (!fechaInicio || !fechaFin) return data;
    const desde = new Date(fechaInicio);
    const hasta = new Date(fechaFin);
    return data.filter(r => {
      const fecha = new Date(r.Fecha);
      return fecha >= desde && fecha <= hasta;
    });
  };

  const cargarReservas = async () => {
    try {
      const data = await getData('reservas', true);
      setReservasOriginales(data || []);
      setReservas(aplicarFiltroFechas(data || []));
    } catch (error) {
      console.error('Error al cargar las reservas:', error);
    }
  };

  const filtrarPorFechas = () => {
    setReservas(aplicarFiltroFechas(reservasOriginales));
  };

  const resetearFiltro = () => {
    setFechaInicio('');
    setFechaFin('');
    setReservas(reservasOriginales);
  };

  const obtenerEstadoReserva = (reserva) => {
    if (reserva.EstadoManual) return reserva.EstadoManual;

    const ahora = new Date();
    const inicio = new Date(`${reserva.Fecha}T${reserva.HoraInicio}`);
    const fin = new Date(`${reserva.Fecha}T${reserva.HoraFin}`);

    if (ahora < inicio) return 'No iniciada';
    if (ahora >= inicio && ahora <= fin) return 'En curso';
    return 'Finalizada';
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'No iniciada': return 'bg-blue-500';
      case 'En curso': return 'bg-yellow-500';
      case 'Finalizada': return 'bg-green-600';
      case 'SUSPENDIDA': return 'bg-red-600';
      case 'REPROGRAMADA': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const actualizarEstadoManual = async (id, estadoManual) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://hsimulacionesapi.luispincay.com/api/reservas/estado-manual/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ EstadoManual: estadoManual })
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: '¡Estado actualizado!',
          text: data.message,
          timer: 2000,
          showConfirmButton: false,
        });
        cargarReservas();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Error al actualizar el estado.',
        });
      }

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error del servidor',
        text: 'Ocurrió un problema al intentar actualizar el estado.',
      });
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
        <h2 className="text-2xl font-bold text-gray-800">Listado de Prácticas</h2>
        <div className="flex space-x-2">
          <button onClick={() => navigate('/reservas/agregar')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Agregar Reserva</button>
          <button onClick={exportarPDF} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">Exportar PDF</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="border px-3 py-2 rounded-lg" />
        <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="border px-3 py-2 rounded-lg" />
        <button onClick={filtrarPorFechas} className="bg-indigo-500 text-white px-4 py-2 rounded-lg">Buscar</button>
        <button onClick={resetearFiltro} className="bg-gray-400 text-white px-4 py-2 rounded-lg">Ver todas</button>
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
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {reservas && reservas.length > 0 ? (
              reservas.map((r, idx) => {
                const estado = obtenerEstadoReserva(r);
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
                    <td className="p-3 text-center flex flex-col items-center space-y-1">
                      <button onClick={() => navigate(`/reservas/editar/${r.ID}`)} className="text-blue-500 hover:text-blue-700 mb-1">
                        <FontAwesomeIcon icon={faEdit} className="text-lg" />
                      </button>
                      <button onClick={() => actualizarEstadoManual(r.ID, 'SUSPENDIDA')} className="text-red-600 text-xs hover:underline">
                        Suspender
                      </button>
                      <button onClick={() => actualizarEstadoManual(r.ID, 'REPROGRAMADA')} className="text-orange-500 text-xs hover:underline">
                        Reprogramar
                      </button>
                      <button onClick={() => actualizarEstadoManual(r.ID, null)} className="text-gray-500 text-xs hover:underline">
                        Quitar estado
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="11" className="text-center py-4 text-gray-500">No hay reservas registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Reservas;
