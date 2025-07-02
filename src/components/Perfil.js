import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getData, putData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const Perfil = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState({
    Nombres: '',    
    Password: '',
    ConfirmarPassword: '',
  });  

  useEffect(() => {    
    cargarDatosUsuario();
  }, []);
  

  const cargarDatosUsuario = async () => {
    try {      
      const response = await getData('users/me', true);       
  
      setUsuario({
        Nombres: response.Nombres || '',        
        Password: '',
        ConfirmarPassword: '',
      });
    } catch (error) {
      console.error('❌ Error al cargar los datos:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar tus datos.',
      });
    }
  };
  

  const handleChange = (e) => {
    setUsuario({ ...usuario, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (usuario.Password && usuario.Password.length < 8) {
      MySwal.fire({
        icon: 'warning',
        title: 'Contraseña Inválida',
        text: 'La contraseña debe tener al menos 8 caracteres.',
        confirmButtonColor: '#FF5733',
      });
      return;
    }

    if (usuario.Password !== usuario.ConfirmarPassword) {
      MySwal.fire({
        icon: 'warning',
        title: 'Error de Validación',
        text: 'Las contraseñas no coinciden.',
        confirmButtonColor: '#FF5733',
      });
      return;
    }

    let datosEnviar = {
      Nombres: usuario.Nombres.trim()      
    };

    if (usuario.Password) {
      datosEnviar.Password = usuario.Password.trim();
    }

    try {
      const response = await putData('users/me', datosEnviar, true); // 🔹 Ahora la API maneja `/me` para actualizar datos del usuario

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: response.message,
        confirmButtonColor: '#4CAF50',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('❌ Error al actualizar el perfil:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al actualizar tus datos.',
        confirmButtonColor: '#FF5733',
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-6 border">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white text-center py-3 rounded-t-lg">
          <h2 className="text-xl font-bold">Mi Perfil</h2>
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

          {/* Cambiar contraseña */}
          <div>
            <label className="block text-gray-700 font-medium">Nueva Contraseña</label>
            <input
              type="password"
              name="Password"
              value={usuario.Password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg text-gray-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium">Confirmar Contraseña</label>
            <input
              type="password"
              name="ConfirmarPassword"
              value={usuario.ConfirmarPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg text-gray-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-center mt-6">
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg transition flex items-center justify-center space-x-2 w-full"
            >
              <FontAwesomeIcon icon={faSave} />
              <span>Actualizar</span>
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Perfil;
