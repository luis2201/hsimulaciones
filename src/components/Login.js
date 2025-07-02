import React, { useState } from 'react';
import { login } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faSpinner } from '@fortawesome/free-solid-svg-icons';

const Login = () => {
  const [credentials, setCredentials] = useState({ Usuario: '', Password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true); // Iniciar la animación de carga

    if (!credentials.Usuario.trim() || !credentials.Password.trim()) {
      setError('Usuario y Contraseña son obligatorios.');
      setLoading(false);
      return;
    }

    try {
      await login(credentials);
      setTimeout(() => {
        setLoading(false);
        navigate('/dashboard');
      }, 1000); // Simulamos un pequeño delay antes de la redirección
    } catch (err) {
      setLoading(false);
      setError('Credenciales incorrectas o problema en el servidor.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-600">
      <div className="w-full max-w-md bg-white bg-opacity-10 backdrop-blur-lg shadow-xl rounded-lg p-8">
        {/* Logo */}
        <div className="flex justify-center">
          <img src="/logo_itsup.png" alt="Logo" className="w-36 h-36" />
        </div>

        {/* Mensajes de información */}
        <div className="mt-4 p-3 bg-gray-100 bg-opacity-20 text-sm text-gray-200 rounded">
          <p>🌐 Sistema de Gestión para el Hospital de Simulaciones</p>
          <p>🔐 Ingrese sus credenciales</p>          
        </div>

        {/* Formulario */}
        {error && <p className="text-red-400 text-sm text-center mt-3">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="relative">
            <FontAwesomeIcon icon={faUser} className="absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              name="Usuario" 
              placeholder="Nombre de usuario" 
              className="w-full px-10 py-2 bg-white bg-opacity-20 text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-300" 
              onChange={handleChange} 
              disabled={loading}
            />
          </div>
          <div className="relative">
            <FontAwesomeIcon icon={faLock} className="absolute left-3 top-3 text-gray-400" />
            <input 
              type="password" 
              name="Password" 
              placeholder="Contraseña" 
              className="w-full px-10 py-2 bg-white bg-opacity-20 text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-300" 
              onChange={handleChange} 
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition duration-300 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                Cargando...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        {/* Información adicional */}
        <p className="text-center text-gray-300 text-xs mt-4">
          🔒 Privacidad de sus credenciales: no serán almacenadas, solo se utilizarán para esta sesión.
        </p>
      </div>
    </div>
  );
};

export default Login;
