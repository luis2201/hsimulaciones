import React, { useEffect, useState, useRef } from 'react';
import Layout from './Layout';
import { getData } from '../services/apiService';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Comparativas = () => {
  const [dataMensual, setDataMensual] = useState([]);
  const [anioActual] = useState(new Date().getFullYear());
  const printRef = useRef();

  useEffect(() => {
    cargarDatosComparativos();
  }, []);

  const cargarDatosComparativos = async () => {
    try {
      const response = await getData('reservas', true);
      const resumen = {};

      response.forEach(r => {
        const fecha = new Date(r.Fecha);
        const mes = fecha.getMonth();
        const anio = fecha.getFullYear();

        if (anio === anioActual) {
          resumen[mes] = (resumen[mes] || 0) + 1;
        }
      });

      const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const dataFormateada = meses.map((nombre, index) => ({ mes: nombre, reservas: resumen[index] || 0 }));
      setDataMensual(dataFormateada);
    } catch (error) {
      console.error('Error al obtener datos comparativos:', error);
    }
  };

  const imprimir = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4 print:hidden">
        <h2 className="text-2xl font-bold text-gray-800">Comparativa Mensual de Reservas ({anioActual})</h2>
        <button onClick={imprimir} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg">Imprimir</button>
      </div>

      <div ref={printRef} className="bg-white shadow-md p-4 rounded-lg">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={dataMensual}>
            <XAxis dataKey="mes" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="reservas" fill="#8884d8" name="Reservas" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Layout>
  );
};

export default Comparativas;
