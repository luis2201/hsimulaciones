import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getData, postData, putData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const TemaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tema, setTema] = useState({
    MateriaID: '',
    Codigo: '',
    Nombre: ''
  });
  const [materias, setMaterias] = useState([]);

  useEffect(() => {
    cargarMaterias();
    if (id) {
      cargarTema(id);
    }
  }, [id]);

  const cargarMaterias = async () => {
    const materiasData = await getData('materias', true);
    setMaterias(materiasData || []);
  };

  const cargarTema = async (temaId) => {
    try {
      const response = await getData('temas', true);
      const temaEncontrado = Array.isArray(response)
        ? response.find(item => String(item.ID) === String(temaId))
        : null;

      if (!temaEncontrado) {
        MySwal.fire({
          icon: 'warning',
          title: 'No encontrado',
          text: 'No se encontró el tema seleccionado.',
          confirmButtonColor: '#FFA500',
          confirmButtonText: 'Entendido'
        });
        navigate('/temas');
        return;
      }

      setTema({
        MateriaID: temaEncontrado.MateriaID || '',
        Codigo: temaEncontrado.Codigo || '',
        Nombre: temaEncontrado.Nombre || ''
      });
    } catch (error) {
      console.error('Error al cargar el tema:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el tema.',
        confirmButtonColor: '#FF5733',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleChange = (e) => {
    setTema({ ...tema, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tema.MateriaID) {
      MySwal.fire({ icon: 'warning', title: 'Campo Obligatorio', text: 'Selecciona una materia.', confirmButtonColor: '#FFA500' });
      return;
    }

    if (!tema.Codigo.trim()) {
      MySwal.fire({ icon: 'warning', title: 'Campo Obligatorio', text: 'El campo "Código" es obligatorio.', confirmButtonColor: '#FFA500' });
      return;
    }

    if (!tema.Nombre.trim()) {
      MySwal.fire({ icon: 'warning', title: 'Campo Obligatorio', text: 'El campo "Nombre" es obligatorio.', confirmButtonColor: '#FFA500' });
      return;
    }

    const datosEnviar = {
      MateriaID: Number(tema.MateriaID),
      Codigo: tema.Codigo.trim(),
      Nombre: tema.Nombre.trim()
    };

    try {
      const response = id
        ? await putData(`temas/${id}`, datosEnviar, true)
        : await postData('temas', datosEnviar, true);

      MySwal.fire({ icon: 'success', title: 'Éxito', text: response.message, confirmButtonColor: '#4CAF50' });

      setTimeout(() => {
        navigate('/temas');
      }, 2000);
    } catch (error) {
      console.error('Error al guardar el tema:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'Hubo un problema al guardar los datos.', confirmButtonColor: '#FF5733' });
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-6 border relative">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white text-center py-3 rounded-t-lg relative">
          <h2 className="text-xl font-bold">{id ? 'Editar Tema' : 'Registro de Tema'}</h2>
          <button onClick={() => navigate('/temas')} className="absolute top-3 right-3 text-white hover:text-gray-300">
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-gray-700 font-medium">Materia</label>
            <select
              name="MateriaID"
              value={tema.MateriaID}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg text-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione...</option>
              {materias
                .filter(materia => materia.Estado === 1 || String(materia.ID) === String(tema.MateriaID))
                .map(materia => (
                  <option key={materia.ID} value={materia.ID}>
                    {materia.Nombre} - {materia.Carrera} - {materia.Nivel}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium">Código</label>
            <input
              type="text"
              name="Codigo"
              value={tema.Codigo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg text-gray-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium">Nombre</label>
            <input
              type="text"
              name="Nombre"
              value={tema.Nombre}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg text-gray-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-center mt-6">
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg transition flex items-center justify-center space-x-2 w-full">
              <FontAwesomeIcon icon={faSave} />
              <span>{id ? 'Actualizar' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default TemaForm;
