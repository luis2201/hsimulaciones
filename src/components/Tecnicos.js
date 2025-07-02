import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getData, putData, deleteData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faToggleOn, faToggleOff, faSearch, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MySwal = withReactContent(Swal);

const Tecnicos = () => {
  const navigate = useNavigate();
  const [tecnicos, setTecnicos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState('todos');

  useEffect(() => {
    cargarTecnicos();
  }, []);

  const cargarTecnicos = async () => {
    try {
      const response = await getData('tecnicos', true);
      setTecnicos(response);
    } catch (error) {
      console.error('Error al obtener los técnicos:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los técnicos.',
      });
    }
  };

  const cambiarEstado = async (id, estadoActual) => {
    const accion = estadoActual === 1 ? 'eliminar' : 'activar';
    const confirmacion = await MySwal.fire({
      title: `¿Deseas ${accion} este técnico?`,
      text: estadoActual === 1 ? 'El técnico será desactivado.' : 'El técnico será activado.',
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
        response = await deleteData(`tecnicos/${id}`, true);
      } else {
        response = await putData(`tecnicos/activate/${id}`, {}, true);
      }

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: response.message,
        confirmButtonColor: '#4CAF50',
      });

      setTecnicos(tecnicos.map(tecnico =>
        tecnico.ID === id ? { ...tecnico, Estado: estadoActual === 1 ? 0 : 1 } : tecnico
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

  // 🔍 Filtrado de búsqueda
  const tecnicosFiltrados = tecnicos
    .filter(tecnico => {
      const coincideNombre = tecnico.Nombres.toLowerCase().includes(searchTerm.toLowerCase());

      const coincideEstado =
        estadoFiltro === 'todos' ||
        (estadoFiltro === 'activos' && tecnico.Estado === 1) ||
        (estadoFiltro === 'eliminados' && tecnico.Estado === 0);

      return coincideNombre && coincideEstado;
    })
    .sort((a, b) => {
      const nombreA = a.Nombres.toLowerCase();
      const nombreB = b.Nombres.toLowerCase();
      if (nombreA < nombreB) return ordenAscendente ? -1 : 1;
      if (nombreA > nombreB) return ordenAscendente ? 1 : -1;
      return 0;
    });


  // 📌 Paginación
  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentTecnicos = tecnicosFiltrados.slice(indexOfFirstUser, indexOfLastUser);

  const totalPages = Math.ceil(tecnicosFiltrados.length / itemsPerPage);

  // Función para exportar a Excel
  const exportarExcel = () => {
    const data = tecnicosFiltrados.map(tecnico => ({
      ID: tecnico.ID,
      Nombres: tecnico.Nombres,
      Estado: tecnico.Estado === 1 ? 'Activo' : 'Eliminado'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Técnicos');

    XLSX.writeFile(workbook, 'tecnicos.xlsx');
  };

  // Función para exportar a PDF
const exportarPDF = () => {
  const doc = new jsPDF();
  doc.text('Listado de Técnicos', 14, 15);

  const data = tecnicosFiltrados.map(tecnico => [
    tecnico.ID,
    tecnico.Nombres,
    tecnico.Estado === 1 ? 'Activo' : 'Eliminado'
  ]);

  autoTable(doc, {
    head: [['ID', 'Nombres', 'Estado']],
    body: data,
    startY: 20
  });

  doc.save('tecnicos.pdf');
};


  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Técnicos</h2>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar técnico..."
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
          onClick={() => navigate('/tecnicos/agregar')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          Agregar Técnico
        </button>
      </div>


      {/* Tabla de técnicos */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Nombres</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentTecnicos.map((tecnico) => (
              <tr key={tecnico.ID} className="border-b">
                <td className="p-3">{tecnico.ID}</td>
                <td className="p-3">{tecnico.Nombres}</td>
                <td className="p-3 text-center">
                  <span className={`px-3 py-1 text-white text-sm font-semibold rounded-full ${tecnico.Estado === 1 ? 'bg-green-500' : 'bg-red-500'}`}>
                    {tecnico.Estado === 1 ? 'Activo' : 'Eliminado'}
                  </span>
                </td>
                <td className="p-3 text-center flex justify-center space-x-4">
                  <button onClick={() => navigate(`/tecnicos/editar/${tecnico.ID}`)} className="text-blue-500 hover:text-blue-700">
                    <FontAwesomeIcon icon={faEdit} className="text-lg" />
                  </button>
                  <button onClick={() => cambiarEstado(tecnico.ID, tecnico.Estado)} className="focus:outline-none">
                    <FontAwesomeIcon
                      icon={tecnico.Estado === 1 ? faToggleOn : faToggleOff}
                      className={`text-2xl ${tecnico.Estado === 1 ? 'text-green-500' : 'text-red-500'}`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        <div className="flex justify-center items-center mt-4 space-x-4">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="p-2 text-gray-600 hover:text-blue-600">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span>Página {currentPage} de {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="p-2 text-gray-600 hover:text-blue-600">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Tecnicos;
