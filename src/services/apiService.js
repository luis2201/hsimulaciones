import config from '../config';

const API_URL = config.API_URL;

// Función para obtener el token almacenado
const getToken = () => localStorage.getItem('token');

// Función genérica para realizar peticiones a la API
const request = async (endpoint, method = 'GET', data = null, auth = false, headers = {}) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (auth) {
      const token = getToken();
      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}/${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {    
    throw error;
  }
};

// Métodos para consumir la API
// export const getData = (endpoint, auth = false) => request(endpoint, 'GET', null, auth);
export const getData = async (endpoint, auth = false) => {
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  if (auth) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("❌ No hay token en localStorage");
      return null;
    }
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}/${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error en la solicitud a la API:', error);
    return null;
  }
};
export const postData = (endpoint, data, auth = false) => request(endpoint, 'POST', data, auth);
export const putData = (endpoint, data, auth = false) => request(endpoint, 'PUT', data, auth);
export const deleteData = (endpoint, auth = false) => request(endpoint, 'DELETE', null, auth);

export const login = async (credentials) => {
  try {
      const response = await postData('auth/login', credentials);
      if (response.token && response.Nombres && response.Rol) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('userData', JSON.stringify({ Nombres: response.Nombres, Rol: response.Rol }));
      }
      return response;
  } catch (error) {      
      throw error;
  }
};  

// Obtener datos del usuario almacenados
export const getUserData = () => JSON.parse(localStorage.getItem('userData')) || { Nombres: 'Usuario', Rol: 'Invitado' };

// Función para cerrar sesión
export const logout = () => {
  localStorage.removeItem('token');
};

// Función para verificar si el usuario está autenticado
export const isAuthenticated = () => !!getToken();
