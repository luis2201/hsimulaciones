import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getData, deleteData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faChevronLeft, faChevronRight, faPrint } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createGuiaPdf } from '../utils/guiaPdf';

const MySwal = withReactContent(Swal);

const Guias = () => {
  const navigate = useNavigate();
  const [guias, setGuias] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    cargarGuias();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const cargarGuias = async () => {
    try {
      const response = await getData('guias', true);
      setGuias(response || []);
    } catch (error) {
      console.error('Error al obtener las guías:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las guías.',
      });
    }
  };

  const eliminarGuia = async (id) => {
    const confirmacion = await MySwal.fire({
      title: '¿Deseas eliminar esta guía?',
      text: 'La guía será desactivada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await deleteData(`guias/${id}`, true);
      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: response.message,
        confirmButtonColor: '#4CAF50',
      });

      setGuias(guias.filter(guia => guia.ID !== id));
    } catch (error) {
      console.error('Error al eliminar la guía:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo completar la acción.',
        confirmButtonColor: '#FF5733',
      });
    }
  };

  const imprimirGuia = async (guia) => {
    try {
      const guiaDetalle = await getData(`guias/${guia.ID}`, true);
      if (!guiaDetalle) {
        throw new Error('No se encontró la guía seleccionada');
      }

      const solicitudes = await getData(`solicitudes/codigo-guia/${encodeURIComponent(guiaDetalle.Codigo)}`, true);
      const solicitudRelacionada = Array.isArray(solicitudes) && solicitudes.length > 0 ? solicitudes[0] : null;
      let estudiantes = [];
      let fotos = [];

      if (solicitudRelacionada?.ID) {
        const [estudiantesData, fotosData] = await Promise.all([
          getData(`solicitudes/${solicitudRelacionada.ID}/estudiantes`, true),
          getData(`solicitudes/${solicitudRelacionada.ID}/fotos`, true)
        ]);

        estudiantes = Array.isArray(estudiantesData) ? estudiantesData : [];
        fotos = Array.isArray(fotosData) ? fotosData : [];
      }

      await createGuiaPdf(guiaDetalle, estudiantes, fotos);
      MySwal.fire({
        icon: 'success',
        title: 'PDF generado',
        text: 'La guía se ha descargado correctamente.',
        confirmButtonColor: '#4CAF50',
      });
    } catch (error) {
      console.error('Error al generar el PDF de la guía:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo generar el PDF de la guía.',
        confirmButtonColor: '#FF5733',
      });
    }
  };

  const guiasFiltradas = guias.filter(guia => {
    const texto = [
      guia.Codigo,
      guia.TemaCodigo,
      guia.Tema,
      guia.Materia,
      guia.Docente,
      guia.Complejidad
    ].join(' ').toLowerCase();

    return texto.includes(searchTerm.toLowerCase());
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentGuias = guiasFiltradas.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(guiasFiltradas.length / itemsPerPage));

  const exportarExcel = () => {
    const data = guiasFiltradas.map(guia => ({
      ID: guia.ID,
      Codigo: guia.Codigo,
      Tema: guia.Tema,
      Materia: guia.Materia,
      Docente: guia.Docente,
      Complejidad: guia.Complejidad
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Guias');
    XLSX.writeFile(workbook, 'guias.xlsx');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text('Listado de Guías', 14, 15);

    const data = guiasFiltradas.map(guia => [
      guia.Codigo,
      guia.Tema,
      guia.Materia,
      guia.Docente,
      guia.Complejidad
    ]);

    autoTable(doc, {
      head: [['Código', 'Tema', 'Materia', 'Docente', 'Complejidad']],
      body: data,
      startY: 20
    });

    doc.save('guias.pdf');
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Guías</h2>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar guía..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <button onClick={() => navigate('/guias/docentes/resumen')} className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-lg transition text-sm">
            Guías por Docente
          </button>
          <button onClick={exportarExcel} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition text-sm">
            Exportar Excel
          </button>
          <button onClick={exportarPDF} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition text-sm">
            Exportar PDF
          </button>
        </div>

        <button
          onClick={() => navigate('/guias/agregar')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          Agregar Guía
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Tema</th>
              <th className="p-3 text-left">Materia</th>
              <th className="p-3 text-left">Docente</th>
              <th className="p-3 text-center">Complejidad</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentGuias.length > 0 ? (
              currentGuias.map((guia) => (
                <tr key={guia.ID} className="border-b">
                  <td className="p-3">{guia.Codigo}</td>
                  <td className="p-3">{guia.Tema}</td>
                  <td className="p-3">{guia.Materia}</td>
                  <td className="p-3">{guia.Docente}</td>
                  <td className="p-3 text-center">{guia.Complejidad}</td>
                  <td className="p-3 text-center flex justify-center space-x-4">
                    <button onClick={() => imprimirGuia(guia)} className="text-green-600 hover:text-green-700" title="Imprimir guía">
                      <FontAwesomeIcon icon={faPrint} className="text-lg" />
                    </button>
                    <button onClick={() => navigate(`/guias/editar/${guia.ID}`)} className="text-blue-500 hover:text-blue-700" title="Editar guía">
                      <FontAwesomeIcon icon={faEdit} className="text-lg" />
                    </button>
                    <button onClick={() => eliminarGuia(guia.ID)} className="text-red-500 hover:text-red-700" title="Eliminar guía">
                      <FontAwesomeIcon icon={faTrash} className="text-lg" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">No hay guías registradas.</td>
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

export default Guias;
