import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getData, postData, putData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons'
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const ReservaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [reserva, setReserva] = useState({
    Fecha: new Date().toISOString().split('T')[0],
    HoraInicio: new Date().toTimeString().substring(0, 5),
    HoraFin: new Date().toTimeString().substring(0, 5),
    Jornada: 'AM',
    EscenarioID: '',
    TipoPracticaID: '',
    Carrera: '',
    Asignatura: '',
    Tema: '',
    Docente: '',
    NumEstudiantes: '',
    RecursoPrincipal: '',
    TecnicoID: ''
  });

  const [salas, setSalas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);

  useEffect(() => {
    cargarListas();
    if (id) cargarReserva(id);
  }, [id]);

  const cargarListas = async () => {
    const salasData = await getData('salas', true);
    const tiposData = await getData('tipopracticas', true);
    const tecnicosData = await getData('tecnicos', true);
    setSalas(salasData || []);
    setTipos(tiposData || []);
    setTecnicos(tecnicosData || []);
  };

  const cargarReserva = async (id) => {
    const data = await getData(`reservas/${id}`, true);
    if (data) setReserva(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...reserva, [name]: value };
    if (name === 'HoraInicio' || name === 'HoraFin') {
      const [hora] = value.split(':');
      updated.Jornada = hora < 12 ? 'AM' : 'PM';
      if (name === 'HoraInicio' && value > reserva.HoraFin) {
        updated.HoraFin = value;
      }
    }
    setReserva(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const camposObligatorios = {
      Fecha: 'la fecha',
      HoraInicio: 'la hora de inicio',
      HoraFin: 'la hora de fin',
      EscenarioID: 'el escenario',
      TipoPracticaID: 'el tipo de práctica',
      Carrera: 'la carrera',
      Asignatura: 'la asignatura',
      Docente: 'el docente',
      NumEstudiantes: 'el número de estudiantes',
      TecnicoID: 'el técnico'
    };

    for (let campo in camposObligatorios) {
      if (!reserva[campo] || reserva[campo].toString().trim() === '') {
        MySwal.fire({
          icon: 'warning',
          title: 'Campo obligatorio',
          text: `Por favor ingresa ${camposObligatorios[campo]}.`,
          confirmButtonColor: '#FFA500'
        });
        return;
      }
    }

    try {
      if (id) {
        await putData(`reservas/${id}`, reserva, true);
        MySwal.fire({ icon: 'success', title: 'Actualizado', text: 'Reserva actualizada correctamente' });
      } else {
        await postData('reservas', reserva, true);
        MySwal.fire({ icon: 'success', title: 'Registrado', text: 'Reserva registrada correctamente' });
      }
      navigate('/reservas');
    } catch (error) {
      MySwal.fire({ icon: 'error', title: 'Error', text: 'Hubo un problema al guardar la reserva' });
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg p-6 border relative">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white text-center py-3 rounded-t-lg relative">
          <h2 className="text-xl font-bold text-center mb-4">
            {id ? 'Editar Reserva' : 'Registrar Nueva Reserva'}
          </h2>
          <button
            onClick={() => navigate('/reservas')}
            className="absolute top-3 right-3 text-white hover:text-gray-300"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Fila 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fecha */}
            <div>
              <label>Fecha</label>
              <input type="date" name="Fecha" value={reserva.Fecha} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
            </div>
            {/* Hora de Inicio */}
            <div>
              <label>Hora de Inicio</label>
              <input type="time" name="HoraInicio" value={reserva.HoraInicio} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
            </div>
            {/* Hora de Fin */}
            <div>
              <label>Hora de Fin</label>
              <input type="time" name="HoraFin" value={reserva.HoraFin} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
            </div>
          </div>

          {/* Fila 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Jornada */}
            <div>
              <label>Jornada</label>
              <input type="text" name="Jornada" value={reserva.Jornada} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
            </div>
            {/* Escenario */}
            <div>
              <label>Escenario</label>
              <select name="EscenarioID" value={reserva.EscenarioID} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded">
                <option value="">Seleccione...</option>
                {salas.map(s => <option key={s.ID} value={s.ID}>{s.Nombre}</option>)}
              </select>
            </div>
            {/* Tipo de práctica */}
            <div>
              <label>Tipo de Práctica</label>
              <select name="TipoPracticaID" value={reserva.TipoPracticaID} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded">
                <option value="">Seleccione...</option>
                {tipos.map(t => <option key={t.ID} value={t.ID}>{t.Nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Fila 3: Carrera */}
          <div>
            <label>Carrera</label>
            <input type="text" name="Carrera" value={reserva.Carrera} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
          </div>

          {/* Fila 4: Asignatura */}
          <div>
            <label>Asignatura</label>
            <input type="text" name="Asignatura" value={reserva.Asignatura} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
          </div>

          {/* Fila 5: Tema */}
          <div>
            <label>Tema</label>
            <input type="text" name="Tema" value={reserva.Tema} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
          </div>

          {/* Fila 6: Docente */}
          <div>
            <label>Docente</label>
            <input type="text" name="Docente" value={reserva.Docente} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
          </div>

          {/* Fila 7: Número de Estudiantes (30%) + Recurso Principal (70%) */}
          <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
            <div className="md:col-span-3">
              <label>Número de Estudiantes</label>
              <input type="number" name="NumEstudiantes" value={reserva.NumEstudiantes} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
            </div>
            <div className="md:col-span-7">
              <label>Recurso Principal</label>
              <input type="text" name="RecursoPrincipal" value={reserva.RecursoPrincipal} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
            </div>
          </div>

          {/* Fila 8: Técnico */}
          <div>
            <label>Técnico</label>
            <select name="TecnicoID" value={reserva.TecnicoID} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded">
              <option value="">Seleccione Técnico</option>
              {tecnicos
                .filter(t => t.Estado === 1)
                .map(t => (
                  <option key={t.ID} value={t.ID}>{t.Nombres}</option>
                ))}
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

export default ReservaForm;
