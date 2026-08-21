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

const Temas = () => {
  const navigate = useNavigate();
  const [temas, setTemas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const itemsPerPage = 5;

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFiltro]);

  const cargarDatos = async () => {
    try {
      const [temasData, materiasData] = await Promise.all([
        getData('temas', true),
        getData('materias', true)
      ]);
      setTemas(temasData || []);
      setMaterias(materiasData || []);
    } catch (error) {
      console.error('Error al obtener los temas:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los temas.' });
    }
  };

  const obtenerMateria = (materiaId) => {
    return materias.find(materia => String(materia.ID) === String(materiaId));
  };

  const cambiarEstado = async (id, estadoActual) => {
    const accion = estadoActual === 1 ? 'eliminar' : 'activar';
    const confirmacion = await MySwal.fire({
      title: `¿Deseas ${accion} este tema?`,
      text: estadoActual === 1 ? 'El tema será desactivado.' : 'El tema será activado.',
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
        ? await deleteData(`temas/${id}`, true)
        : await putData(`temas/activate/${id}`, {}, true);

      MySwal.fire({ icon: 'success', title: 'Éxito', text: response.message, confirmButtonColor: '#4CAF50' });
      setTemas(temas.map(tema =>
        tema.ID === id ? { ...tema, Estado: estadoActual === 1 ? 0 : 1 } : tema
      ));
    } catch (error) {
      console.error('Error al cambiar el estado:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'No se pudo completar la acción.', confirmButtonColor: '#FF5733' });
    }
  };

  const temasEnriquecidos = temas.map(tema => {
    const materia = obtenerMateria(tema.MateriaID);
    return {
      ...tema,
      Carrera: materia ? materia.Carrera : '',
      Nivel: materia ? materia.Nivel : '',
      MateriaNombre: tema.Materia || (materia ? materia.Nombre : '')
    };
  });

  const temasFiltrados = temasEnriquecidos
    .filter(tema => {
      const texto = `${tema.Codigo || ''} ${tema.Nombre || ''} ${tema.MateriaNombre || ''} ${tema.Carrera || ''} ${tema.Nivel || ''}`.toLowerCase();
      const coincideTexto = texto.includes(searchTerm.toLowerCase());
      const coincideEstado =
        estadoFiltro === 'todos' ||
        (estadoFiltro === 'activos' && tema.Estado === 1) ||
        (estadoFiltro === 'eliminados' && tema.Estado === 0);

      return coincideTexto && coincideEstado;
    })
    .sort((a, b) => {
      const valorA = `${a.MateriaNombre || ''} ${a.Codigo || ''} ${a.Nombre || ''}`.toLowerCase();
      const valorB = `${b.MateriaNombre || ''} ${b.Codigo || ''} ${b.Nombre || ''}`.toLowerCase();
      if (valorA < valorB) return ordenAscendente ? -1 : 1;
      if (valorA > valorB) return ordenAscendente ? 1 : -1;
      return 0;
    });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTemas = temasFiltrados.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(temasFiltrados.length / itemsPerPage));

  const exportarExcel = () => {
    const data = temasFiltrados.map(tema => ({
      ID: tema.ID,
      Codigo: tema.Codigo,
      Nombre: tema.Nombre,
      Materia: tema.MateriaNombre,
      Carrera: tema.Carrera,
      Nivel: tema.Nivel,
      Estado: tema.Estado === 1 ? 'Activo' : 'Eliminado'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Temas');
    XLSX.writeFile(workbook, 'temas.xlsx');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text('Listado de Temas', 14, 15);

    const data = temasFiltrados.map(tema => [
      tema.ID,
      tema.Codigo,
      tema.Nombre,
      tema.MateriaNombre,
      tema.Estado === 1 ? 'Activo' : 'Eliminado'
    ]);

    autoTable(doc, {
      head: [['ID', 'Código', 'Nombre', 'Materia', 'Estado']],
      body: data,
      startY: 20
    });

    doc.save('temas.pdf');
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Temas</h2>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar tema..."
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
          onClick={() => navigate('/temas/agregar')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          Agregar Tema
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Materia</th>
              <th className="p-3 text-left">Carrera</th>
              <th className="p-3 text-left">Nivel</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentTemas.length > 0 ? (
              currentTemas.map((tema) => (
                <tr key={tema.ID} className="border-b">
                  <td className="p-3">{tema.ID}</td>
                  <td className="p-3">{tema.Codigo}</td>
                  <td className="p-3">{tema.Nombre}</td>
                  <td className="p-3">{tema.MateriaNombre}</td>
                  <td className="p-3">{tema.Carrera}</td>
                  <td className="p-3">{tema.Nivel}</td>
                  <td className="p-3 text-center">
                    <span className={`px-3 py-1 text-white text-sm font-semibold rounded-full ${tema.Estado === 1 ? 'bg-green-500' : 'bg-red-500'}`}>
                      {tema.Estado === 1 ? 'Activo' : 'Eliminado'}
                    </span>
                  </td>
                  <td className="p-3 text-center flex justify-center space-x-4">
                    <button onClick={() => navigate(`/temas/editar/${tema.ID}`)} className="text-blue-500 hover:text-blue-700">
                      <FontAwesomeIcon icon={faEdit} className="text-lg" />
                    </button>
                    <button onClick={() => cambiarEstado(tema.ID, tema.Estado)} className="focus:outline-none">
                      <FontAwesomeIcon
                        icon={tema.Estado === 1 ? faToggleOn : faToggleOff}
                        className={`text-2xl ${tema.Estado === 1 ? 'text-green-500' : 'text-red-500'}`}
                      />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">No hay temas registrados.</td>
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

export default Temas;
