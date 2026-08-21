import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faEye, faTimes } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const formatearFecha = (fecha) => {
  if (!fecha) return '-';

  const fechaNormalizada = String(fecha).slice(0, 10);
  const date = new Date(`${fechaNormalizada}T00:00:00`);

  if (Number.isNaN(date.getTime())) return fechaNormalizada;

  return date.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const GuiasDocentesResumen = () => {
  const navigate = useNavigate();
  const [docentes, setDocentes] = useState([]);
  const [guiasDocente, setGuiasDocente] = useState([]);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingGuias, setLoadingGuias] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    cargarResumen();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const cargarResumen = async () => {
    try {
      setLoading(true);
      const response = await getData('guias/docentes/resumen', true);
      setDocentes(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error al cargar el resumen de guías por docente:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el resumen de guías por docente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const verGuiasDocente = async (docente) => {
    try {
      setDocenteSeleccionado(docente);
      setGuiasDocente([]);
      setLoadingGuias(true);

      const response = await getData(`guias/docentes/${docente.DocenteID}`, true);
      setGuiasDocente(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error al cargar guías del docente:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las guías del docente.',
      });
    } finally {
      setLoadingGuias(false);
    }
  };

  const cerrarDetalle = () => {
    setDocenteSeleccionado(null);
    setGuiasDocente([]);
  };

  const docentesFiltrados = useMemo(() => {
    const busqueda = searchTerm.toLowerCase();

    return docentes.filter((docente) => {
      const texto = [
        docente.DocenteID,
        docente.Docente,
        docente.TotalGuias
      ].join(' ').toLowerCase();

      return texto.includes(busqueda);
    });
  }, [docentes, searchTerm]);

  const totalGuias = docentesFiltrados.reduce((total, docente) => total + Number(docente.TotalGuias || 0), 0);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentDocentes = docentesFiltrados.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(docentesFiltrados.length / itemsPerPage));

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Guías por Docente</h2>
            <p className="text-sm text-gray-500 mt-1">
              {docentesFiltrados.length} docentes · {totalGuias} guías registradas
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => navigate('/guias')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg transition"
            >
              Volver a Guías
            </button>
            <button
              type="button"
              onClick={cargarResumen}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              Actualizar
            </button>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-4">
          <input
            type="text"
            placeholder="Buscar docente..."
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto bg-white shadow-lg rounded-lg p-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
                <th className="p-3 text-left">Docente</th>
                <th className="p-3 text-center">Total de Guías</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="p-6 text-center text-gray-500">Cargando docentes...</td>
                </tr>
              ) : currentDocentes.length > 0 ? (
                currentDocentes.map((docente) => (
                  <tr key={docente.DocenteID} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{docente.Docente}</td>
                    <td className="p-3 text-center">{docente.TotalGuias}</td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => verGuiasDocente(docente)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition inline-flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faEye} />
                        Ver guías
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-6 text-center text-gray-500">No hay docentes con guías registradas.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-center items-center mt-4 space-x-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-2 text-gray-600 hover:text-blue-600 disabled:text-gray-300"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <span>Página {currentPage} de {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-2 text-gray-600 hover:text-blue-600 disabled:text-gray-300"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>

        {docenteSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-blue-600 text-white">
                <div>
                  <h3 className="text-xl font-bold">Guías subidas</h3>
                  <p className="text-sm text-blue-100">{docenteSeleccionado.Docente}</p>
                </div>
                <button
                  type="button"
                  onClick={cerrarDetalle}
                  className="text-white hover:text-gray-200"
                >
                  <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[72vh]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
                        <th className="p-3 text-left">Código</th>
                        <th className="p-3 text-left">Tema</th>
                        <th className="p-3 text-left">Materia</th>
                        <th className="p-3 text-center">Complejidad</th>
                        <th className="p-3 text-center">Fecha Diseño</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingGuias ? (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-gray-500">Cargando guías...</td>
                        </tr>
                      ) : guiasDocente.length > 0 ? (
                        guiasDocente.map((guia) => (
                          <tr key={guia.ID} className="border-b">
                            <td className="p-3">{guia.Codigo || '-'}</td>
                            <td className="p-3">{guia.Tema || '-'}</td>
                            <td className="p-3">{guia.Materia || '-'}</td>
                            <td className="p-3 text-center">{guia.Complejidad || '-'}</td>
                            <td className="p-3 text-center">{formatearFecha(guia.FechaDiseno)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-gray-500">Este docente no tiene guías registradas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GuiasDocentesResumen;
