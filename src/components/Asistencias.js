import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardCheck, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const Asistencias = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const cargarSolicitudes = async () => {
    try {
      const response = await getData('solicitudes', true);
      setSolicitudes(response || []);
    } catch (error) {
      console.error('Error al obtener las solicitudes:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las solicitudes.' });
    }
  };

  const solicitudesFiltradas = solicitudes.filter(solicitud => {
    const texto = [
      solicitud.CodigoGuia,
      solicitud.Tema,
      solicitud.Materia,
      solicitud.Docente,
      solicitud.Sala,
      solicitud.TipoPractica,
      solicitud.EstadoSolicitud
    ].join(' ').toLowerCase();

    return texto.includes(searchTerm.toLowerCase());
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentSolicitudes = solicitudesFiltradas.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(solicitudesFiltradas.length / itemsPerPage));

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Control de Asistencias</h2>

        <input
          type="text"
          placeholder="Buscar solicitud..."
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentSolicitudes.length > 0 ? (
              currentSolicitudes.map((solicitud) => (
                <tr key={solicitud.ID} className="border-b">
                  <td className="p-3">{solicitud.CodigoGuia}</td>
                  <td className="p-3">{solicitud.Tema}</td>
                  <td className="p-3">{String(solicitud.Fecha || '').slice(0, 10)}</td>
                  <td className="p-3">{solicitud.HoraInicio} - {solicitud.HoraFin}</td>
                  <td className="p-3">{solicitud.Sala}</td>
                  <td className="p-3 text-center">{solicitud.NumEstudiantes}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => navigate(`/asistencias/solicitud/${solicitud.ID}`)} className="text-blue-500 hover:text-blue-700">
                      <FontAwesomeIcon icon={faClipboardCheck} className="text-lg" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">No hay solicitudes registradas.</td>
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

export default Asistencias;
