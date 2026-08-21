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

const Materias = () => {
  const navigate = useNavigate();
  const [materias, setMaterias] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const itemsPerPage = 5;

  useEffect(() => {
    cargarMaterias();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFiltro]);

  const cargarMaterias = async () => {
    try {
      const response = await getData('materias', true);
      setMaterias(response || []);
    } catch (error) {
      console.error('Error al obtener las materias:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las materias.' });
    }
  };

  const cambiarEstado = async (id, estadoActual) => {
    const accion = estadoActual === 1 ? 'eliminar' : 'activar';
    const confirmacion = await MySwal.fire({
      title: `¿Deseas ${accion} esta materia?`,
      text: estadoActual === 1 ? 'La materia será desactivada.' : 'La materia será activada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = estadoActual === 1
        ? await deleteData(`materias/${id}`, true)
        : await putData(`materias/activate/${id}`, {}, true);

      MySwal.fire({ icon: 'success', title: 'Éxito', text: response.message, confirmButtonColor: '#4CAF50' });
      setMaterias(materias.map(materia =>
        materia.ID === id ? { ...materia, Estado: estadoActual === 1 ? 0 : 1 } : materia
      ));
    } catch (error) {
      console.error('Error al cambiar el estado:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'No se pudo completar la acción.', confirmButtonColor: '#FF5733' });
    }
  };

  const materiasFiltradas = materias
    .filter(materia => {
      const texto = `${materia.Nombre || ''} ${materia.Carrera || ''} ${materia.Nivel || ''}`.toLowerCase();
      const coincideTexto = texto.includes(searchTerm.toLowerCase());
      const coincideEstado =
        estadoFiltro === 'todos' ||
        (estadoFiltro === 'activos' && materia.Estado === 1) ||
        (estadoFiltro === 'eliminados' && materia.Estado === 0);

      return coincideTexto && coincideEstado;
    })
    .sort((a, b) => {
      const valorA = `${a.Carrera || ''} ${a.Nivel || ''} ${a.Nombre || ''}`.toLowerCase();
      const valorB = `${b.Carrera || ''} ${b.Nivel || ''} ${b.Nombre || ''}`.toLowerCase();
      if (valorA < valorB) return ordenAscendente ? -1 : 1;
      if (valorA > valorB) return ordenAscendente ? 1 : -1;
      return 0;
    });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentMaterias = materiasFiltradas.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(materiasFiltradas.length / itemsPerPage));

  const exportarExcel = () => {
    const data = materiasFiltradas.map(materia => ({
      ID: materia.ID,
      Carrera: materia.Carrera,
      Nivel: materia.Nivel,
      Nombre: materia.Nombre,
      Estado: materia.Estado === 1 ? 'Activo' : 'Eliminado'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Materias');
    XLSX.writeFile(workbook, 'materias.xlsx');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text('Listado de Materias', 14, 15);

    const data = materiasFiltradas.map(materia => [
      materia.ID,
      materia.Carrera,
      materia.Nivel,
      materia.Nombre,
      materia.Estado === 1 ? 'Activo' : 'Eliminado'
    ]);

    autoTable(doc, {
      head: [['ID', 'Carrera', 'Nivel', 'Nombre', 'Estado']],
      body: data,
      startY: 20
    });

    doc.save('materias.pdf');
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Materias</h2>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar materia..."
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
          <button onClick={exportarExcel} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition text-sm">
            Exportar Excel
          </button>
          <button onClick={exportarPDF} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition text-sm">
            Exportar PDF
          </button>
        </div>

        <button
          onClick={() => navigate('/materias/agregar')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          Agregar Materia
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Carrera</th>
              <th className="p-3 text-left">Nivel</th>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentMaterias.length > 0 ? (
              currentMaterias.map((materia) => (
                <tr key={materia.ID} className="border-b">
                  <td className="p-3">{materia.ID}</td>
                  <td className="p-3">{materia.Carrera}</td>
                  <td className="p-3">{materia.Nivel}</td>
                  <td className="p-3">{materia.Nombre}</td>
                  <td className="p-3 text-center">
                    <span className={`px-3 py-1 text-white text-sm font-semibold rounded-full ${materia.Estado === 1 ? 'bg-green-500' : 'bg-red-500'}`}>
                      {materia.Estado === 1 ? 'Activo' : 'Eliminado'}
                    </span>
                  </td>
                  <td className="p-3 text-center flex justify-center space-x-4">
                    <button onClick={() => navigate(`/materias/editar/${materia.ID}`)} className="text-blue-500 hover:text-blue-700">
                      <FontAwesomeIcon icon={faEdit} className="text-lg" />
                    </button>
                    <button onClick={() => cambiarEstado(materia.ID, materia.Estado)} className="focus:outline-none">
                      <FontAwesomeIcon
                        icon={materia.Estado === 1 ? faToggleOn : faToggleOff}
                        className={`text-2xl ${materia.Estado === 1 ? 'text-green-500' : 'text-red-500'}`}
                      />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">No hay materias registradas.</td>
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

export default Materias;
