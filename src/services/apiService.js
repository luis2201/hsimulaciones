import config from '../config';

const API_URL = config.API_URL;

// Función para obtener el token almacenado
const getToken = () => localStorage.getItem('token');

const getErrorMessage = (data, fallback) => {
  if (!data) return fallback;

  if (Array.isArray(data.errors)) {
    return data.errors
      .map(error => {
        const field = error.path || error.param;
        return field ? `${field}: ${error.msg}` : error.msg;
      })
      .filter(Boolean)
      .join('\n') || fallback;
  }

  return data.error || data.message || fallback;
};

const throwApiError = async (response) => {
  let data = null;
  let rawText = '';

  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      rawText = await response.text();
    }
  } catch (parseError) {
    console.error('Error al leer la respuesta de error:', parseError);
  }

  const fallback = `Error ${response.status}: ${response.statusText}`;
  const message = getErrorMessage(data, rawText || fallback);
  const error = new Error(message);
  error.status = response.status;
  error.statusText = response.statusText;
  error.data = data || rawText;

  throw error;
};

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
      await throwApiError(response);
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
      await throwApiError(response);
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

export const postFormData = async (endpoint, formData, auth = false) => {
  const options = {
    method: 'POST',
    headers: {}
  };

  if (auth) {
    const token = getToken();
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  options.body = formData;

  const response = await fetch(`${API_URL}/${endpoint}`, options);

  if (!response.ok) {
    await throwApiError(response);
  }

  return await response.json();
};

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
