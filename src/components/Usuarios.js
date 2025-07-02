import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getData, putData, deleteData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faToggleOn, faToggleOff, faSearch, faChevronLeft, faChevronRight, faRedo } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { getUserData } from '../services/apiService';

const MySwal = withReactContent(Swal);

const Usuarios = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { Rol } = getUserData();

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const response = await getData('users', true);
      setUsuarios(response);
    } catch (error) {
      console.error('Error al obtener los usuarios:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los usuarios.',
      });
    }
  };

  const cambiarEstado = async (id, estadoActual) => {
    const accion = estadoActual === 1 ? 'eliminar' : 'activar';
    const confirmacion = await MySwal.fire({
      title: `¿Deseas ${accion} este usuario?`,
      text: estadoActual === 1 ? 'El usuario será desactivado.' : 'El usuario será activado.',
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
        response = await deleteData(`users/${id}`, true);
      } else {
        response = await putData(`users/activate/${id}`, {}, true);
      }

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: response.message,
        confirmButtonColor: '#4CAF50',
      });

      setUsuarios(usuarios.map(usuario =>
        usuario.ID === id ? { ...usuario, Estado: estadoActual === 1 ? 0 : 1 } : usuario
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

  const resetearPassword = async (id) => {
    const confirmacion = await MySwal.fire({
      title: '¿Resetear contraseña?',
      text: 'La contraseña será restablecida a un valor por defecto.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, resetear',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await putData(`users/reset-password/${id}`, { Password: '12345678' }, true);
      MySwal.fire({
        icon: 'success',
        title: 'Contraseña restablecida',
        html: `La nueva contraseña es: <strong>12345678</strong>`,
        confirmButtonColor: '#4CAF50',
      });
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo restablecer la contraseña.',
        confirmButtonColor: '#FF5733',
      });
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario =>
    `${usuario.Nombres} ${usuario.Usuario} ${usuario.Rol}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentUsuarios = usuariosFiltrados.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(usuariosFiltrados.length / itemsPerPage);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
        <input
          type="text"
          placeholder="Buscar..."
          className="px-4 py-2 border border-gray-300 rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={() => navigate('/usuarios/agregar')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          Agregar Usuario
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Nombres</th>
              <th className="p-3 text-left">Usuario</th>
              <th className="p-3 text-left">Rol</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentUsuarios.map((usuario) => (
              <tr key={usuario.ID} className="border-b">
                <td className="p-3">{usuario.ID}</td>
                <td className="p-3">{usuario.Nombres}</td>
                <td className="p-3">{usuario.Usuario}</td>
                <td className="p-3">{usuario.Rol}</td>
                <td className="p-3 text-center">
                  <span className={`px-3 py-1 text-white text-sm font-semibold rounded-full ${usuario.Estado === 1 ? 'bg-green-500' : 'bg-red-500'}`}>
                    {usuario.Estado === 1 ? 'Activo' : 'Eliminado'}
                  </span>
                </td>
                <td className="p-3 text-center flex justify-center space-x-3">
                  <button onClick={() => navigate(`/usuarios/editar/${usuario.ID}`)} className="text-blue-500 hover:text-blue-700">
                    <FontAwesomeIcon icon={faEdit} className="text-lg" />
                  </button>
                  <button onClick={() => cambiarEstado(usuario.ID, usuario.Estado)} className="focus:outline-none">
                    <FontAwesomeIcon
                      icon={usuario.Estado === 1 ? faToggleOn : faToggleOff}
                      className={`text-2xl ${usuario.Estado === 1 ? 'text-green-500' : 'text-red-500'}`}
                    />
                  </button>
                  {Rol === 'ADMIN' && (
                    <button onClick={() => resetearPassword(usuario.ID)} className="text-yellow-500 hover:text-yellow-700">
                      <FontAwesomeIcon icon={faRedo} className="text-lg" title="Resetear contraseña" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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

export default Usuarios;
