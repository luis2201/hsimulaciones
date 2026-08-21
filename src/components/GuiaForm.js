import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getData, postData, putData, getUserData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const camposTexto = [
  { name: 'TecnicasProcedimientos', label: 'Técnicas / Procedimientos' },
  { name: 'ContextoClinicoEscenario', label: 'Contexto Clínico del Escenario' },
  { name: 'ConocimientosPrevios', label: 'Conocimientos Previos' },
  { name: 'ObjetivosAprendizaje', label: 'Objetivos de Aprendizaje' },
  { name: 'ResultadosAprendizaje', label: 'Resultados de Aprendizaje' },
  { name: 'DescripcionAmbienteAprendizaje', label: 'Descripción del Ambiente de Aprendizaje' },
  { name: 'MaterialEquiposMedicos', label: 'Material y Equipos Médicos' }
];

const camposActor = [
  { name: 'CaracteristicasActor', label: 'Características del Actor' },
  { name: 'DescripcionEscena', label: 'Descripción de Escena' },
  { name: 'Libreto', label: 'Libreto' }
];

const fechaInput = (value) => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

const GuiaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { Nombres } = getUserData();
  const [guia, setGuia] = useState({
    TemaID: '',
    TemaCodigo: '',
    TemaNombre: '',
    Complejidad: 'BAJA',
    TemaCaso: '',
    TecnicasProcedimientos: '',
    ContextoClinicoEscenario: '',
    ConocimientosPrevios: '',
    ObjetivosAprendizaje: '',
    ResultadosAprendizaje: '',
    DescripcionAmbienteAprendizaje: '',
    MaterialEquiposMedicos: '',
    NumeroActor: '',
    CaracteristicasActor: '',
    DescripcionEscena: '',
    Libreto: '',
    FechaDiseno: '',
    Autor: '',
    FechaValidacion: '',
    ReferenciasBibliograficas: ''
  });

  useEffect(() => {
    cargarAutor();
    if (id) cargarGuia(id);
  }, [id]);

  const cargarAutor = async () => {
    const usuarioActual = await getData('users/me', true);
    setGuia(prev => ({
      ...prev,
      Autor: usuarioActual?.Nombres || Nombres || ''
    }));
  };

  const cargarGuia = async (guiaId) => {
    try {
      const response = await getData(`guias/${guiaId}`, true);
      if (!response) {
        navigate('/guias');
        return;
      }

      setGuia({
        TemaID: response.TemaID || '',
        TemaCodigo: response.TemaCodigo || '',
        TemaNombre: response.Tema || '',
        Complejidad: response.Complejidad || 'BAJA',
        TemaCaso: response.TemaCaso || '',
        TecnicasProcedimientos: response.TecnicasProcedimientos || '',
        ContextoClinicoEscenario: response.ContextoClinicoEscenario || '',
        ConocimientosPrevios: response.ConocimientosPrevios || '',
        ObjetivosAprendizaje: response.ObjetivosAprendizaje || '',
        ResultadosAprendizaje: response.ResultadosAprendizaje || '',
        DescripcionAmbienteAprendizaje: response.DescripcionAmbienteAprendizaje || '',
        MaterialEquiposMedicos: response.MaterialEquiposMedicos || '',
        NumeroActor: response.NumeroActor || '',
        CaracteristicasActor: response.CaracteristicasActor || '',
        DescripcionEscena: response.DescripcionEscena || '',
        Libreto: response.Libreto || '',
        FechaDiseno: fechaInput(response.FechaDiseno),
        Autor: response.Autor || Nombres || '',
        FechaValidacion: fechaInput(response.FechaValidacion),
        ReferenciasBibliograficas: response.ReferenciasBibliograficas || ''
      });
    } catch (error) {
      console.error('Error al cargar la guía:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la guía.',
        confirmButtonColor: '#FF5733',
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...guia, [name]: value };

    if (name === 'Complejidad' && value !== 'ALTA') {
      updated.NumeroActor = '';
      updated.CaracteristicasActor = '';
      updated.DescripcionEscena = '';
      updated.Libreto = '';
    }

    if (name === 'TemaCodigo') {
      updated.TemaID = '';
      updated.TemaNombre = '';
    }

    setGuia(updated);
  };

  const buscarTemaPorCodigo = async () => {
    const codigo = guia.TemaCodigo.trim();

    if (!codigo) {
      setGuia(prev => ({ ...prev, TemaID: '', TemaNombre: '' }));
      return;
    }

    try {
      const tema = await getData(`temas/codigo/${encodeURIComponent(codigo)}`, true);

      if (!tema || !tema.ID) {
        setGuia(prev => ({ ...prev, TemaID: '', TemaNombre: '' }));
        MySwal.fire({
          icon: 'warning',
          title: 'Tema no encontrado',
          text: 'No se encontró un tema con ese código.',
          confirmButtonColor: '#FFA500',
        });
        return;
      }

      setGuia(prev => ({
        ...prev,
        TemaID: tema.ID,
        TemaCodigo: tema.Codigo || codigo,
        TemaNombre: tema.Nombre || ''
      }));
    } catch (error) {
      console.error('Error al buscar el tema:', error);
      setGuia(prev => ({ ...prev, TemaID: '', TemaNombre: '' }));
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo buscar el tema.',
        confirmButtonColor: '#FF5733',
      });
    }
  };

  const validar = () => {
    if (!guia.TemaID) {
      MySwal.fire({ icon: 'warning', title: 'Campo Obligatorio', text: 'Selecciona un tema.', confirmButtonColor: '#FFA500' });
      return false;
    }

    if (!guia.Complejidad) {
      MySwal.fire({ icon: 'warning', title: 'Campo Obligatorio', text: 'Selecciona la complejidad.', confirmButtonColor: '#FFA500' });
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    const payload = {
      TemaID: Number(guia.TemaID),
      Complejidad: guia.Complejidad,
      TemaCaso: guia.TemaCaso,
      TecnicasProcedimientos: guia.TecnicasProcedimientos,
      ContextoClinicoEscenario: guia.ContextoClinicoEscenario,
      ConocimientosPrevios: guia.ConocimientosPrevios,
      ObjetivosAprendizaje: guia.ObjetivosAprendizaje,
      ResultadosAprendizaje: guia.ResultadosAprendizaje,
      DescripcionAmbienteAprendizaje: guia.DescripcionAmbienteAprendizaje,
      MaterialEquiposMedicos: guia.MaterialEquiposMedicos,
      NumeroActor: guia.NumeroActor,
      CaracteristicasActor: guia.CaracteristicasActor,
      DescripcionEscena: guia.DescripcionEscena,
      Libreto: guia.Libreto,
      FechaDiseno: guia.FechaDiseno,
      Autor: guia.Autor,
      FechaValidacion: guia.FechaValidacion,
      ReferenciasBibliograficas: guia.ReferenciasBibliograficas
    };

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    try {
      const response = id
        ? await putData(`guias/${id}`, buildPayload(), true)
        : await postData('guias', buildPayload(), true);

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: response.message,
        confirmButtonColor: '#4CAF50',
      });

      setTimeout(() => {
        navigate('/guias');
      }, 1500);
    } catch (error) {
      console.error('Error al guardar la guía:', error);
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
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 border relative">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white text-center py-3 rounded-t-lg relative">
          <h2 className="text-xl font-bold">{id ? 'Editar Guía' : 'Registro de Guía'}</h2>
          <button onClick={() => navigate('/guias')} className="absolute top-3 right-3 text-white hover:text-gray-300">
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-gray-700 font-medium">Código del Tema</label>
              <input
                type="text"
                name="TemaCodigo"
                value={guia.TemaCodigo}
                onChange={handleChange}
                onBlur={buscarTemaPorCodigo}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarTemaPorCodigo();
                  }
                }}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-gray-700 font-medium">Tema</label>
              <input
                type="text"
                value={guia.TemaNombre}
                readOnly
                className="w-full border border-gray-300 p-2 rounded bg-gray-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium">Complejidad</label>
              <select name="Complejidad" value={guia.Complejidad} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded">
                <option value="BAJA">BAJA</option>
                <option value="MEDIANA">MEDIANA</option>
                <option value="ALTA">ALTA</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium">Autor</label>
              <input type="text" name="Autor" value={guia.Autor} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {camposTexto.map(campo => (
              <div key={campo.name}>
                <label className="block text-gray-700 font-medium">{campo.label}</label>
                <textarea
                  name={campo.name}
                  value={guia[campo.name]}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
            ))}

            <div>
              <label className="block text-gray-700 font-medium">Referencias Bibliográficas</label>
              <textarea
                name="ReferenciasBibliograficas"
                value={guia.ReferenciasBibliograficas}
                onChange={handleChange}
                rows="3"
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>
          </div>

          {guia.Complejidad === 'ALTA' && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Actor</h3>
              <div>
                <label className="block text-gray-700 font-medium">Número de Actor</label>
                <input type="text" name="NumeroActor" value={guia.NumeroActor} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {camposActor.map(campo => (
                  <div key={campo.name}>
                    <label className="block text-gray-700 font-medium">{campo.label}</label>
                    <textarea
                      name={campo.name}
                      value={guia[campo.name]}
                      onChange={handleChange}
                      rows="3"
                      className="w-full border border-gray-300 p-2 rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium">Fecha de Diseño</label>
              <input type="date" name="FechaDiseno" value={guia.FechaDiseno} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Fecha de Validación</label>
              <input type="date" name="FechaValidacion" value={guia.FechaValidacion} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
            </div>
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

export default GuiaForm;
