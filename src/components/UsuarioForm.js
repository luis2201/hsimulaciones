import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getData, postData, putData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const UsuarioForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [usuario, setUsuario] = useState({
    Nombres: '',
    Usuario: '',
    Rol: 'USUARIO',
    Password: ''
  });

  useEffect(() => {
    if (id) {
      cargarUsuario(id);
    }
  }, [id]);

  const cargarUsuario = async (userId) => {
    try {
      const response = await getData(`users/${userId}`, true);
      setUsuario({
        Nombres: response.Nombres || '',
        Usuario: response.Usuario || '',
        Rol: response.Rol?.toUpperCase() || 'USUARIO'
      });
    } catch (error) {
      console.error('❌ Error al cargar el usuario:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el usuario.',
        confirmButtonColor: '#FF5733', 
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleChange = (e) => {
    setUsuario({ ...usuario, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!usuario.Nombres.trim()) {
      MySwal.fire({
        icon: 'warning',
        title: 'Campo Obligatorio',
        text: 'El campo "Nombres" es obligatorio.',
        confirmButtonColor: '#FFA500', // Naranja
      });
      return;
    }
  
    if (!usuario.Usuario.trim()) {
      MySwal.fire({
        icon: 'warning',
        title: 'Campo Obligatorio',
        text: 'El campo "Usuario" es obligatorio.',
        confirmButtonColor: '#FFA500',
      });
      return;
    }
  
    if (!id && usuario.Password.trim().length < 8) {
      MySwal.fire({
        icon: 'warning',
        title: 'Contraseña Inválida',
        text: 'La contraseña debe tener al menos 8 caracteres.',
        confirmButtonColor: '#FF5733', // Rojo
      });
      return;
    }
  
    let datosEnviar = {
      Nombres: usuario.Nombres.trim(),
      Usuario: usuario.Usuario.trim(),
      Rol: usuario.Rol.toUpperCase()
    };
  
    if (!id) {
      datosEnviar.Password = usuario.Password.trim();
    }
  
    try {
      let response;
      if (id) {
        response = await putData(`users/${id}`, datosEnviar, true);
      } else {
        response = await postData('users', datosEnviar, true);
      }
  
      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: response.message,
        confirmButtonColor: '#4CAF50', // Verde
      });
  
      setTimeout(() => {
        navigate('/usuarios');
      }, 2000);
    } catch (error) {
      console.error('❌ Error al guardar el usuario:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al guardar los datos.',
        confirmButtonColor: '#FF5733', // Rojo
      });
    }
  };
  

  return (
    <Layout>
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-6 border relative">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white text-center py-3 rounded-t-lg relative">
          <h2 className="text-xl font-bold">{id ? 'Editar Usuario' : 'Registro de Usuario'}</h2>
          <button 
            onClick={() => navigate('/usuarios')} 
            className="absolute top-3 right-3 text-white hover:text-gray-300"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-gray-700 font-medium">Nombres</label>
            <input
              type="text"
              name="Nombres"
              value={usuario.Nombres}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg text-gray-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium">Usuario</label>
            <input
              type="text"
              name="Usuario"
              value={usuario.Usuario}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg text-gray-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!id && (
            <div>
              <label className="block text-gray-700 font-medium">Contraseña</label>
              <input
                type="password"
                name="Password"
                value={usuario.Password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg text-gray-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-medium">Rol</label>
            <select
              name="Rol"
              value={usuario.Rol}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg text-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="USUARIO">USUARIO</option>
            </select>
          </div>

          <div className="text-center mt-6">
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg transition flex items-center justify-center space-x-2 w-full"
            >
              <FontAwesomeIcon icon={faSave} />
              <span>{id ? 'Actualizar' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default UsuarioForm;
