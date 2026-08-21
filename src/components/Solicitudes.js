import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getData, deleteData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faClipboardCheck, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MySwal = withReactContent(Swal);

const ESTADOS_MANUALES = ['SUSPENDIDA', 'REPROGRAMADA'];

const Solicitudes = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ahora, setAhora] = useState(new Date());
  const itemsPerPage = 5;

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const interval = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const response = await getData('solicitudes', true);
      setSolicitudes(response || []);
    } catch (error) {
      console.error('Error al obtener las solicitudes:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las solicitudes.' });
    }
  };

  const eliminarSolicitud = async (id) => {
    const confirmacion = await MySwal.fire({
      title: '¿Deseas eliminar esta solicitud?',
      text: 'La solicitud será desactivada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await deleteData(`solicitudes/${id}`, true);
      MySwal.fire({ icon: 'success', title: 'Éxito', text: response.message, confirmButtonColor: '#4CAF50' });
      setSolicitudes(solicitudes.filter(solicitud => solicitud.ID !== id));
    } catch (error) {
      console.error('Error al eliminar la solicitud:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'No se pudo completar la acción.', confirmButtonColor: '#FF5733' });
    }
  };

  const obtenerEstadoSolicitud = (solicitud) => {
    const estadoGuardado = String(solicitud.EstadoSolicitud || '').trim().toUpperCase();
    if (ESTADOS_MANUALES.includes(estadoGuardado)) return estadoGuardado;

    const fecha = String(solicitud.Fecha || '').slice(0, 10);
    const horaInicio = solicitud.HoraInicio;
    const horaFin = solicitud.HoraFin;

    if (!fecha || !horaInicio || !horaFin) return estadoGuardado || 'PENDIENTE';

    const inicio = new Date(`${fecha}T${horaInicio}`);
    const fin = new Date(`${fecha}T${horaFin}`);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      return estadoGuardado || 'PENDIENTE';
    }

    if (ahora < inicio) return 'PENDIENTE';
    if (ahora >= inicio && ahora <= fin) return 'EN CURSO';
    return 'FINALIZADA';
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-blue-500';
      case 'EN CURSO': return 'bg-yellow-500 text-gray-900';
      case 'FINALIZADA': return 'bg-green-600';
      case 'SUSPENDIDA': return 'bg-red-600';
      case 'REPROGRAMADA': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const solicitudesFiltradas = solicitudes.filter(solicitud => {
    const estado = obtenerEstadoSolicitud(solicitud);
    const texto = [
      solicitud.CodigoGuia,
      solicitud.Tema,
      solicitud.Materia,
      solicitud.Docente,
      solicitud.Sala,
      solicitud.TipoPractica,
      estado
    ].join(' ').toLowerCase();

    return texto.includes(searchTerm.toLowerCase());
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentSolicitudes = solicitudesFiltradas.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(solicitudesFiltradas.length / itemsPerPage));

  const exportarExcel = () => {
    const data = solicitudesFiltradas.map(solicitud => ({
      ID: solicitud.ID,
      Guia: solicitud.CodigoGuia,
      Fecha: solicitud.Fecha,
      Horario: `${solicitud.HoraInicio} - ${solicitud.HoraFin}`,
      Sala: solicitud.Sala,
      TipoPractica: solicitud.TipoPractica,
      Estudiantes: solicitud.NumEstudiantes,
      Estado: obtenerEstadoSolicitud(solicitud)
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Solicitudes');
    XLSX.writeFile(workbook, 'solicitudes.xlsx');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text('Listado de Solicitudes', 14, 15);

    const data = solicitudesFiltradas.map(solicitud => [
      solicitud.CodigoGuia,
      solicitud.Fecha,
      `${solicitud.HoraInicio} - ${solicitud.HoraFin}`,
      solicitud.Sala,
      solicitud.TipoPractica,
      solicitud.NumEstudiantes,
      obtenerEstadoSolicitud(solicitud)
    ]);

    autoTable(doc, {
      head: [['Guía', 'Fecha', 'Horario', 'Sala', 'Tipo', 'Estudiantes', 'Estado']],
      body: data,
      startY: 20
    });

    doc.save('solicitudes.pdf');
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Solicitudes</h2>

        <input
          type="text"
          placeholder="Buscar solicitud..."
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex flex-wrap gap-2 mt-2">
          <button onClick={exportarExcel} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition text-sm">
            Exportar Excel
          </button>
          <button onClick={exportarPDF} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition text-sm">
            Exportar PDF
          </button>
        </div>

        <button
          onClick={() => navigate('/solicitudes/agregar')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          Agregar Solicitud
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
              <th className="p-3 text-left">Guía</th>
              <th className="p-3 text-left">Tema</th>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Horario</th>
              <th className="p-3 text-left">Sala</th>
              <th className="p-3 text-center">Estudiantes</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentSolicitudes.length > 0 ? (
              currentSolicitudes.map((solicitud) => {
                const estado = obtenerEstadoSolicitud(solicitud);
                return (
                  <tr key={solicitud.ID} className="border-b">
                    <td className="p-3">{solicitud.CodigoGuia}</td>
                    <td className="p-3">{solicitud.Tema}</td>
                    <td className="p-3">{String(solicitud.Fecha || '').slice(0, 10)}</td>
                    <td className="p-3">{solicitud.HoraInicio} - {solicitud.HoraFin}</td>
                    <td className="p-3">{solicitud.Sala}</td>
                    <td className="p-3 text-center">{solicitud.NumEstudiantes}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block text-white px-2 py-1 rounded-full text-xs font-semibold ${obtenerColorEstado(estado)}`}>
                        {estado}
                      </span>
                    </td>
                    <td className="p-3 text-center flex justify-center space-x-4">
                      <button onClick={() => navigate(`/solicitudes/editar/${solicitud.ID}`)} className="text-blue-500 hover:text-blue-700">
                        <FontAwesomeIcon icon={faEdit} className="text-lg" />
                      </button>
                      <button onClick={() => navigate(`/asistencias/solicitud/${solicitud.ID}`)} className="text-green-500 hover:text-green-700">
                        <FontAwesomeIcon icon={faClipboardCheck} className="text-lg" />
                      </button>
                      <button onClick={() => eliminarSolicitud(solicitud.ID)} className="text-red-500 hover:text-red-700">
                        <FontAwesomeIcon icon={faTrash} className="text-lg" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">No hay solicitudes registradas.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-center items-center mt-4 space-x-4">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="p-2 text-gray-600 hover:text-blue-600 disabled:text-gray-300">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span>Página {currentPage} de {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="p-2 text-gray-600 hover:text-blue-600 disabled:text-gray-300">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Solicitudes;
