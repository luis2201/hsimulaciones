import React, { useEffect, useState } from 'react';
import { getData, getUserData, putData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faSave, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const ESTADOS_SOLICITUD = ['PENDIENTE', 'SUSPENDIDA', 'REPROGRAMADA', 'FINALIZADA'];

const fechaInput = (value) => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

const horaInput = (value) => {
  if (!value) return '';
  return String(value).slice(0, 5);
};

const calcularJornada = (hora) => {
  if (!hora) return 'AM';
  const [hh] = hora.split(':');
  return Number(hh) < 12 ? 'AM' : 'PM';
};

const buildEdicion = (solicitud) => ({
  Fecha: fechaInput(solicitud.Fecha),
  HoraInicio: horaInput(solicitud.HoraInicio),
  HoraFin: horaInput(solicitud.HoraFin),
  EstadoSolicitud: String(solicitud.EstadoSolicitud || 'PENDIENTE').trim().toUpperCase()
});

const buildPayloadFecha = (solicitud, edicion) => ({
  GuiaID: Number(solicitud.GuiaID),
  Fecha: edicion.Fecha,
  HoraInicio: edicion.HoraInicio,
  HoraFin: edicion.HoraFin,
  Jornada: calcularJornada(edicion.HoraInicio),
  NumEstudiantes: Number(solicitud.NumEstudiantes || 0),
  SalaID: Number(solicitud.SalaID),
  TipoPracticaID: Number(solicitud.TipoPracticaID),
  RecursoID: solicitud.RecursoID ? Number(solicitud.RecursoID) : '',
  TecnicoID: solicitud.TecnicoID ? Number(solicitud.TecnicoID) : '',
  SalaDebriefing: solicitud.SalaDebriefing || 'NINGUNA',
  ErroresProcedimiento: solicitud.ErroresProcedimiento || '',
  DificultadesHallazgos: solicitud.DificultadesHallazgos || ''
});

const buildPayloadEstado = (edicion) => {
  const payload = {
    EstadoSolicitud: edicion.EstadoSolicitud
  };

  if (edicion.EstadoSolicitud === 'REPROGRAMADA') {
    payload.Fecha = edicion.Fecha;
    payload.HoraInicio = edicion.HoraInicio;
    payload.HoraFin = edicion.HoraFin;
  }

  return payload;
};

const SolicitudesGestion = () => {
  const { Rol } = getUserData();
  const [solicitudes, setSolicitudes] = useState([]);
  const [ediciones, setEdiciones] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [guardandoId, setGuardandoId] = useState(null);
  const itemsPerPage = 5;
  const puedeGestionar = ['ADMIN'].includes(String(Rol || '').toUpperCase());

  useEffect(() => {
    if (puedeGestionar) {
      cargarSolicitudes();
    }
  }, [puedeGestionar]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const cargarSolicitudes = async () => {
    try {
      const response = await getData('solicitudes', true);
      const lista = response || [];
      setSolicitudes(lista);
      setEdiciones(Object.fromEntries(lista.map(solicitud => [solicitud.ID, buildEdicion(solicitud)])));
    } catch (error) {
      console.error('Error al obtener las solicitudes:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las solicitudes.' });
    }
  };

  const handleEdicionChange = (id, campo, value) => {
    setEdiciones(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [campo]: value
      }
    }));
  };

  const guardarCambios = async (solicitud) => {
    const edicion = ediciones[solicitud.ID];
    if (!edicion) return;

    if (!edicion.Fecha || !edicion.HoraInicio || !edicion.HoraFin) {
      MySwal.fire({ icon: 'warning', title: 'Datos incompletos', text: 'Fecha, hora de inicio y hora de fin son obligatorias.' });
      return;
    }

    if (edicion.HoraFin <= edicion.HoraInicio) {
      MySwal.fire({ icon: 'warning', title: 'Horario inválido', text: 'La hora de fin debe ser mayor que la hora de inicio.' });
      return;
    }

    const fechaCambio =
      edicion.Fecha !== fechaInput(solicitud.Fecha) ||
      edicion.HoraInicio !== horaInput(solicitud.HoraInicio) ||
      edicion.HoraFin !== horaInput(solicitud.HoraFin);
    const estadoCambio = edicion.EstadoSolicitud !== String(solicitud.EstadoSolicitud || 'PENDIENTE').trim().toUpperCase();

    if (!fechaCambio && !estadoCambio) {
      MySwal.fire({ icon: 'info', title: 'Sin cambios', text: 'No hay cambios para guardar.', timer: 1500, showConfirmButton: false });
      return;
    }

    setGuardandoId(solicitud.ID);

    try {
      if (fechaCambio && edicion.EstadoSolicitud !== 'REPROGRAMADA') {
        const solicitudActual = await getData(`solicitudes/${solicitud.ID}`, true);
        if (!solicitudActual) throw new Error('No se pudo obtener la solicitud actualizada.');

        await putData(`solicitudes/${solicitud.ID}`, buildPayloadFecha(solicitudActual, edicion), true);
      }

      if (estadoCambio || (fechaCambio && edicion.EstadoSolicitud === 'REPROGRAMADA')) {
        await putData(`solicitudes/${solicitud.ID}/estado`, buildPayloadEstado(edicion), true);
      }

      await cargarSolicitudes();
      MySwal.fire({
        icon: 'success',
        title: 'Cambios guardados',
        text: 'La solicitud fue actualizada correctamente.',
        timer: 1700,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al guardar los cambios de la solicitud:', error);
      const esChoque = String(error.message || '').includes('409');
      MySwal.fire({
        icon: 'error',
        title: esChoque ? 'Horario no disponible' : 'Error',
        text: esChoque ? 'La sala ya tiene una solicitud en ese horario.' : 'No se pudieron guardar los cambios.',
        confirmButtonColor: '#FF5733'
      });
    } finally {
      setGuardandoId(null);
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

  if (!puedeGestionar) {
    return (
      <Layout>
        <div className="bg-white shadow rounded-lg p-6 text-center text-gray-700">
          No tienes permisos para gestionar fechas y estados de solicitudes.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Fechas y Estados</h2>

        <input
          type="text"
          placeholder="Buscar solicitud..."
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button
          onClick={cargarSolicitudes}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faSyncAlt} />
          Actualizar
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
              <th className="p-3 text-left">Guía</th>
              <th className="p-3 text-left">Tema</th>
              <th className="p-3 text-left">Docente</th>
              <th className="p-3 text-left">Sala</th>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Inicio</th>
              <th className="p-3 text-left">Fin</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {currentSolicitudes.length > 0 ? (
              currentSolicitudes.map((solicitud) => {
                const edicion = ediciones[solicitud.ID] || buildEdicion(solicitud);
                return (
                  <tr key={solicitud.ID} className="border-b align-top">
                    <td className="p-3">{solicitud.CodigoGuia}</td>
                    <td className="p-3">{solicitud.Tema}</td>
                    <td className="p-3">{solicitud.Docente}</td>
                    <td className="p-3">{solicitud.Sala}</td>
                    <td className="p-3">
                      <input
                        type="date"
                        value={edicion.Fecha}
                        onChange={(e) => handleEdicionChange(solicitud.ID, 'Fecha', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="time"
                        value={edicion.HoraInicio}
                        onChange={(e) => handleEdicionChange(solicitud.ID, 'HoraInicio', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="time"
                        value={edicion.HoraFin}
                        onChange={(e) => handleEdicionChange(solicitud.ID, 'HoraFin', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={edicion.EstadoSolicitud}
                        onChange={(e) => handleEdicionChange(solicitud.ID, 'EstadoSolicitud', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        {ESTADOS_SOLICITUD.map(estado => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => guardarCambios(solicitud)}
                        disabled={guardandoId === solicitud.ID}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-3 py-2 rounded-lg"
                      >
                        <FontAwesomeIcon icon={faSave} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="p-4 text-center text-gray-500">No hay solicitudes registradas.</td>
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

export default SolicitudesGestion;
