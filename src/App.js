import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Usuarios from './components/Usuarios';
import UsuarioForm from './components/UsuarioForm';
import Tecnicos from './components/Tecnicos';
import TecnicoForm from './components/TecnicoForm';
import Salas from './components/Salas';
import SalaForm from './components/SalaForm';
import Tipopracticas from './components/Tipopracticas';
import TipopracticaForm from './components/TipopracticaForm';
import Reservas from './components/Reservas';
// import ReservaForm from './components/ReservaForm';
import Perfil from './components/Perfil';
import PrivateRoute from './components/PrivateRoute';
import ReporteReservas from './components/ReporteReservas';
import ResumenEscenarios from './components/ResumenEscenarios';
import ResumenDocentes from './components/ResumenDocentes';
import ResumenAsignaturas from './components/ResumenAsignaturas';
import ResumenCarreras from './components/ResumenCarreras';
import ResumenJornadas from './components/ResumenJornadas';
import ResumenTipoPractica from './components/ResumenTipoPractica';
import Estadisticas from './components/Estadisticas';
import Comparativas from './components/Comparativas';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal redirige al login */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* Rutas privadas */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

        {/* Usuarios */}
        <Route path="/usuarios" element={<PrivateRoute><Usuarios /></PrivateRoute>} />
        <Route path="/usuarios/agregar" element={<PrivateRoute><UsuarioForm /></PrivateRoute>} />
        <Route path="/usuarios/editar/:id" element={<PrivateRoute><UsuarioForm /></PrivateRoute>} />

        {/* Técnicos */}
        <Route path="/tecnicos" element={<PrivateRoute><Tecnicos /></PrivateRoute>} />
        <Route path="/tecnicos/agregar" element={<PrivateRoute><TecnicoForm /></PrivateRoute>} />
        <Route path="/tecnicos/editar/:id" element={<PrivateRoute><TecnicoForm /></PrivateRoute>} />

        {/* Salas */}
        <Route path="/salas" element={<PrivateRoute><Salas /></PrivateRoute>} />
        <Route path="/salas/agregar" element={<PrivateRoute><SalaForm /></PrivateRoute>} />
        <Route path="/salas/editar/:id" element={<PrivateRoute><SalaForm /></PrivateRoute>} />

        {/* Tipos de práctica */}
        <Route path="/tipopracticas" element={<PrivateRoute><Tipopracticas /></PrivateRoute>} />
        <Route path="/tipopracticas/agregar" element={<PrivateRoute><TipopracticaForm /></PrivateRoute>} />
        <Route path="/tipopracticas/editar/:id" element={<PrivateRoute><TipopracticaForm /></PrivateRoute>} />

        {/* Reservas */}
        <Route path="/reservas" element={<PrivateRoute><Reservas /></PrivateRoute>} />
        {/* <Route path="/reservas/agregar" element={<PrivateRoute><ReservaForm /></PrivateRoute>} />
        <Route path="/reservas/editar/:id" element={<PrivateRoute><ReservaForm /></PrivateRoute>} /> */}

        {/* Perfil */}
        <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />

        {/* Reportes */}
        <Route path="/reportereservas" element={<PrivateRoute><ReporteReservas /></PrivateRoute>} />
        <Route path="/resumenescenarios" element={<PrivateRoute><ResumenEscenarios /></PrivateRoute>} />
        <Route path="/resumendocentes" element={<PrivateRoute><ResumenDocentes /></PrivateRoute>} />
        <Route path="/resumenasignaturas" element={<PrivateRoute><ResumenAsignaturas /></PrivateRoute>} />
        <Route path="/resumencarreras" element={<PrivateRoute><ResumenCarreras /></PrivateRoute>} />
        <Route path="/resumenjornadas" element={<PrivateRoute><ResumenJornadas /></PrivateRoute>} />
        <Route path="/resumentipopractica" element={<PrivateRoute><ResumenTipoPractica /></PrivateRoute>} />
        <Route path="/estadisticas" element={<PrivateRoute><Estadisticas /></PrivateRoute>} />
        <Route path="/comparativas" element={<PrivateRoute><Comparativas /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
