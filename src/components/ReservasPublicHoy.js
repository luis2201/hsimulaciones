import React, { useEffect, useMemo, useRef, useState } from 'react';
import config from '../config';

const API_URL = config.API_URL;
const TIEMPO_REFRESH = 30000;
const TIEMPO_OCULTAR_FINALIZADA = 15000;
const REGISTROS_POR_PAGINA = 5;
const TIEMPO_CAMBIO_PAGINA = 10000;

const ReservasPublicHoy = () => {
  const [reservas, setReservas] = useState([]);
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ahora, setAhora] = useState(new Date());
  const [paginaActual, setPaginaActual] = useState(1);

  const finalizadasRef = useRef({});

  const obtenerEstado = (r) => {
    if (r.EstadoManual && String(r.EstadoManual).trim() !== '') {
      return String(r.EstadoManual).trim().toUpperCase();
    }

    if (r.EstadoPractica && String(r.EstadoPractica).trim() !== '') {
      return String(r.EstadoPractica).trim().toUpperCase();
    }

    return 'PENDIENTE';
  };

  const ordenarReservas = (lista) => {
    const prioridad = {
      'EN CURSO': 1,
      'PENDIENTE': 2,
      'NO INICIADA': 2,
      'PROGRAMADA': 2,
      'REPROGRAMADA': 3,
      'SUSPENDIDA': 4,
      'FINALIZADA': 5
    };

    return [...lista].sort((a, b) => {
      const estadoA = obtenerEstado(a);
      const estadoB = obtenerEstado(b);

      const pA = prioridad[estadoA] || 99;
      const pB = prioridad[estadoB] || 99;

      if (pA !== pB) return pA - pB;

      const horaA = a.HoraInicio || '';
      const horaB = b.HoraInicio || '';
      return horaA.localeCompare(horaB);
    });
  };

  const filtrarReservasVisibles = (lista) => {
    const ahoraMs = Date.now();

    return lista.filter((r) => {
      const id = r.ID;
      const estado = obtenerEstado(r);

      if (estado === 'FINALIZADA') {
        if (!finalizadasRef.current[id]) {
          finalizadasRef.current[id] = ahoraMs;
          return true;
        }

        const tiempoVisible = ahoraMs - finalizadasRef.current[id];
        return tiempoVisible < TIEMPO_OCULTAR_FINALIZADA;
      }

      if (finalizadasRef.current[id]) {
        delete finalizadasRef.current[id];
      }

      return true;
    });
  };

  const cargarReservas = async () => {
    try {
      setError('');

      const response = await fetch(`${API_URL}/reservas/public/hoy`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data?.ok) {
        const lista = Array.isArray(data.reservas) ? data.reservas : [];
        const visibles = filtrarReservasVisibles(lista);
        const ordenadas = ordenarReservas(visibles);

        setReservas(ordenadas);
        setFecha(data.fecha || '');
      } else {
        setReservas([]);
        setError('No se pudo obtener la información.');
      }
    } catch (err) {
      console.error('Error al cargar reservas públicas:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReservas();

    const intervaloDatos = setInterval(() => {
      cargarReservas();
    }, TIEMPO_REFRESH);

    const intervaloReloj = setInterval(() => {
      setAhora(new Date());
    }, 1000);

    const intervaloFinalizadas = setInterval(() => {
      setReservas((prev) => {
        const visibles = filtrarReservasVisibles(prev);
        return ordenarReservas(visibles);
      });
    }, 1000);

    return () => {
      clearInterval(intervaloDatos);
      clearInterval(intervaloReloj);
      clearInterval(intervaloFinalizadas);
    };
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [reservas.length]);

  const totalPaginas = Math.max(1, Math.ceil(reservas.length / REGISTROS_POR_PAGINA));

  useEffect(() => {
    if (totalPaginas <= 1) return;

    const intervaloPaginacion = setInterval(() => {
      setPaginaActual((prev) => {
        if (prev >= totalPaginas) return 1;
        return prev + 1;
      });
    }, TIEMPO_CAMBIO_PAGINA);

    return () => clearInterval(intervaloPaginacion);
  }, [totalPaginas]);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(1);
    }
  }, [paginaActual, totalPaginas]);

  const reservasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
    const fin = inicio + REGISTROS_POR_PAGINA;
    return reservas.slice(inicio, fin);
  }, [reservas, paginaActual]);

  const getEstadoClass = (estado) => {
    switch ((estado || '').toUpperCase()) {
      case 'PENDIENTE':
      case 'NO INICIADA':
      case 'PROGRAMADA':
        return 'estado estado-pendiente';
      case 'EN CURSO':
        return 'estado estado-encurso';
      case 'FINALIZADA':
        return 'estado estado-finalizada';
      case 'SUSPENDIDA':
        return 'estado estado-suspendida';
      case 'REPROGRAMADA':
        return 'estado estado-reprogramada';
      default:
        return 'estado estado-default';
    }
  };

  const formatearHora = (hora) => {
    if (!hora) return '--:--';
    return String(hora).slice(0, 5);
  };

  const formatearFechaLarga = (fechaStr) => {
    const base = fechaStr ? new Date(`${fechaStr}T00:00:00`) : new Date();

    return base.toLocaleDateString('es-EC', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const horaActual = useMemo(() => {
    return ahora.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, [ahora]);

  const fechaActualPantalla = useMemo(() => {
    return ahora.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, [ahora]);

  return (
    <div className="public-board min-h-screen overflow-hidden">
      <style>{`
        .public-board {
          background: linear-gradient(180deg, #0b4f8a 0%, #083964 55%, #062846 100%);
          color: #0b1b2b;
        }

        .header-main {
          background: linear-gradient(90deg, #0b5fa5 0%, #0a4e89 45%, #083964 100%);
          border-bottom: 4px solid #7fd3ff;
          color: #ffffff;
        }

        .sub-header {
          background: #d9f1ff;
          color: #083964;
          border-bottom: 2px solid #7fc8f8;
        }

        .board-head {
          background: #0a4e89;
          color: #ffffff;
        }

        .row-even {
          background: #ffffff;
          color: #08233d;
        }

        .row-odd {
          background: #eaf6ff;
          color: #08233d;
        }

        .estado {
          display: inline-block;
          min-width: 150px;
          text-align: center;
          padding: 10px 16px;
          border-radius: 9999px;
          font-weight: 800;
          letter-spacing: .05em;
          text-transform: uppercase;
          animation: blinkSoft 1.2s infinite;
          box-shadow: 0 0 0 2px rgba(255,255,255,.25) inset;
        }

        .estado-pendiente {
          background: #facc15;
          color: #111827;
        }

        .estado-encurso {
          background: #16a34a;
          color: #ffffff;
        }

        .estado-finalizada {
          background: #2563eb;
          color: #ffffff;
        }

        .estado-suspendida {
          background: #dc2626;
          color: #ffffff;
        }

        .estado-reprogramada {
          background: #6b7280;
          color: #ffffff;
        }

        .estado-default {
          background: #334155;
          color: #ffffff;
        }

        @keyframes blinkSoft {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.72;
            transform: scale(1.03);
          }
        }
      `}</style>

      <div className="header-main px-8 py-5">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="Logo institucional"
              className="h-20 w-auto object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <img
              src={`${process.env.PUBLIC_URL}/logo_eco_itsup.png`}
              alt="Logo institucional"
              className="h-20 w-auto object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-wide leading-tight">
                Agenda de practicas de simulacion y desarrollo de habilidades
              </h1>
              <p className="text-base md:text-lg uppercase tracking-widest text-sky-100 mt-1">
                Información pública del día
              </p>
            </div>
          </div>

          <div className="text-right min-w-[230px]">
            <div className="text-4xl font-extrabold tracking-widest">{horaActual}</div>
            <div className="text-lg text-sky-100">{fechaActualPantalla}</div>
          </div>
        </div>
      </div>

      <div className="sub-header px-8 py-3 flex items-center justify-between font-bold uppercase tracking-wide text-sm md:text-base">
        <div>{formatearFechaLarga(fecha)}</div>
        <div>
          Página {paginaActual} de {totalPaginas} · Total visibles: {reservas.length}
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-sky-200">
          <div className="board-head grid grid-cols-[110px_110px_1.2fr_1.3fr_1.3fr_1.1fr_170px] text-sm md:text-base font-bold uppercase">
            <div className="px-4 py-4 border-r border-sky-300">Inicio</div>
            <div className="px-4 py-4 border-r border-sky-300">Fin</div>
            <div className="px-4 py-4 border-r border-sky-300">Carrera</div>
            <div className="px-4 py-4 border-r border-sky-300">Asignatura / Tema</div>
            <div className="px-4 py-4 border-r border-sky-300">Docente</div>
            <div className="px-4 py-4 border-r border-sky-300">Sala</div>
            <div className="px-4 py-4 text-center">Estado</div>
          </div>

          <div>
            {loading ? (
              <div className="py-16 text-center text-2xl text-white font-bold">
                Cargando información...
              </div>
            ) : error ? (
              <div className="py-16 text-center text-2xl text-red-200 font-bold">
                {error}
              </div>
            ) : reservas.length === 0 ? (
              <div className="py-16 text-center text-2xl text-white font-bold">
                No hay prácticas visibles para hoy.
              </div>
            ) : (
              reservasPaginadas.map((r, index) => {
                const estado = obtenerEstado(r);
                const rowClass = index % 2 === 0 ? 'row-even' : 'row-odd';

                return (
                  <div
                    key={r.ID}
                    className={`grid grid-cols-[110px_110px_1.2fr_1.3fr_1.3fr_1.1fr_170px] ${rowClass} border-t border-sky-200`}
                  >
                    <div className="px-4 py-5 border-r border-sky-200 text-3xl font-extrabold text-[#0a4e89] flex items-center">
                      {formatearHora(r.HoraInicio)}
                    </div>

                    <div className="px-4 py-5 border-r border-sky-200 text-3xl font-extrabold text-[#0a4e89] flex items-center">
                      {formatearHora(r.HoraFin)}
                    </div>

                    <div className="px-4 py-4 border-r border-sky-200 flex items-center">
                      <div className="text-base md:text-lg font-bold uppercase leading-snug">
                        {r.Carrera || 'SIN CARRERA'}
                      </div>
                    </div>

                    <div className="px-4 py-4 border-r border-sky-200">
                      <div className="text-lg font-extrabold uppercase leading-snug">
                        {r.Asignatura || 'SIN ASIGNATURA'}
                      </div>
                      <div className="text-sm mt-1 uppercase font-semibold text-slate-700">
                        {r.Tema || 'SIN TEMA'}
                      </div>
                      <div className="text-sm mt-1 text-slate-600">
                        {r.TipoPractica || 'Sin tipo'} · {r.NumEstudiantes || 0} estudiantes
                      </div>
                    </div>

                    <div className="px-4 py-4 border-r border-sky-200 flex items-center">
                      <div>
                        <div className="text-lg font-bold uppercase leading-snug">
                          {r.Docente || 'SIN DOCENTE'}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          Técnico: {r.Tecnico || 'No asignado'}
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-4 border-r border-sky-200 flex items-center">
                      <div className="text-base md:text-lg font-bold uppercase leading-snug">
                        {r.Sala || 'SIN SALA'}
                      </div>
                    </div>

                    <div className="px-4 py-4 flex items-center justify-center">
                      <span className={getEstadoClass(estado)}>
                        {estado}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#083964] text-white border-t border-sky-300 px-6 py-2 text-sm flex justify-between">
        <span>Actualización automática cada 30 segundos</span>
        <span>Cambio automático de página cada 10 segundos</span>
      </div>
    </div>
  );
};

export default ReservasPublicHoy;