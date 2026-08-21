import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getData, postData, putData, deleteData, postFormData } from '../services/apiService';
import config from '../config';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const fechaInput = (value) => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

const nuevaFilaEstudiante = () => ({
  ApellidosNombres: ''
});

const completarFilasEstudiantes = (estudiantes, cantidad) => {
  if (cantidad <= estudiantes.length) {
    return estudiantes.slice(0, cantidad);
  }

  return [
    ...estudiantes,
    ...Array.from({ length: cantidad - estudiantes.length }, nuevaFilaEstudiante)
  ];
};

const API_BASE_URL = config.API_URL.replace(/\/api\/?$/, '');

const normalizarFotos = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.fotos)) return data.fotos;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const obtenerSolicitudId = (response) => (
  response?.ID ||
  response?.id ||
  response?.SolicitudID ||
  response?.solicitudId ||
  response?.solicitud?.ID ||
  response?.solicitud?.id
);

const SolicitudForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [salas, setSalas] = useState([]);
  const [tiposPractica, setTiposPractica] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [estudiantesEliminados, setEstudiantesEliminados] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [fotosExistentes, setFotosExistentes] = useState([]);
  const [guiaInfo, setGuiaInfo] = useState({
    Codigo: '',
    Tema: '',
    Materia: '',
    Docente: ''
  });
  const [solicitud, setSolicitud] = useState({
    GuiaID: '',
    CodigoGuia: '',
    Fecha: new Date().toISOString().split('T')[0],
    HoraInicio: new Date().toTimeString().substring(0, 5),
    HoraFin: new Date().toTimeString().substring(0, 5),
    Jornada: 'AM',
    NumEstudiantes: 0,
    SalaID: '',
    TipoPracticaID: '',
    RecursoID: '',
    TecnicoID: '',
    SalaDebriefing: 'NINGUNA',
    ErroresProcedimiento: '',
    DificultadesHallazgos: '',
    EstadoSolicitud: 'PENDIENTE'
  });

  useEffect(() => {
    cargarListas();
    if (id) cargarSolicitud(id);
  }, [id]);

  const cargarListas = async () => {
    const [salasData, tiposData, recursosData, tecnicosData] = await Promise.all([
      getData('salas', true),
      getData('tipopracticas', true),
      getData('recursos', true),
      getData('tecnicos', true)
    ]);

    setSalas(salasData || []);
    setTiposPractica(tiposData || []);
    setRecursos(recursosData || []);
    setTecnicos(tecnicosData || []);
  };

  const cargarSolicitud = async (solicitudId) => {
    try {
      const data = await getData(`solicitudes/${solicitudId}`, true);
      if (!data) {
        navigate('/solicitudes');
        return;
      }

      setSolicitud({
        GuiaID: data.GuiaID || '',
        CodigoGuia: data.CodigoGuia || '',
        Fecha: fechaInput(data.Fecha),
        HoraInicio: data.HoraInicio || '',
        HoraFin: data.HoraFin || '',
        Jornada: data.Jornada || 'AM',
        NumEstudiantes: Number(data.NumEstudiantes || 0),
        SalaID: data.SalaID || '',
        TipoPracticaID: data.TipoPracticaID || '',
        RecursoID: data.RecursoID || '',
        TecnicoID: data.TecnicoID || '',
        SalaDebriefing: data.SalaDebriefing || 'NINGUNA',
        ErroresProcedimiento: data.ErroresProcedimiento || '',
        DificultadesHallazgos: data.DificultadesHallazgos || '',
        EstadoSolicitud: data.EstadoSolicitud || 'PENDIENTE'
      });

      setGuiaInfo({
        Codigo: data.CodigoGuia || '',
        Tema: data.Tema || '',
        Materia: data.Materia || '',
        Docente: data.Docente || ''
      });

      const estudiantesData = await getData(`solicitudes/${solicitudId}/estudiantes`, true);
      setEstudiantes(completarFilasEstudiantes(estudiantesData || [], Number(data.NumEstudiantes || 0)));

      const fotosData = await getData(`solicitudes/${solicitudId}/fotos`, true);
      setFotosExistentes(normalizarFotos(fotosData));
    } catch (error) {
      console.error('Error al cargar la solicitud:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la solicitud.', confirmButtonColor: '#FF5733' });
    }
  };

  const calcularJornada = (hora) => {
    if (!hora) return 'AM';
    const [hh] = hora.split(':');
    return Number(hh) < 12 ? 'AM' : 'PM';
  };

  const handleSolicitudChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...solicitud, [name]: value };

    if (name === 'HoraInicio') {
      updated.Jornada = calcularJornada(value);
      if (value && updated.HoraFin && value >= updated.HoraFin) {
        updated.HoraFin = value;
      }
    }

    if (name === 'CodigoGuia') {
      updated.GuiaID = '';
      setGuiaInfo({ Codigo: value, Tema: '', Materia: '', Docente: '' });
    }

    if (name === 'NumEstudiantes') {
      const cantidad = Math.max(Number(value || 0), 0);
      updated.NumEstudiantes = cantidad;
      ajustarFilasEstudiantes(cantidad);
    }

    if (name === 'SalaID') {
      updated.RecursoID = '';
    }

    setSolicitud(updated);
  };

  const ajustarFilasEstudiantes = (cantidad) => {
    setEstudiantes(prev => {
      if (cantidad > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: cantidad - prev.length }, nuevaFilaEstudiante)
        ];
      }

      if (cantidad < prev.length) {
        const removidos = prev.slice(cantidad).filter(estudiante => estudiante.ID);
        if (removidos.length > 0) {
          setEstudiantesEliminados(actuales => [...actuales, ...removidos.map(estudiante => estudiante.ID)]);
        }
        return prev.slice(0, cantidad);
      }

      return prev;
    });
  };

  const buscarGuiaPorCodigo = async () => {
    const codigo = solicitud.CodigoGuia.trim();

    if (!codigo) {
      setSolicitud(prev => ({ ...prev, GuiaID: '' }));
      setGuiaInfo({ Codigo: '', Tema: '', Materia: '', Docente: '' });
      return;
    }

    try {
      const guia = await getData(`guias/codigo/${encodeURIComponent(codigo)}`, true);

      if (!guia || !guia.ID) {
        setSolicitud(prev => ({ ...prev, GuiaID: '' }));
        setGuiaInfo({ Codigo: codigo, Tema: '', Materia: '', Docente: '' });
        MySwal.fire({ icon: 'warning', title: 'Guía no encontrada', text: 'No se encontró una guía con ese código.', confirmButtonColor: '#FFA500' });
        return;
      }

      setSolicitud(prev => ({
        ...prev,
        GuiaID: guia.ID,
        CodigoGuia: guia.Codigo || codigo
      }));
      setGuiaInfo({
        Codigo: guia.Codigo || codigo,
        Tema: guia.Tema || '',
        Materia: guia.Materia || '',
        Docente: guia.Docente || ''
      });
    } catch (error) {
      console.error('Error al buscar la guía:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'No se pudo buscar la guía.', confirmButtonColor: '#FF5733' });
    }
  };

  const handleEstudianteChange = (index, field, value) => {
    setEstudiantes(prev => prev.map((estudiante, idx) => (
      idx === index ? { ...estudiante, [field]: value } : estudiante
    )));
  };

  const agregarEstudiante = () => {
    const cantidad = Number(solicitud.NumEstudiantes || 0) + 1;
    setSolicitud(prev => ({ ...prev, NumEstudiantes: cantidad }));
    setEstudiantes(prev => [...prev, nuevaFilaEstudiante()]);
  };

  const quitarEstudiante = (index) => {
    const estudiante = estudiantes[index];
    if (estudiante?.ID) {
      setEstudiantesEliminados(prev => [...prev, estudiante.ID]);
    }

    const cantidad = Math.max(Number(solicitud.NumEstudiantes || 0) - 1, 0);
    setSolicitud(prev => ({ ...prev, NumEstudiantes: cantidad }));
    setEstudiantes(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleFotosChange = (e) => {
    const archivos = Array.from(e.target.files || []);
    const nuevasFotos = archivos.map(file => ({
      file,
      descripcion: ''
    }));

    setFotos(prev => [...prev, ...nuevasFotos].slice(0, 10));
    e.target.value = '';
  };

  const handleFotoDescripcionChange = (index, value) => {
    setFotos(prev => prev.map((foto, idx) => (
      idx === index ? { ...foto, descripcion: value } : foto
    )));
  };

  const quitarFoto = (index) => {
    setFotos(prev => prev.filter((_, idx) => idx !== index));
  };

  const eliminarFotoExistente = async (fotoId) => {
    if (!id) return;

    const confirmacion = await MySwal.fire({
      title: '¿Eliminar foto?',
      text: 'La foto será eliminada de la solicitud.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await deleteData(`solicitudes/${id}/fotos/${fotoId}`, true);
      setFotosExistentes(prev => prev.filter(foto => foto.ID !== fotoId));
      MySwal.fire({ icon: 'success', title: 'Éxito', text: response.message, confirmButtonColor: '#4CAF50' });
    } catch (error) {
      console.error('Error al eliminar la foto:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar la foto.', confirmButtonColor: '#FF5733' });
    }
  };

  const getFotoUrl = (ruta) => {
    if (!ruta) return '';
    if (/^https?:\/\//.test(ruta)) return ruta;
    return `${API_BASE_URL}${ruta}`;
  };

  const validar = () => {
    if (!solicitud.GuiaID) {
      MySwal.fire({ icon: 'warning', title: 'Campo obligatorio', text: 'Busca y selecciona una guía válida.', confirmButtonColor: '#FFA500' });
      return false;
    }

    const obligatorios = {
      Fecha: 'la fecha',
      HoraInicio: 'la hora de inicio',
      HoraFin: 'la hora de fin',
      SalaID: 'la sala',
      TipoPracticaID: 'el tipo de práctica'
    };

    for (let campo in obligatorios) {
      if (!solicitud[campo]) {
        MySwal.fire({ icon: 'warning', title: 'Campo obligatorio', text: `Ingresa ${obligatorios[campo]}.`, confirmButtonColor: '#FFA500' });
        return false;
      }
    }

    if (solicitud.HoraFin <= solicitud.HoraInicio) {
      MySwal.fire({ icon: 'warning', title: 'Horario inválido', text: 'La hora de fin debe ser mayor que la hora de inicio.', confirmButtonColor: '#FFA500' });
      return false;
    }

    if (Number(solicitud.NumEstudiantes) !== estudiantes.length) {
      MySwal.fire({ icon: 'warning', title: 'Estudiantes incompletos', text: 'El número de estudiantes debe coincidir con el listado.', confirmButtonColor: '#FFA500' });
      return false;
    }

    const estudianteIncompleto = estudiantes.some(estudiante => !String(estudiante.ApellidosNombres || '').trim());
    if (estudianteIncompleto) {
      MySwal.fire({ icon: 'warning', title: 'Estudiantes incompletos', text: 'Ingresa apellidos y nombres de todos los estudiantes.', confirmButtonColor: '#FFA500' });
      return false;
    }

    return true;
  };

  const buildPayload = () => ({
    GuiaID: Number(solicitud.GuiaID),
    Fecha: solicitud.Fecha,
    HoraInicio: solicitud.HoraInicio,
    HoraFin: solicitud.HoraFin,
    Jornada: solicitud.Jornada,
    NumEstudiantes: Number(solicitud.NumEstudiantes || 0),
    SalaID: Number(solicitud.SalaID),
    TipoPracticaID: Number(solicitud.TipoPracticaID),
    RecursoID: solicitud.RecursoID ? Number(solicitud.RecursoID) : '',
    TecnicoID: solicitud.TecnicoID ? Number(solicitud.TecnicoID) : '',
    SalaDebriefing: solicitud.SalaDebriefing,
    ErroresProcedimiento: solicitud.ErroresProcedimiento,
    DificultadesHallazgos: solicitud.DificultadesHallazgos
  });

  const guardarEstudiantes = async (solicitudId) => {
    for (const estudianteId of estudiantesEliminados) {
      await deleteData(`solicitudes/${solicitudId}/estudiantes/${estudianteId}`, true);
    }

    const existentes = estudiantes
      .filter(estudiante => estudiante.ID)
      .map(estudiante => ({
        ID: estudiante.ID,
        ApellidosNombres: estudiante.ApellidosNombres.trim()
      }));

    const nuevos = estudiantes
      .filter(estudiante => !estudiante.ID)
      .map(estudiante => ({
        ApellidosNombres: estudiante.ApellidosNombres.trim(),
        Observacion: estudiante.Observacion || ''
      }));

    if (existentes.length > 0) {
      await putData(`solicitudes/${solicitudId}/estudiantes`, { estudiantes: existentes }, true);
    }

    if (nuevos.length > 0) {
      await postData(`solicitudes/${solicitudId}/estudiantes`, { estudiantes: nuevos }, true);
    }
  };

  const subirFotos = async (solicitudId) => {
    if (fotos.length === 0) return;

    const formData = new FormData();
    fotos.forEach((foto) => {
      formData.append('fotos', foto.file);
      formData.append('Descripciones', foto.descripcion || '');
    });

    const response = await postFormData(`solicitudes/${solicitudId}/fotos`, formData, true);
    const fotosSubidas = normalizarFotos(response);

    if (fotosSubidas.length > 0) {
      setFotosExistentes(prev => [...prev, ...fotosSubidas]);
    }

    setFotos([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    try {
      const response = id
        ? await putData(`solicitudes/${id}`, buildPayload(), true)
        : await postData('solicitudes', buildPayload(), true);

      const solicitudId = id || obtenerSolicitudId(response);
      if (!solicitudId) {
        throw new Error('No se pudo identificar la solicitud creada para subir las fotos.');
      }

      await guardarEstudiantes(solicitudId);
      await subirFotos(solicitudId);

      MySwal.fire({ icon: 'success', title: 'Éxito', text: response.message, confirmButtonColor: '#4CAF50' });

      setTimeout(() => {
        navigate('/solicitudes');
      }, 1500);
    } catch (error) {
      console.error('Error al guardar la solicitud:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: error.message || 'Hubo un problema al guardar los datos.', confirmButtonColor: '#FF5733' });
    }
  };

  const recursosFiltrados = recursos.filter(recurso =>
    (!solicitud.SalaID || String(recurso.SalaID) === String(solicitud.SalaID)) &&
    (recurso.Estado === 1 || String(recurso.ID) === String(solicitud.RecursoID))
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 border relative">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white text-center py-3 rounded-t-lg relative">
          <h2 className="text-xl font-bold">{id ? 'Editar Solicitud' : 'Registro de Solicitud'}</h2>
          <button onClick={() => navigate('/solicitudes')} className="absolute top-3 right-3 text-white hover:text-gray-300">
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-gray-700 font-medium">Código de Guía</label>
              <input
                type="text"
                name="CodigoGuia"
                value={solicitud.CodigoGuia}
                onChange={handleSolicitudChange}
                onBlur={buscarGuiaPorCodigo}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarGuiaPorCodigo();
                  }
                }}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-gray-700 font-medium">Tema</label>
              <input type="text" value={guiaInfo.Tema} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium">Materia</label>
              <input type="text" value={guiaInfo.Materia} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium">Docente</label>
              <input type="text" value={guiaInfo.Docente} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-700 font-medium">Fecha</label>
              <input type="date" name="Fecha" value={solicitud.Fecha} onChange={handleSolicitudChange} className="w-full border border-gray-300 p-2 rounded" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Hora de Inicio</label>
              <input type="time" name="HoraInicio" value={solicitud.HoraInicio} onChange={handleSolicitudChange} className="w-full border border-gray-300 p-2 rounded" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Hora de Fin</label>
              <input type="time" name="HoraFin" value={solicitud.HoraFin} onChange={handleSolicitudChange} className="w-full border border-gray-300 p-2 rounded" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Jornada</label>
              <input type="text" value={solicitud.Jornada} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 font-medium">Sala</label>
              <select name="SalaID" value={solicitud.SalaID} onChange={handleSolicitudChange} className="w-full border border-gray-300 p-2 rounded">
                <option value="">Seleccione...</option>
                {salas
                  .filter(sala => sala.Estado === 1 || String(sala.ID) === String(solicitud.SalaID))
                  .map(sala => <option key={sala.ID} value={sala.ID}>{sala.Nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium">Tipo de Práctica</label>
              <select name="TipoPracticaID" value={solicitud.TipoPracticaID} onChange={handleSolicitudChange} className="w-full border border-gray-300 p-2 rounded">
                <option value="">Seleccione...</option>
                {tiposPractica
                  .filter(tipo => tipo.Estado === 1 || String(tipo.ID) === String(solicitud.TipoPracticaID))
                  .map(tipo => <option key={tipo.ID} value={tipo.ID}>{tipo.Nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium">Sala Debriefing</label>
              <select name="SalaDebriefing" value={solicitud.SalaDebriefing} onChange={handleSolicitudChange} className="w-full border border-gray-300 p-2 rounded">
                <option value="NINGUNA">NINGUNA</option>
                <option value="SALA 1">SALA 1</option>
                <option value="SALA 2">SALA 2</option>
                <option value="SALA 3">SALA 3</option>
                <option value="SALA 4">SALA 4</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium">Recurso</label>
              <select name="RecursoID" value={solicitud.RecursoID} onChange={handleSolicitudChange} className="w-full border border-gray-300 p-2 rounded">
                <option value="">Sin recurso</option>
                {recursosFiltrados.map(recurso => <option key={recurso.ID} value={recurso.ID}>{recurso.Nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium">Técnico</label>
              <select name="TecnicoID" value={solicitud.TecnicoID} onChange={handleSolicitudChange} className="w-full border border-gray-300 p-2 rounded">
                <option value="">Sin técnico</option>
                {tecnicos
                  .filter(tecnico => tecnico.Estado === 1 || String(tecnico.ID) === String(solicitud.TecnicoID))
                  .map(tecnico => <option key={tecnico.ID} value={tecnico.ID}>{tecnico.Nombres}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium">Errores de Procedimiento</label>
              <textarea name="ErroresProcedimiento" value={solicitud.ErroresProcedimiento} onChange={handleSolicitudChange} rows="3" className="w-full border border-gray-300 p-2 rounded" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Dificultades / Hallazgos</label>
              <textarea name="DificultadesHallazgos" value={solicitud.DificultadesHallazgos} onChange={handleSolicitudChange} rows="3" className="w-full border border-gray-300 p-2 rounded" />
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Estudiantes</h3>
                <p className="text-sm text-gray-600">El número de estudiantes define la cantidad de filas a registrar.</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-gray-700 font-medium">Número</label>
                <input type="number" min="0" name="NumEstudiantes" value={solicitud.NumEstudiantes} onChange={handleSolicitudChange} className="w-24 border border-gray-300 p-2 rounded" />
                <button type="button" onClick={agregarEstudiante} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded">
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {estudiantes.length > 0 ? (
                estudiantes.map((estudiante, index) => (
                  <div key={estudiante.ID || index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-11">
                      <label className="block text-gray-700 font-medium">Apellidos y Nombres</label>
                      <input
                        type="text"
                        value={estudiante.ApellidosNombres || ''}
                        onChange={(e) => handleEstudianteChange(index, 'ApellidosNombres', e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <button type="button" onClick={() => quitarEstudiante(index)} className="w-full text-red-500 hover:text-red-700 border border-red-200 rounded p-2">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">No hay estudiantes registrados.</div>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Fotos de la Solicitud</h3>
                <p className="text-sm text-gray-600">Puedes adjuntar hasta 10 imágenes JPG, PNG o WEBP.</p>
              </div>
              <label className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">
                Seleccionar Fotos
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFotosChange}
                  className="hidden"
                />
              </label>
            </div>

            {fotos.length > 0 ? (
              <div className="space-y-3">
                {fotos.map((foto, index) => (
                  <div key={`${foto.file.name}-${index}`} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-4">
                      <label className="block text-gray-700 font-medium">Archivo</label>
                      <input type="text" value={foto.file.name} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
                    </div>
                    <div className="md:col-span-7">
                      <label className="block text-gray-700 font-medium">Descripción</label>
                      <input
                        type="text"
                        value={foto.descripcion}
                        onChange={(e) => handleFotoDescripcionChange(index, e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <button type="button" onClick={() => quitarFoto(index)} className="w-full text-red-500 hover:text-red-700 border border-red-200 rounded p-2">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">No hay fotos seleccionadas.</div>
            )}

            {id && (
              <div className="space-y-3">
                <h4 className="text-gray-800 font-semibold">Fotos Registradas</h4>
                {fotosExistentes.length > 0 ? (
                  fotosExistentes.map((foto) => (
                    <div key={foto.ID} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-2">
                        <a href={getFotoUrl(foto.Ruta)} target="_blank" rel="noreferrer">
                          <img src={getFotoUrl(foto.Ruta)} alt={foto.NombreOriginal} className="h-20 w-full object-cover rounded border" />
                        </a>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-gray-700 font-medium">Archivo</label>
                        <input type="text" value={foto.NombreOriginal || foto.Archivo || ''} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
                      </div>
                      <div className="md:col-span-6">
                        <label className="block text-gray-700 font-medium">Descripción</label>
                        <input type="text" value={foto.Descripcion || ''} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
                      </div>
                      <div className="md:col-span-1">
                        <button type="button" onClick={() => eliminarFotoExistente(foto.ID)} className="w-full text-red-500 hover:text-red-700 border border-red-200 rounded p-2">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">No hay fotos registradas.</div>
                )}
              </div>
            )}
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

export default SolicitudForm;
