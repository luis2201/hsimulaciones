import React from 'react';
import { getUserData } from '../services/apiService';
import Solicitudes from './Solicitudes';
import SolicitudesGestion from './SolicitudesGestion';

const SolicitudesPorRol = () => {
  const { Rol } = getUserData();
  const rolActual = String(Rol || '').toUpperCase();

  if (['ADMIN', 'USUARIO'].includes(rolActual)) {
    return <SolicitudesGestion />;
  }

  return <Solicitudes />;
};

export default SolicitudesPorRol;
