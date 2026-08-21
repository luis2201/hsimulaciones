import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getData, postData, putData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const MateriaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [materia, setMateria] = useState({
    CarreraID: '',
    NivelID: '',
    Nombre: ''
  });
  const [carreras, setCarreras] = useState([]);
  const [niveles, setNiveles] = useState([]);

  useEffect(() => {
    cargarListas();
    if (id) {
      cargarMateria(id);
    }
  }, [id]);

  const cargarListas = async () => {
    const carrerasData = await getData('carreras', true);
    const nivelesData = await getData('niveles', true);
    setCarreras(carrerasData || []);
    setNiveles(nivelesData || []);
  };

  const cargarMateria = async (materiaId) => {
    try {
      const response = await getData('materias', true);
      const materiaEncontrada = Array.isArray(response)
        ? response.find(item => String(item.ID) === String(materiaId))
        : null;

      if (!materiaEncontrada) {
        MySwal.fire({
          icon: 'warning',
          title: 'No encontrada',
          text: 'No se encontró la materia seleccionada.',
          confirmButtonColor: '#FFA500',
          confirmButtonText: 'Entendido'
        });
        navigate('/materias');
        return;
      }

      setMateria({
        CarreraID: materiaEncontrada.CarreraID || '',
        NivelID: materiaEncontrada.NivelID || '',
        Nombre: materiaEncontrada.Nombre || ''
      });
    } catch (error) {
      console.error('Error al cargar la materia:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la materia.',
        confirmButtonColor: '#FF5733',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleChange = (e) => {
    setMateria({ ...materia, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!materia.CarreraID) {
      MySwal.fire({ icon: 'warning', title: 'Campo Obligatorio', text: 'Selecciona una carrera.', confirmButtonColor: '#FFA500' });
      return;
    }

    if (!materia.NivelID) {
      MySwal.fire({ icon: 'warning', title: 'Campo Obligatorio', text: 'Selecciona un nivel.', confirmButtonColor: '#FFA500' });
      return;
    }

    if (!materia.Nombre.trim()) {
      MySwal.fire({ icon: 'warning', title: 'Campo Obligatorio', text: 'El campo "Nombre" es obligatorio.', confirmButtonColor: '#FFA500' });
      return;
    }

    const datosEnviar = {
      CarreraID: Number(materia.CarreraID),
      NivelID: Number(materia.NivelID),
      Nombre: materia.Nombre.trim()
    };

    try {
      const response = id
        ? await putData(`materias/${id}`, datosEnviar, true)
        : await postData('materias', datosEnviar, true);

      MySwal.fire({ icon: 'success', title: 'Éxito', text: response.message, confirmButtonColor: '#4CAF50' });

      setTimeout(() => {
        navigate('/materias');
      }, 2000);
    } catch (error) {
      console.error('Error al guardar la materia:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'Hubo un problema al guardar los datos.', confirmButtonColor: '#FF5733' });
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-6 border relative">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white text-center py-3 rounded-t-lg relative">
          <h2 className="text-xl font-bold">{id ? 'Editar Materia' : 'Registro de Materia'}</h2>
          <button onClick={() => navigate('/materias')} className="absolute top-3 right-3 text-white hover:text-gray-300">
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-gray-700 font-medium">Carrera</label>
            <select
              name="CarreraID"
              value={materia.CarreraID}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg text-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione...</option>
              {carreras
                .filter(carrera => carrera.Estado === 1 || String(carrera.ID) === String(materia.CarreraID))
                .map(carrera => (
                  <option key={carrera.ID} value={carrera.ID}>{carrera.Nombre}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium">Nivel</label>
            <select
              name="NivelID"
              value={materia.NivelID}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg text-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione...</option>
              {niveles
                .filter(nivel => nivel.Estado === 1 || String(nivel.ID) === String(materia.NivelID))
                .map(nivel => (
                  <option key={nivel.ID} value={nivel.ID}>{nivel.Nombre}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium">Nombre</label>
            <input
              type="text"
              name="Nombre"
              value={materia.Nombre}
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

export default MateriaForm;
