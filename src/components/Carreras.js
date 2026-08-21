import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getData, putData, deleteData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faToggleOn, faToggleOff, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MySwal = withReactContent(Swal);

const Carreras = () => {
  const navigate = useNavigate();
  const [carreras, setCarreras] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState('todos');

  useEffect(() => {
    cargarCarreras();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFiltro]);

  const cargarCarreras = async () => {
    try {
      const response = await getData('carreras', true);
      setCarreras(response || []);
    } catch (error) {
      console.error('Error al obtener las carreras:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las carreras.',
      });
    }
  };

  const cambiarEstado = async (id, estadoActual) => {
    const accion = estadoActual === 1 ? 'eliminar' : 'activar';
    const confirmacion = await MySwal.fire({
      title: `¿Deseas ${accion} esta carrera?`,
      text: estadoActual === 1 ? 'La carrera será desactivada.' : 'La carrera será activada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      let response;
      if (estadoActual === 1) {
        response = await deleteData(`carreras/${id}`, true);
      } else {
        response = await putData(`carreras/activate/${id}`, {}, true);
      }

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: response.message,
        confirmButtonColor: '#4CAF50',
      });

      setCarreras(carreras.map(carrera =>
        carrera.ID === id ? { ...carrera, Estado: estadoActual === 1 ? 0 : 1 } : carrera
      ));
    } catch (error) {
      console.error('Error al cambiar el estado:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo completar la acción.',
        confirmButtonColor: '#FF5733',
      });
    }
  };

  const carrerasFiltradas = carreras
    .filter(carrera => {
      const coincideNombre = carrera.Nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const coincideEstado =
        estadoFiltro === 'todos' ||
        (estadoFiltro === 'activos' && carrera.Estado === 1) ||
        (estadoFiltro === 'eliminados' && carrera.Estado === 0);

      return coincideNombre && coincideEstado;
    })
    .sort((a, b) => {
      const nombreA = a.Nombre.toLowerCase();
      const nombreB = b.Nombre.toLowerCase();
      if (nombreA < nombreB) return ordenAscendente ? -1 : 1;
      if (nombreA > nombreB) return ordenAscendente ? 1 : -1;
      return 0;
    });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentCarreras = carrerasFiltradas.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(carrerasFiltradas.length / itemsPerPage));

  const exportarExcel = () => {
    const data = carrerasFiltradas.map(carrera => ({
      ID: carrera.ID,
      Nombre: carrera.Nombre,
      Estado: carrera.Estado === 1 ? 'Activo' : 'Eliminado'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Carreras');

    XLSX.writeFile(workbook, 'carreras.xlsx');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text('Listado de Carreras', 14, 15);

    const data = carrerasFiltradas.map(carrera => [
      carrera.ID,
      carrera.Nombre,
      carrera.Estado === 1 ? 'Activo' : 'Eliminado'
    ]);

    autoTable(doc, {
      head: [['ID', 'Nombre', 'Estado']],
      body: data,
      startY: 20
    });

    doc.save('carreras.pdf');
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Carreras</h2>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar carrera..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
          >
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="eliminados">Eliminados</option>
          </select>

          <button
            onClick={() => setOrdenAscendente(!ordenAscendente)}
            className="bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300 transition text-sm"
          >
            Ordenar {ordenAscendente ? '↑ A-Z' : '↓ Z-A'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <button
            onClick={exportarExcel}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition text-sm"
          >
            Exportar Excel
          </button>
          <button
            onClick={exportarPDF}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition text-sm"
          >
            Exportar PDF
          </button>
        </div>

        <button
          onClick={() => navigate('/carreras/agregar')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          Agregar Carrera
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentCarreras.length > 0 ? (
              currentCarreras.map((carrera) => (
                <tr key={carrera.ID} className="border-b">
                  <td className="p-3">{carrera.ID}</td>
                  <td className="p-3">{carrera.Nombre}</td>
                  <td className="p-3 text-center">
                    <span className={`px-3 py-1 text-white text-sm font-semibold rounded-full ${carrera.Estado === 1 ? 'bg-green-500' : 'bg-red-500'}`}>
                      {carrera.Estado === 1 ? 'Activo' : 'Eliminado'}
                    </span>
                  </td>
                  <td className="p-3 text-center flex justify-center space-x-4">
                    <button onClick={() => navigate(`/carreras/editar/${carrera.ID}`)} className="text-blue-500 hover:text-blue-700">
                      <FontAwesomeIcon icon={faEdit} className="text-lg" />
                    </button>
                    <button onClick={() => cambiarEstado(carrera.ID, carrera.Estado)} className="focus:outline-none">
                      <FontAwesomeIcon
                        icon={carrera.Estado === 1 ? faToggleOn : faToggleOff}
                        className={`text-2xl ${carrera.Estado === 1 ? 'text-green-500' : 'text-red-500'}`}
                      />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">No hay carreras registradas.</td>
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

export default Carreras;
