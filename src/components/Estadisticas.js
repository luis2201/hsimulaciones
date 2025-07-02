import React, { useEffect, useState } from 'react';
import Layout from './Layout';
import { getData } from '../services/apiService';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const colores = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#00bcd4', '#ff6384'];

const Estadisticas = () => {
  const [datos, setDatos] = useState({
    totalReservas: 0,
    totalHoras: 0,
    totalEstudiantes: 0,
    porJornada: [],
    porTipoPractica: [],
    topDocentes: [],
    topEscenarios: [],
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const response = await getData('reservas', true);
      const resumen = {
        totalReservas: response.length,
        totalHoras: 0,
        totalEstudiantes: 0,
        porJornada: {},
        porTipoPractica: {},
        topDocentes: {},
        topEscenarios: {},
      };

      response.forEach(r => {
        resumen.totalHoras += parseFloat(r.TiempoSesion || 0);
        resumen.totalEstudiantes += parseInt(r.NumEstudiantes || 0);

        resumen.porJornada[r.Jornada] = (resumen.porJornada[r.Jornada] || 0) + 1;
        resumen.porTipoPractica[r.TipoPractica] = (resumen.porTipoPractica[r.TipoPractica] || 0) + 1;
        resumen.topDocentes[r.Docente] = (resumen.topDocentes[r.Docente] || 0) + 1;
        resumen.topEscenarios[r.Escenario] = (resumen.topEscenarios[r.Escenario] || 0) + 1;
      });

      const toChartData = (obj) => Object.entries(obj).map(([key, value]) => ({ name: key, value }));

      setDatos({
        totalReservas: resumen.totalReservas,
        totalHoras: resumen.totalHoras.toFixed(2),
        totalEstudiantes: resumen.totalEstudiantes,
        porJornada: toChartData(resumen.porJornada),
        porTipoPractica: toChartData(resumen.porTipoPractica),
        topDocentes: toChartData(resumen.topDocentes).sort((a, b) => b.value - a.value).slice(0, 5),
        topEscenarios: toChartData(resumen.topEscenarios).sort((a, b) => b.value - a.value).slice(0, 5),
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const imprimir = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard de Estadísticas</h2>
        <button onClick={imprimir} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg">Imprimir</button>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-100 p-4 rounded shadow">
          <p className="text-lg font-semibold">Total de Reservas</p>
          <p className="text-3xl font-bold text-blue-700">{datos.totalReservas}</p>
        </div>
        <div className="bg-green-100 p-4 rounded shadow">
          <p className="text-lg font-semibold">Horas Acumuladas</p>
          <p className="text-3xl font-bold text-green-700">{datos.totalHoras}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded shadow">
          <p className="text-lg font-semibold">Estudiantes Involucrados</p>
          <p className="text-3xl font-bold text-purple-700">{datos.totalEstudiantes}</p>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Reservas por Jornada</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={datos.porJornada} dataKey="value" nameKey="name" label>
                {datos.porJornada.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={colores[i % colores.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Prácticas por Tipo</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={datos.porTipoPractica}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Top 5 Docentes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={datos.topDocentes} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="value" fill="#00bcd4" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Top 5 Escenarios</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={datos.topEscenarios} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="value" fill="#ff6384" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
};

export default Estadisticas;
