import React, { useEffect, useState } from 'react';
import { getData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MySwal = withReactContent(Swal);

const Niveles = () => {
  const [niveles, setNiveles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  const itemsPerPage = 5;

  useEffect(() => {
    cargarNiveles();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const cargarNiveles = async () => {
    try {
      const response = await getData('niveles', true);
      setNiveles(response || []);
    } catch (error) {
      console.error('Error al obtener los niveles:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los niveles.' });
    }
  };

  const nivelesFiltrados = niveles
    .filter(nivel => {
      const coincideTexto = `${nivel.Nombre || ''} ${nivel.Orden || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      return coincideTexto;
    })
    .sort((a, b) => {
      const ordenA = Number(a.Orden || 0);
      const ordenB = Number(b.Orden || 0);
      if (ordenA !== ordenB) return ordenAscendente ? ordenA - ordenB : ordenB - ordenA;
      return ordenAscendente
        ? String(a.Nombre || '').localeCompare(String(b.Nombre || ''))
        : String(b.Nombre || '').localeCompare(String(a.Nombre || ''));
    });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentNiveles = nivelesFiltrados.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(nivelesFiltrados.length / itemsPerPage));

  const exportarExcel = () => {
    const data = nivelesFiltrados.map(nivel => ({
      ID: nivel.ID,
      Nombre: nivel.Nombre,
      Orden: nivel.Orden
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Niveles');
    XLSX.writeFile(workbook, 'niveles.xlsx');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text('Listado de Niveles', 14, 15);

    const data = nivelesFiltrados.map(nivel => [
      nivel.ID,
      nivel.Nombre,
      nivel.Orden
    ]);

    autoTable(doc, {
      head: [['ID', 'Nombre', 'Orden']],
      body: data,
      startY: 20
    });

    doc.save('niveles.pdf');
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Consulta de Niveles</h2>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar nivel..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button
            onClick={() => setOrdenAscendente(!ordenAscendente)}
            className="bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300 transition text-sm"
          >
            Ordenar {ordenAscendente ? '↑' : '↓'}
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

      </div>

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-center">Orden</th>
            </tr>
          </thead>
          <tbody>
            {currentNiveles.length > 0 ? (
              currentNiveles.map((nivel) => (
                <tr key={nivel.ID} className="border-b">
                  <td className="p-3">{nivel.ID}</td>
                  <td className="p-3">{nivel.Nombre}</td>
                  <td className="p-3 text-center">{nivel.Orden}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="p-4 text-center text-gray-500">No hay niveles registrados.</td>
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

export default Niveles;
