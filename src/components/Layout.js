import React, { useState, useEffect } from 'react';
import { logout, getUserData, getData } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faSignOutAlt, faUser, faCog, faChevronDown } from '@fortawesome/free-solid-svg-icons';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menu, setMenu] = useState([]);
  const [submenuOpen, setSubmenuOpen] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // 🔹 Obtener Nombre y Rol desde el Token
  const { Nombres, Rol } = getUserData();

  useEffect(() => {
    cargarMenu();
  }, []);

  const cargarMenu = async () => {
    try {
      const response = await getData('permissions/menus', true);      

      if (!response.menus || !Array.isArray(response.menus)) {        
        return;
      }

      const menuData = response.menus;

      const structuredMenu = menuData
        .map(item => ({
          ...item,
          submenus: menuData.filter(sub => sub.ParentID === item.ID)
        }))
        .filter(item => item.ParentID === null)
        .sort((a, b) => {
          const aEsDashboard = a.Ruta === '/dashboard' || a.Menu?.toLowerCase() === 'dashboard';
          const bEsDashboard = b.Ruta === '/dashboard' || b.Menu?.toLowerCase() === 'dashboard';

          if (aEsDashboard && !bEsDashboard) return -1;
          if (!aEsDashboard && bEsDashboard) return 1;
          return 0;
        });
      
      setMenu(structuredMenu);

    } catch (error) {
      console.error('❌ Error al cargar el menú:', error);
      setMenu([]);
    }
  };

  const handleNavigation = (ruta) => {
    if (ruta) {
      navigate(ruta);
    }
  };

  const toggleSubmenu = (menuID) => {
    setSubmenuOpen(submenuOpen === menuID ? null : menuID);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-br from-blue-900 to-blue-600 shadow-lg transform transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-64"} md:relative md:translate-x-0 z-50`}>
        <div className="p-5">
          <h2 className="text-white text-xl font-bold">Dashboard</h2>
        </div>
        <nav className="mt-4">
          <ul className="space-y-2 text-white">
            {menu.length > 0 ? (
              menu.map((item) => (
                <li key={item.ID} className="relative">
                  <button 
                    className="p-3 w-full flex items-center justify-between hover:bg-blue-700 cursor-pointer"
                    onClick={() => item.submenus.length > 0 ? toggleSubmenu(item.ID) : handleNavigation(item.Ruta)}
                  >
                    <span>{item.Menu}</span>
                    {item.submenus.length > 0 && (
                      <FontAwesomeIcon 
                        icon={faChevronDown} 
                        className={`ml-2 transform transition-transform duration-300 ${submenuOpen === item.ID ? 'rotate-180' : 'rotate-0'}`}
                      />
                    )}
                  </button>

                  {submenuOpen === item.ID && item.submenus.length > 0 && (
                    <ul className="ml-4 bg-blue-800 rounded-lg overflow-hidden transition-all duration-300">
                      {item.submenus.map((subItem) => (
                        <li 
                          key={subItem.ID} 
                          className={`p-3 hover:bg-blue-600 cursor-pointer ${!subItem.Ruta ? 'cursor-default text-gray-400' : ''}`}
                          onClick={() => subItem.Ruta && handleNavigation(subItem.Ruta)}
                        >
                          {subItem.Menu}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))
            ) : (
              <li className="p-3 text-gray-400">No hay elementos en el menú</li>
            )}
          </ul>
        </nav>
      </div>

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="bg-white shadow-md p-4 flex justify-between items-center relative">
          <button className="md:hidden text-blue-600" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FontAwesomeIcon icon={faBars} size="lg" />
          </button>

          <h2 className="text-lg font-semibold text-gray-800">Bienvenido, {Nombres}</h2>

          {/* Menú de Usuario */}
          <div className="relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition">
              <FontAwesomeIcon icon={faUser} className="text-gray-600" />
              <span className="text-gray-700 font-medium">{Rol}</span>
            </button>

            {/* Menú Desplegable */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2 z-50">      
                {/* Opción "Mi Perfil" */}
                <button 
                  onClick={() => navigate('/perfil')} 
                  className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <FontAwesomeIcon icon={faCog} className="mr-3" />
                  Mi Perfil
                </button>
                {/* { Opción Cerrar Sesión } */}
                <hr className="border-gray-300" />
                <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-100">
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Contenido Dinámico */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
