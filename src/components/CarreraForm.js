import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getData, postData, putData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const CarreraForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [carrera, setCarrera] = useState({
    Nombre: ''
  });

  useEffect(() => {
    if (id) {
      cargarCarrera(id);
    }
  }, [id]);

  const cargarCarrera = async (carreraId) => {
    try {
      const response = await getData('carreras', true);
      const carreraEncontrada = Array.isArray(response)
        ? response.find(item => String(item.ID) === String(carreraId))
        : null;

      if (!carreraEncontrada) {
        MySwal.fire({
          icon: 'warning',
          title: 'No encontrada',
          text: 'No se encontró la carrera seleccionada.',
          confirmButtonColor: '#FFA500',
          confirmButtonText: 'Entendido'
        });
        navigate('/carreras');
        return;
      }

      setCarrera({
        Nombre: carreraEncontrada.Nombre || ''
      });
    } catch (error) {
      console.error('Error al cargar la carrera:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la carrera.',
        confirmButtonColor: '#FF5733',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleChange = (e) => {
    setCarrera({ ...carrera, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!carrera.Nombre.trim()) {
      MySwal.fire({
        icon: 'warning',
        title: 'Campo Obligatorio',
        text: 'El campo "Nombre" es obligatorio.',
        confirmButtonColor: '#FFA500',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const datosEnviar = {
      Nombre: carrera.Nombre.trim()
    };

    try {
      let response;
      if (id) {
        response = await putData(`carreras/${id}`, datosEnviar, true);
      } else {
        response = await postData('carreras', datosEnviar, true);
      }

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: response.message,
        confirmButtonColor: '#4CAF50',
      });

      setTimeout(() => {
        navigate('/carreras');
      }, 2000);
    } catch (error) {
      console.error('Error al guardar la carrera:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al guardar los datos.',
        confirmButtonColor: '#FF5733',
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-6 border relative">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white text-center py-3 rounded-t-lg relative">
          <h2 className="text-xl font-bold">{id ? 'Editar Carrera' : 'Registro de Carrera'}</h2>
          <button
            onClick={() => navigate('/carreras')}
            className="absolute top-3 right-3 text-white hover:text-gray-300"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-gray-700 font-medium">Nombre</label>
            <input
              type="text"
              name="Nombre"
              value={carrera.Nombre}
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
              <span>{id ? 'Actualizar' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CarreraForm;
