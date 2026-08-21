import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getData, putData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const AsistenciaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [solicitud, setSolicitud] = useState(null);
  const [asistencias, setAsistencias] = useState([]);

  useEffect(() => {
    cargarDatos(id);
  }, [id]);

  const cargarDatos = async (solicitudId) => {
    try {
      const solicitudData = await getData(`solicitudes/${solicitudId}`, true);
      if (!solicitudData) {
        navigate('/asistencias');
        return;
      }

      const asistenciaData = await getData(`solicitudes/${solicitudId}/asistencia`, true);
      setSolicitud(solicitudData);
      setAsistencias(asistenciaData || []);
    } catch (error) {
      console.error('Error al cargar la asistencia:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la asistencia.', confirmButtonColor: '#FF5733' });
    }
  };

  const handleAsistenciaChange = (index, field, value) => {
    setAsistencias(prev => prev.map((item, idx) => (
      idx === index ? { ...item, [field]: value } : item
    )));
  };

  const marcarTodos = (estado) => {
    setAsistencias(prev => prev.map(item => ({ ...item, Asistencia: estado })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (asistencias.length === 0) {
      MySwal.fire({ icon: 'warning', title: 'Sin estudiantes', text: 'No hay estudiantes registrados para esta solicitud.', confirmButtonColor: '#FFA500' });
      return;
    }

    const payload = {
      asistencias: asistencias.map(item => ({
        ID: item.ID,
        Asistencia: item.Asistencia || 'PENDIENTE',
        Observacion: item.Observacion || ''
      }))
    };

    try {
      const response = await putData(`solicitudes/${id}/asistencia`, payload, true);
      MySwal.fire({ icon: 'success', title: 'Éxito', text: response.message, confirmButtonColor: '#4CAF50' });

      setTimeout(() => {
        navigate('/asistencias');
      }, 1500);
    } catch (error) {
      console.error('Error al guardar la asistencia:', error);
      MySwal.fire({ icon: 'error', title: 'Error', text: 'Hubo un problema al guardar la asistencia.', confirmButtonColor: '#FF5733' });
    }
  };

  const totalPresentes = asistencias.filter(item => item.Asistencia === 'PRESENTE').length;
  const totalFaltas = asistencias.filter(item => item.Asistencia === 'FALTA').length;
  const totalPendientes = asistencias.filter(item => !item.Asistencia || item.Asistencia === 'PENDIENTE').length;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 border relative">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white text-center py-3 rounded-t-lg relative">
          <h2 className="text-xl font-bold">Registro de Asistencia</h2>
          <button onClick={() => navigate('/asistencias')} className="absolute top-3 right-3 text-white hover:text-gray-300">
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        {solicitud && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-gray-700 font-medium">Guía</label>
              <input type="text" value={solicitud.CodigoGuia || ''} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium">Tema</label>
              <input type="text" value={solicitud.Tema || ''} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Fecha</label>
              <input type="text" value={String(solicitud.Fecha || '').slice(0, 10)} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Horario</label>
              <input type="text" value={`${solicitud.HoraInicio || ''} - ${solicitud.HoraFin || ''}`} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Sala</label>
              <input type="text" value={solicitud.Sala || ''} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Presentes</label>
              <input type="text" value={totalPresentes} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Faltas / Pendientes</label>
              <input type="text" value={`${totalFaltas} / ${totalPendientes}`} readOnly className="w-full border border-gray-300 p-2 rounded bg-gray-100" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => marcarTodos('PRESENTE')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
              Marcar Presentes
            </button>
            <button type="button" onClick={() => marcarTodos('FALTA')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
              Marcar Faltas
            </button>
            <button type="button" onClick={() => marcarTodos('PENDIENTE')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">
              Reiniciar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
                  <th className="p-3 text-left">Estudiante</th>
                  <th className="p-3 text-center">Asistencia</th>
                  <th className="p-3 text-left">Observación</th>
                </tr>
              </thead>
              <tbody>
                {asistencias.length > 0 ? (
                  asistencias.map((item, index) => (
                    <tr key={item.ID} className="border-b">
                      <td className="p-3">{item.ApellidosNombres}</td>
                      <td className="p-3">
                        <select
                          value={item.Asistencia || 'PENDIENTE'}
                          onChange={(e) => handleAsistenciaChange(index, 'Asistencia', e.target.value)}
                          className="w-full border border-gray-300 p-2 rounded"
                        >
                          <option value="PENDIENTE">PENDIENTE</option>
                          <option value="PRESENTE">PRESENTE</option>
                          <option value="FALTA">FALTA</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={item.Observacion || ''}
                          onChange={(e) => handleAsistenciaChange(index, 'Observacion', e.target.value)}
                          className="w-full border border-gray-300 p-2 rounded"
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-4 text-center text-gray-500">No hay estudiantes registrados para esta solicitud.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-6">
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg transition flex items-center justify-center space-x-2 w-full">
              <FontAwesomeIcon icon={faSave} />
              <span>Guardar Asistencia</span>
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AsistenciaForm;
