import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getData, postData, putData } from '../services/apiService';
import Layout from './Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';


const MySwal = withReactContent(Swal);

const TecnicoForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [tecnico, setTecnico] = useState({
        Nombres: ''
    });

    useEffect(() => {
        if (id) {
            cargarTecnico(id);
        }
    }, [id]);

    const cargarTecnico = async (tecnicoId) => {
        try {
            const response = await getData(`tecnicos/${tecnicoId}`, true);
            setTecnico({
                Nombres: response.Nombres || ''
            });
        } catch (error) {
            console.error('❌ Error al cargar el técnico:', error);
            MySwal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar el técnico.',
                confirmButtonColor: '#FF5733', 
                confirmButtonText: 'Entendido'
            });
        }
    };

    const handleChange = (e) => {
        setTecnico({ ...tecnico, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!tecnico.Nombres.trim()) {
            MySwal.fire({
                icon: 'warning',
                title: 'Campo Obligatorio',
                text: 'El campo "Nombres" es obligatorio.',
                confirmButtonColor: '#FFA500', // Naranja
                confirmButtonText: 'Entendido'
            });
            return;
        }

        let datosEnviar = {
            Nombres: tecnico.Nombres.trim()
        };

        try {
            let response;
            if (id) {
                response = await putData(`tecnicos/${id}`, datosEnviar, true);
            } else {
                response = await postData('tecnicos', datosEnviar, true);
            }
        
            MySwal.fire({
                icon: 'success',
                title: 'Éxito',
                text: response.message,
                confirmButtonColor: '#4CAF50', // Verde
            });
        
            setTimeout(() => {
                navigate('/tecnicos');
            }, 2000);
        } catch (error) {
            console.error('❌ Error al guardar el técnico:', error);
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
                <h2 className="text-xl font-bold">{id ? 'Editar Técnico' : 'Registro de Técnico'}</h2>
                <button 
                    onClick={() => navigate('/tecnicos')} 
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
                    value={tecnico.Nombres}
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

export default TecnicoForm;